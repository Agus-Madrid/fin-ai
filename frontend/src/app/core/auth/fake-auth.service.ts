import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FakeAuthService {
  private readonly storageKey = 'userId';
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
}
