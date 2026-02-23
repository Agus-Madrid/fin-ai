import { registerLocaleData } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import localeEsUy from '@angular/common/locales/es-UY';

registerLocaleData(localeEsUy);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
