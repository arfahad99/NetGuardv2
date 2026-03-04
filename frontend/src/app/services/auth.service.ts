import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private userKey = 'user_data';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) { }

  login(username: string, password: string): Observable<any> {
    const basicAuth = 'Basic ' + btoa(username + ':' + password);
    const headers = { 'Authorization': basicAuth };

    return this.http.post(`${this.apiUrl}/auth/Signin`, {}, { headers }).pipe(
      tap((response: any) => {
        if (response.token) {
          this.setToken(response.token);
          const user = {
            username: response.username || username,
            email: response.email || '',
            is_admin: response.role === 'admin' || false,
            role: response.role || 'user'
          };
          this.setUser(user);
          this.isAuthenticatedSubject.next(true);
        }
      }),
      tap({
        error: (error) => {
          // Keep silent or handle errors without exposing details to console in production
        }
      })
    );
  }

  signup(username: string, email: string, password: string, phone: string = ''): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/Signup`, { username, email, password, phone });
  }

  verifyEmail(username: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/Verify`, { username, code });
  }

  resendCode(username: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/ResendCode`, { username });
  }

  logout(): void {
    const token = this.getToken();
    if (token) {
      // Create headers manually for the signout request to bypass potential interceptor issues
      const headers = { 'x-access-token': token };
      this.http.post(`${this.apiUrl}/auth/Signout`, {}, { headers }).subscribe({
        next: () => this.clearLocalState(),
        error: () => this.clearLocalState() // Clear local state even if backend fails
      });
    } else {
      this.clearLocalState();
    }
  }

  private clearLocalState(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/signin']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }

  setUser(user: any): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getUser(): any {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user ? user.is_admin === true : false;
  }

  getUserId(): number | null {
    const user = this.getUser();
    return user ? user.id : null;
  }

  getUsername(): string | null {
    const user = this.getUser();
    return user ? user.username : null;
  }

  getRole(): string {
    const user = this.getUser();
    if (!user) return 'guest';
    return user.is_admin ? 'admin' : 'user';
  }

  signout(): Observable<any> {
    return new Observable(observer => {
      this.logout();
      observer.next({ success: true });
      observer.complete();
    });
  }

  signin(username: string, password: string): Observable<any> {
    return this.login(username, password);
  }

  setLoginState(username: string): void {
    // Optional: Store additional login state if needed
  }

  clearLoginState(): void {
    // Optional: Clear additional login state if needed
  }

  guestLogin(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/GuestLogin`, {}).pipe(
      tap((response: any) => {
        if (response.token) {
          this.setToken(response.token);
          const user = {
            username: response.username,
            email: response.email || '',
            is_admin: false,
            role: 'guest'
          };
          this.setUser(user);
          this.isAuthenticatedSubject.next(true);
        }
      }),
      tap({
        error: (error) => {
          // Handle error silently
        }
      })
    );
  }

  /**
   * Check if user can view data
   * All authenticated users can view
   */
  canView(): boolean {
    return this.isLoggedIn();
  }

  /**
   * Check if user can edit data
   * Standard users and admins can edit, guests cannot
   */
  canEdit(): boolean {
    return this.isLoggedIn() && !this.isGuest();
  }

  /**
   * Check if user can delete data
   * Only admins can delete
   */
  canDelete(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can create new data
   * Standard users and admins can create, guests cannot
   */
  canCreate(): boolean {
    return this.isLoggedIn() && !this.isGuest();
  }

  /**
   * Check if user is a guest (read-only access)
   */
  isGuest(): boolean {
    const user = this.getUser();
    return user && user.username && user.username.startsWith('guest');
  }

  /**
   * Check if user is a standard user (can view and edit, but not delete)
   */
  isStandardUser(): boolean {
    const user = this.getUser();
    return user && user.role === 'user' && !user.is_admin;
  }

  /**
   * Get user role display name
   */
  getRoleDisplayName(): string {
    const user = this.getUser();
    if (!user) return 'Guest';

    if (user.is_admin) return 'Administrator';
    if (this.isGuest()) return 'Guest (Read-only)';
    return 'Standard User';
  }
}
