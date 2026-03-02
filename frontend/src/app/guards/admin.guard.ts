import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Admin Authorization Guard
 * 
 * Protects routes that require admin privileges.
 * Checks if the current user has the 'admin' role using AuthService.
 * 
 * @param _route - The activated route (unused but required by CanActivateFn)
 * @param _state - The router state (unused but required by CanActivateFn)
 * @returns true if user is admin, false otherwise
 * 
 * Usage:
 * ```typescript
 * { path: 'user-management', component: UserManagementComponent, canActivate: [authGuard, adminGuard] }
 * ```
 * 
 * Note: This guard should be used in combination with authGuard to ensure
 * the user is both authenticated and has admin privileges.
 */
export const adminGuard: CanActivateFn = (_route, _state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  if (authService.isAdmin()) {
    return true;
  }
  
  // Redirect to home if not admin
  router.navigate(['/home']);
  return false;
};
