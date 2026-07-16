import { Injectable, inject } from "@angular/core";
import { Router } from "@angular/router";

import { Store, State, Selector, Action, StateContext } from "@ngxs/store";

import { AuthService } from "../../services/auth.service";
import { NotificationService } from "../../services/notification.service";
import {
  AccountClearAction,
  GetUserDetailsAction,
} from "../action/account.action";
import {
  ForgotPassWordAction,
  InitAction,
  LoginAction,
  VerifyEmailOtpAction,
  UpdatePasswordAction,
  LogoutAction,
  AuthClearAction,
} from "../action/auth.action";
import { GetNotificationAction } from "../action/notification.action";
import { GetSettingOptionAction } from "../action/setting.action";
import { GetBadgesAction } from "../action/sidebar.action";

export interface AuthStateModel {
  email: string;
  token: string | number;
  access_token: string | null;
  permissions: [];
}

@State<AuthStateModel>({
  name: "auth",
  defaults: {
    email: "",
    token: "",
    access_token: null,
    permissions: [],
  },
})
@Injectable()
export class AuthState {
  private store = inject(Store);
  router = inject(Router);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  @Selector()
  static accessToken(state: AuthStateModel) {
    return state.access_token;
  }

  @Selector()
  static isAuthenticated(state: AuthStateModel) {
    return !!state.access_token;
  }

  @Selector()
  static email(state: AuthStateModel) {
    return state.email;
  }

  @Selector()
  static token(state: AuthStateModel) {
    return state.token;
  }

  @Action(InitAction)
  init(_ctx: StateContext<AuthStateModel>) {
    // Initialize state with defaults to ensure NgXS store is ready before guards run
    this.store.dispatch(new GetNotificationAction());
    this.store.dispatch(new GetSettingOptionAction());
    this.store.dispatch(new GetBadgesAction());
  }

  @Action(LoginAction)
  login(ctx: StateContext<AuthStateModel>, action: LoginAction) {
    this.notificationService.notification = false;
    // Update state with payload from action (email, token, access_token)
    ctx.patchState({
      email: action.payload.email,
      token: action.payload.token,
      access_token: action.payload.access_token,
      permissions: [],
    });
    this.store.dispatch(new GetUserDetailsAction());
    this.store.dispatch(new GetBadgesAction());
    this.store.dispatch(new GetNotificationAction());
    this.store.dispatch(new GetSettingOptionAction());
    this.router.navigate(["/"]); // Redirect to home page after successful admin login
  }

  @Action(ForgotPassWordAction)
  forgotPassword(
    _ctx: StateContext<AuthStateModel>,
    _action: ForgotPassWordAction,
  ) {
    this.notificationService.notification = false;
    // Forgot Password Logic Here
  }

  @Action(VerifyEmailOtpAction)
  verifyEmail(
    _ctx: StateContext<AuthStateModel>,
    _action: VerifyEmailOtpAction,
  ) {
    this.notificationService.notification = false;
    // Verify Email Logic Here
  }

  @Action(UpdatePasswordAction)
  updatePassword(
    _ctx: StateContext<AuthStateModel>,
    _action: UpdatePasswordAction,
  ) {
    this.notificationService.notification = false;
    // Update Password Logic Here
  }

  @Action(LogoutAction)
  logout(_ctx: StateContext<AuthStateModel>, action: LogoutAction) {
    // Show success notification before clearing state
    this.notificationService.showSuccess("Logged out successfully");

    // Dispatch action to clear auth state
    this.store.dispatch(new AuthClearAction()).subscribe({
      complete: () => {
        // Navigate to login page after state is cleared
        void this.router.navigate(["/auth/login"]);
      },
      error: (error) => {
        console.error("Failed to clear auth state:", error);
        // Still navigate even if clearing state fails
        void this.router.navigate(["/auth/login"]);
      },
    });
  }

  @Action(AuthClearAction)
  authClear(ctx: StateContext<AuthStateModel>) {
    ctx.patchState({
      email: "",
      token: "",
      access_token: null,
      permissions: [],
    });
    this.store.dispatch(new AccountClearAction());
  }
}
