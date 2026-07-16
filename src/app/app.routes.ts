import { Routes } from "@angular/router";

import { AuthGuard } from "./core/guard/auth.guard";
import { fullRoutes } from "./shared/routes/full.routes";
import { content } from "./shared/routes/routes";

export const routes: Routes = [
  // Auth routes - login/register/forgot-password are public, other auth routes require guard
  {
    path: "auth",
    loadChildren: () =>
      import("./components/auth/auth.routes").then((m) => m.auth),
    // Removed canActivateChild to allow public access to auth pages
    canActivate: [AuthGuard],
  },

  // Protected content routes (dashboard, products, etc.) with content layout
  {
    path: "",
    loadComponent: () =>
      import("./shared/components/layout/content/content").then(
        (m) => m.Content,
      ),
    canActivate: [AuthGuard], // Apply guard to root route - redirects unauthenticated users to login
    runGuardsAndResolvers: "always", // Re-evaluate guards after navigation
    children: content, // Load child routes for dashboard, products, account, etc.
  },

  // Full layout routes (admin panel) - only for specific paths if needed
  {
    path: "admin",
    loadComponent: () =>
      import("./shared/components/layout/full/full").then((m) => m.Full),
    children: fullRoutes,
  },

  // Catch-all for 404 errors
  {
    path: "**",
    loadComponent: () =>
      import("./errors/error404/error404").then((m) => m.Error404),
    canActivate: [AuthGuard],
  },
];
