import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';
import { joinUrl } from '../http/url.util';

export interface SignInPayload {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: AuthUser;
}

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  exp?: number;
}

type AuthStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly config = inject(AppConfigService);

  private readonly tokenStorageKey = 'finai-auth-token';
  private readonly userStorageKey = 'finai-auth-user';

  private readonly tokenState = signal<string | null>(null);
  private readonly userState = signal<AuthUser | null>(null);

  readonly accessToken = computed(() => this.tokenState());
  readonly user = computed(() => this.userState());
  readonly isAuthenticated = computed(() => {
    const token = this.tokenState();
    if (!token) {
      return false;
    }

    return !this.isTokenExpired(token);
  });

  constructor() {
    this.restoreSession();
  }

  signIn(payload: SignInPayload): Observable<void> {
    const requestBody = {
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    };

    return this.http
      .post<LoginResponse>(
        joinUrl(this.config.apiBaseUrl(), '/auth/login'),
        requestBody,
      )
      .pipe(
        tap((response) =>
          this.persistSession(
            response.accessToken,
            response.user,
            payload.rememberMe,
          ),
        ),
        map(() => undefined),
      );
  }

  signOut(options?: { navigateToLogin?: boolean }): void {
    this.clearSessionState();

    if (options?.navigateToLogin === false) {
      return;
    }

    void this.router.navigate(['/login']);
  }

  canAccessProtectedRoute(): boolean {
    if (this.isAuthenticated()) {
      return true;
    }

    this.clearSessionState();
    return false;
  }

  getAccessToken(): string | null {
    const token = this.tokenState();
    if (!token || this.isTokenExpired(token)) {
      this.clearSessionState();
      return null;
    }

    return token;
  }

  private persistSession(
    accessToken: string,
    user: AuthUser,
    rememberMe: boolean,
  ): void {
    this.clearStoredSession();

    const storage = this.pickStorage(rememberMe);
    if (!storage) {
      return;
    }

    storage.setItem(this.tokenStorageKey, accessToken);
    storage.setItem(this.userStorageKey, JSON.stringify(user));
    this.tokenState.set(accessToken);
    this.userState.set(user);
  }

  private restoreSession(): void {
    const token = this.readFromAnyStorage(this.tokenStorageKey);
    if (!token || this.isTokenExpired(token)) {
      this.clearSessionState();
      return;
    }

    const parsedStoredUser = this.readStoredUser();
    const derivedUser = parsedStoredUser ?? this.decodeUserFromToken(token);

    this.tokenState.set(token);
    this.userState.set(derivedUser);
  }

  private readStoredUser(): AuthUser | null {
    const rawUser = this.readFromAnyStorage(this.userStorageKey);
    if (!rawUser) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawUser) as Partial<AuthUser>;
      if (!parsed.id || !parsed.name || !parsed.email) {
        return null;
      }

      return {
        id: parsed.id,
        name: parsed.name,
        email: parsed.email,
      };
    } catch {
      return null;
    }
  }

  private decodeUserFromToken(token: string): AuthUser | null {
    const payload = this.decodeJwtPayload(token);
    if (!payload?.sub || !payload.email || !payload.name) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  }

  private decodeJwtPayload(token: string): JwtPayload | null {
    const tokenParts = token.split('.');
    if (tokenParts.length < 2) {
      return null;
    }

    try {
      const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
      const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const decoded = atob(normalized);
      return JSON.parse(decoded) as JwtPayload;
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeJwtPayload(token);
    if (!payload?.exp) {
      return true;
    }

    const currentUnixTime = Math.floor(Date.now() / 1000);
    return payload.exp <= currentUnixTime;
  }

  private clearSessionState(): void {
    this.clearStoredSession();
    this.tokenState.set(null);
    this.userState.set(null);
  }

  private clearStoredSession(): void {
    this.removeFromAllStorages(this.tokenStorageKey);
    this.removeFromAllStorages(this.userStorageKey);
  }

  private pickStorage(rememberMe: boolean): AuthStorage | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return rememberMe ? localStorage : sessionStorage;
  }

  private readFromAnyStorage(key: string): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  }

  private removeFromAllStorages(key: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}
