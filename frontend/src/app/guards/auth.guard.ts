import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';

/**
 * Authentication Guard
 * 
 * Protects routes that require user authentication.
 * Checks for the presence of an authentication token in localStorage.
 * 
 * @param _route - The activated route (unused but required by CanActivateFn)
 * @param _state - The router state (unused but required by CanActivateFn)
 * @returns true if authenticated, false otherwise
 * 
 * Usage:
 * ```typescript
 * { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }
 * ```
 */
export const authGuard: CanActivateFn = (_route, _state) => {
  const router = inject(Router);
  const token = localStorage.getItem('auth_token');
  
  if (token) {
    return true;
  }
  
  // Redirect to signin if not authenticated
  router.navigate(['/signin']);
  return false;
};
