import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { catchError, tap } from "rxjs/operators";
import { of } from "rxjs";

import { Router } from "@angular/router";
import { Store } from "@ngxs/store";

import { environment } from "../../../environments/environment.development";
import { NotificationService } from "./notification.service";
import { AuthState, AuthStateModel } from "../store/state/auth.state";
import {
  LoginAction,
  ForgotPassWordAction,
  VerifyEmailOtpAction,
  UpdatePasswordAction,
  LogoutAction,
  AuthClearAction,
} from "../store/action/auth.action";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private http = inject(HttpClient);
  private store = inject(Store);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // API base URL
  private apiUrl = environment.URL;

  /**
   * Login with email and password
   * Dispatches LoginAction to update NgXS state with JWT token
   */
  login(email: string, password: string): void {
    const payload = {
      email,
      password,
      access_token: null,
      token: Date.now(),
    };

    // Dispatch action to update local state (for UI feedback)
    this.store.dispatch(new LoginAction(payload));
    console.log("Login action dispatched with payload:", payload);

    // Call backend API
    this.http
      .post(`http://localhost:3000/api/auth/admin/login`, payload)
      .pipe(
        tap(() => {
          this.notificationService.showSuccess("Login successful");
        }),
        catchError(this.handleError),
      )
      .subscribe({
        next: (response: any) => {
          // Store JWT token from backend response
          const { token, user } = response;

          // Update NgXS state with the JWT token
          this.store.dispatch(
            new LoginAction({
              email,
              password,
              access_token: token,
              token: Date.now(), // Optional: timestamp for cache invalidation
            }),
          );

          console.log("JWT Token received:", token);
        },
        error: (error) => {
          this.notificationService.showError(
            error.error?.message || "Login failed",
          );
        },
      });

    // Redirect to root after successful login
    this.router.navigate(["/"]);
  }

  /**
   * Admin login with email and password
   * Uses separate /admin/login endpoint
   */
  adminLogin(email: string, password: string): void {
    const payload = {
      email,
      password,
      access_token: null,
      token: Date.now(),
    };

    // Dispatch action to update local state
    this.store.dispatch(new LoginAction(payload));

    // Call backend admin login API
    this.http
      .post(`${this.apiUrl}/admin/login`, payload)
      .pipe(catchError(this.handleError))
      .subscribe({
        next: (response: any) => {
          const { token, user } = response;

          // Update NgXS state with the JWT token
          this.store.dispatch(
            new LoginAction({
              email,
              password,
              access_token: token,
              token: Date.now(),
            }),
          );

          console.log("Admin JWT Token received:", token);
          this.notificationService.showSuccess("Admin login successful");
        },
        error: (error) => {
          this.notificationService.showError(
            error.error?.message || "Admin login failed",
          );
        },
      });
  }

  /**
   * Logout - calls backend API to clear session, then clears local state
   */
  logout(): void {
    const payload = {
      access_token: this.store.selectSnapshot(AuthState.accessToken),
      token: Date.now(),
    };

    // Dispatch action immediately for UI feedback (loading state)
    this.store.dispatch(new LogoutAction());
    console.log("Logout action dispatched");

    // Call backend API to clear session/token on server side
    this.http
      .post(`http://localhost:3000/api/auth/admin/logout`, payload)
      .pipe(
        tap(() => {
          this.notificationService.showSuccess("Logged out successfully");
          console.log("Backend logout successful");
        }),
        catchError(this.handleError),
      )
      .subscribe({
        error: (error) => {
          // Backend logout failed but we still want to clear local state
          console.warn("Backend logout failed:", error.error?.message);
        },
      });
  }

  /**
   * Check if user is authenticated (has valid JWT token in state)
   */
  isAuthenticated(): boolean {
    const accessToken = this.store.selectSnapshot(AuthState.accessToken);
    return !!accessToken && accessToken !== null;
  }

  /**
   * Get current user email from state
   */
  getCurrentEmail(): string | null {
    const email = this.store.selectSnapshot(AuthState.email);
    return email ?? null;
  }

  /**
   * Forgot password - sends OTP to email
   */
  forgotPassword(email: string): void {
    const payload = { email };

    this.store.dispatch(new ForgotPassWordAction(payload));

    this.http
      .post(`${this.apiUrl}/auth/forgot-password`, payload)
      .pipe(
        tap(() => {
          this.notificationService.showSuccess("OTP sent to your email");
        }),
        catchError(this.handleError),
      )
      .subscribe({
        error: (error) => {
          this.notificationService.showError(
            error.error?.message || "Failed to send OTP",
          );
        },
      });
  }

  /**
   * Verify email with OTP and get password reset token
   */
  verifyEmailOtp(email: string, otp: number): void {
    const payload = { email, token: otp };

    this.store.dispatch(new VerifyEmailOtpAction(payload));

    this.http
      .post(`${this.apiUrl}/auth/verify-email-otp`, payload)
      .pipe(
        tap(() => {
          this.notificationService.showSuccess("Email verified successfully");
        }),
        catchError(this.handleError),
      )
      .subscribe({
        next: (response: any) => {
          const { reset_token } = response;
          console.log("Reset token received:", reset_token);
        },
        error: (error) => {
          this.notificationService.showError(
            error.error?.message || "Invalid OTP",
          );
        },
      });
  }

  /**
   * Update password with reset token
   */
  updatePassword(
    password: string,
    confirmPassword: string,
    resetToken: number,
  ): void {
    const payload = {
      password,
      password_confirmation: confirmPassword,
      email: this.getCurrentEmail(),
      token: resetToken,
    };

    this.store.dispatch(new UpdatePasswordAction(payload));

    this.http
      .post(`${this.apiUrl}/auth/update-password`, payload)
      .pipe(
        tap(() => {
          this.notificationService.showSuccess("Password updated successfully");
        }),
        catchError(this.handleError),
      )
      .subscribe({
        error: (error) => {
          this.notificationService.showError(
            error.error?.message || "Failed to update password",
          );
        },
      });
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): any {
    let errorMessage = "An unexpected error occurred";

    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.status === 401) {
      // Token expired or invalid - logout user
      this.logout();
      errorMessage = "Session expired. Please login again.";
    } else if (error.status === 403) {
      errorMessage = "Access forbidden";
    } else if (error.status === 404) {
      errorMessage = "Resource not found";
    }

    this.notificationService.showError(errorMessage);
    throw new Error(errorMessage);
  }
}
