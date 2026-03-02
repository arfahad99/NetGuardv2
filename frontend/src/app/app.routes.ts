import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/signin', pathMatch: 'full' },
  { path: 'signin', loadComponent: () => import('./pages/Signin/signin').then(m => m.SigninComponent) },
  { path: 'signup', loadComponent: () => import('./pages/signup/signup.component').then(m => m.SignupComponent) },
  {
    path: '',
    loadComponent: () => import('./navigation/navigation').then(m => m.NavigationComponent),
    canActivate: [authGuard],
    children: [
      { path: 'home', loadComponent: () => import('./pages/welcome/welcome.component').then(m => m.WelcomeComponent) },
      { path: 'dashboard', loadComponent: () => import('./home/home').then(m => m.HomeComponent) },
      { path: 'devices', loadComponent: () => import('./pages/devices/devices.component').then(m => m.DevicesComponent) },
      { path: 'alerts', loadComponent: () => import('./pages/alerts/alerts.component').then(m => m.AlertsComponent) },
      { path: 'network-health', loadComponent: () => import('./pages/network-health/network-health.component').then(m => m.NetworkHealthComponent) },
      { path: 'qos-events', loadComponent: () => import('./pages/qos-events/qos-events.component').then(m => m.QosEventsComponent) },
      { path: 'sessions', loadComponent: () => import('./pages/sessions/sessions.component').then(m => m.SessionsComponent) },
      { path: 'cloud-health', loadComponent: () => import('./pages/cloud-health/cloud-health.component').then(m => m.CloudHealthComponent) },


      // User Management (Admin only)
      {
        path: 'manage-users',
        loadComponent: () => import('./pages/user-management/user-list.component').then(m => m.UserListComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'manage-users/new',
        loadComponent: () => import('./pages/user-management/user-create.component').then(m => m.UserCreateComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'manage-users/:id',
        loadComponent: () => import('./pages/user-management/user-edit.component').then(m => m.UserEditComponent),
        canActivate: [adminGuard]
      }
    ]
  },
  { path: '**', redirectTo: '/signin' }
];
