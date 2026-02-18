import { Injectable, computed, signal } from '@angular/core';

export interface AppConfig {
  apiBaseUrl: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly state = signal<AppConfig>({
    apiBaseUrl: 'http://localhost:3000'
  });

  readonly apiBaseUrl = computed(() => this.state().apiBaseUrl);

  async load(): Promise<void> {
    if (typeof fetch === 'undefined') {
      return;
    }

    try {
      const response = await fetch('/env.json', { cache: 'no-store' });
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as Partial<AppConfig>;
      if (data.apiBaseUrl) {
        this.state.set({ apiBaseUrl: data.apiBaseUrl });
      }
    } catch {
      // Keep defaults on any error
    }
  }
}
