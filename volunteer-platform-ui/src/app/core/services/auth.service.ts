import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, UserDto, UserRole } from '../../shared/models/auth.model';
import { ApiResponse } from '../../shared/models/api-response.model';

const TOKEN_KEY = 'jwt_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY = 'current_user';

function loadUserFromStorage(): UserDto | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) as UserDto : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authUrl  = `${environment.apiUrl}/auth`;
  private readonly usersUrl = `${environment.apiUrl}/users`;

  // Initialise both signals synchronously from localStorage —
  // the UI renders correctly on the very first frame after reload.
  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private _user  = signal<UserDto | null>(loadUserFromStorage());

  readonly isLoggedIn  = computed(() => !!this._token());
  readonly currentUser = this._user.asReadonly();
  readonly token       = this._token.asReadonly();
  readonly role        = computed<UserRole | null>(() => this._user()?.role ?? null);

  constructor(private http: HttpClient, private router: Router) {
    // Refresh user data from the API in the background so any role/name
    // changes made server-side are picked up without requiring a new login.
    if (this._token()) this.loadCurrentUser();
  }

  login(request: LoginRequest) {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.authUrl}/login`, request).pipe(
      map(r => r.data!),
      tap(data => this.setSession(data))
    );
  }

  register(request: RegisterRequest) {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.authUrl}/register`, request).pipe(
      map(r => r.data!),
      tap(data => this.setSession(data))
    );
  }

  refresh() {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return this.http.post<ApiResponse<AuthResponse>>(`${this.authUrl}/refresh`, { refreshToken: '' });
    return this.http.post<ApiResponse<AuthResponse>>(`${this.authUrl}/refresh`, { refreshToken }).pipe(
      map(r => r.data!),
      tap(data => this.setSession(data))
    );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  loadCurrentUser() {
    this.http.get<ApiResponse<UserDto>>(`${this.usersUrl}/me`).pipe(
      map(r => r.data!)
    ).subscribe({
      next: user => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this._user.set(user);
      },
      error: (err) => {
        // Only force-logout on 401; ignore transient network errors so a
        // slow/unreachable API doesn't log the user out unexpectedly.
        if (err?.status === 401) this.logout();
      }
    });
  }

  public setSession(auth: AuthResponse) {
    const token   = (auth as any).accessToken ?? (auth as any).token ?? null;
    const refresh = (auth as any).refreshToken ?? null;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      this._token.set(token);
    }
    if (refresh) {
      localStorage.setItem(REFRESH_KEY, refresh);
    }
    if (token) this.loadCurrentUser();
  }

  getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY);
  }
}
