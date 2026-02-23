import { Injectable } from '@angular/core';

export interface SignInPayload {
  email: string;
  password: string;
  rememberMe: boolean;
}

@Injectable({ providedIn: 'root' })
export class FakeAuthService {
  private readonly storageKey = 'userId';
  private readonly sessionStorageKey = 'finai-auth-session';
  private readonly rememberedSessionStorageKey = 'finai-auth-session-remembered';
  private readonly defaultUserId = '95abe8c4-ec96-45b9-a2d3-7135fd5f27c6';

  ensureUserId(): string {
    if (typeof localStorage === 'undefined') {
      return this.defaultUserId;
    }

    const existing = localStorage.getItem(this.storageKey);
    if (existing) {
      return existing;
    }

    localStorage.setItem(this.storageKey, this.defaultUserId);
    return this.defaultUserId;
  }

  signIn(payload: SignInPayload): void {
    const normalizedEmail = payload.email.trim().toLowerCase();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.sessionStorageKey, normalizedEmail || 'authenticated');
      if (payload.rememberMe) {
        localStorage.setItem(this.rememberedSessionStorageKey, 'true');
      } else {
        localStorage.removeItem(this.rememberedSessionStorageKey);
      }
    }

    this.ensureUserId();
  }

  signOut(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(this.sessionStorageKey);
    localStorage.removeItem(this.rememberedSessionStorageKey);
  }

  isAuthenticated(): boolean {
    if (typeof localStorage === 'undefined') {
      return false;
    }

    return Boolean(localStorage.getItem(this.sessionStorageKey));
  }

  canAccessProtectedRoute(): boolean {
    return true;
  }
}
