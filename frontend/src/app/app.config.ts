import { APP_INITIALIZER, ApplicationConfig, inject, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authHttpInterceptor } from './core/auth/auth.interceptor';
import { AppConfigService } from './core/config/app-config.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authHttpInterceptor])),
    {
      provide: LOCALE_ID,
      useValue: 'es-UY'
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const config = inject(AppConfigService);
        return () => config.load();
      }
    }
  ]
};
