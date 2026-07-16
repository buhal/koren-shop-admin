import { isPlatformBrowser } from "@angular/common";
import { Injectable, PLATFORM_ID, inject } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Event,
  NavigationEnd,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from "@angular/router";

import { Store } from "@ngxs/store";
import { Observable, Subject, of } from "rxjs";
import { catchError, filter, map, switchMap, take, tap } from "rxjs/operators";

import { AuthService } from "../../shared/services/auth.service";
import { AuthState } from "../../shared/store/state/auth.state";
import { NavService } from "../../shared/services/nav.service";
import { GetUserDetailsAction } from "../../shared/store/action/account.action";
import { GetNotificationAction } from "../../shared/store/action/notification.action";
import { GetBadgesAction } from "../../shared/store/action/sidebar.action";

@Injectable({
  providedIn: "root",
})
export class AuthGuard implements CanActivate, CanActivateChild {
  private authService = inject(AuthService);
  private store = inject(Store);
  private router = inject(Router);
  private navService = inject(NavService);
  private platformId = inject<Object>(PLATFORM_ID);

  // Subject to track the intended navigation URL before redirects are processed
  private navigationSubject = new Subject<Event>();

  constructor() {
    // Subscribe to router events to capture the target URL during navigation
    this.router.events
      .pipe(filter((event: Event) => event instanceof NavigationEnd))
      .subscribe((event: Event) => {
        const navEnd = event as NavigationEnd;
        // Emit the final URL after navigation completes
        this.navigationSubject.next(navEnd);
      });
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean | UrlTree> | boolean | UrlTree {
    console.log("=== AUTH GUARD CANACTIVATE CALLED ===");
    if (isPlatformBrowser(this.platformId)) {
      // Running in the browser, perform auth check using NgXS state selector
      return this.checkAuthStatus().pipe(
        switchMap((isAuthenticated) => {
          console.log("=== AUTH GUARD CHECK AUTH STATUS ===", isAuthenticated);
          if (isAuthenticated) {
            const targetUrl = state.url;
            if (targetUrl === "/auth/login") {
              // User is authenticated but trying to access login page - redirect to home
              const redirectUrl = this.router.createUrlTree(["/"]);
              return of(redirectUrl);
            }
            this.initializeData();
            return of(true);
          } else {
            // User is not authenticated - check if already on login page
            if (state.url === "/auth/login") {
              // Already on login, allow access
              return of(true);
            }
            // Redirect to login page synchronously to prevent infinite loop
            const redirectUrl = this.router.createUrlTree(["/auth/login"]);
            return of(redirectUrl);
          }
        }),
      );
    } else {
      return true;
    }
  }

  canActivateChild(): Observable<boolean> | boolean {
    if (isPlatformBrowser(this.platformId)) {
      return this.checkAuthStatus().pipe(
        switchMap((isAuthenticated) => {
          if (isAuthenticated) {
            // User is authenticated, allow access to child routes
            return of(true);
          }
          // User is not authenticated - deny access to child routes
          return of(false);
        }),
      );
    } else {
      // Allow SSR to proceed without child route restrictions
      return true;
    }
  }

  /**
   * Check if user is authenticated using NgXS state selector
   * Uses AuthState.accessToken selector which returns the JWT token from auth.state.ts
   */
  private checkAuthStatus(): Observable<boolean> {
    return this.store.select(AuthState.accessToken).pipe(
      map((access_token: string | null) => {
        const isAuthenticated =
          !!access_token &&
          typeof access_token === "string" &&
          access_token.length > 0;
        return isAuthenticated;
      }),
      catchError(() => {
        return of(false); // Handle errors, e.g., when auth state is not available
      }),
    );
  }

  /**
   * Initialize user data after successful authentication
   * Fetches user details, notifications, and sidebar badges
   */
  private initializeData(): void {
    this.navService.sidebarLoading = true;
    this.store.dispatch(new GetBadgesAction());
    this.store.dispatch(new GetNotificationAction());
    this.store.dispatch(new GetUserDetailsAction()).subscribe({
      complete: () => {
        this.navService.sidebarLoading = false;
      },
    });
  }
}
