import { bootstrapApplication } from '@angular/platform-browser';
import { AppShellComponent } from './app/app-shell.component';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom, LOCALE_ID } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { registerLocaleData } from '@angular/common';
import localeEsMX from '@angular/common/locales/es-MX';
import { QuoteViewerPublicComponent } from './app/components/quote-viewer-public/quote-viewer-public.component';
import { AppComponent } from './app/app.component';

// Registrar locale español (México) para formato de moneda/fecha
registerLocaleData(localeEsMX);

const routes: Routes = [
  {
    path: 'quote/view',
    component: QuoteViewerPublicComponent
  },
  {
    path: '',
    component: AppComponent
  }
];

bootstrapApplication(AppShellComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(FormsModule, ReactiveFormsModule),
    { provide: LOCALE_ID, useValue: 'es-MX' }
  ]
}).catch(err => console.error(err));
