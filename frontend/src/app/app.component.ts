import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuoteFormComponent } from './components/quote-form/quote-form.component';
import { QuoteViewerComponent } from './components/quote-viewer/quote-viewer.component';
import { QuoteListComponent } from './components/quote-list/quote-list.component';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, QuoteFormComponent, QuoteViewerComponent, QuoteListComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="header-cool bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div class="container mx-auto px-4 py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="header-icon w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md border border-white border-opacity-30">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div>
                <h1 class="text-3xl font-bold text-white tracking-tight">AutoQuote</h1>
                <p class="text-sm text-blue-100 mt-1">Generador de Cotizaciones con IA</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
          <!-- Welcome Section -->
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">
              Genera Cotizaciones Profesionales en Minutos
            </h2>
            <p class="text-lg text-gray-600 max-w-2xl mx-auto">
              Nuestra IA analiza tu proyecto y crea cotizaciones detalladas y profesionales 
              que puedes personalizar y enviar a tus clientes.
            </p>
          </div>

          <!-- Quote Form -->
          <div class="mb-8">
            <app-quote-form 
              #quoteForm
              (quoteGenerated)="onQuoteGenerated($event)"
              [isLoading]="isLoading">
            </app-quote-form>
          </div>

          <!-- Quote Viewer -->
          <div *ngIf="generatedQuote" class="fade-in">
            <app-quote-viewer 
              [quote]="generatedQuote"
              [quoteId]="quoteId"
              (newQuote)="onNewQuote()">
            </app-quote-viewer>
          </div>

          <!-- Historial -->
          <div class="mt-12">
            <app-quote-list></app-quote-list>
          </div>

          <!-- Features Section -->
          <div *ngIf="!generatedQuote" class="mt-16">
            <h3 class="text-2xl font-bold text-center text-gray-900 mb-8">
              ¿Por qué elegir AutoQuote?
            </h3>
            <div class="grid md:grid-cols-3 gap-8">
              <div class="text-center">
                <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <h4 class="text-lg font-semibold text-gray-900 mb-2">Rápido y Eficiente</h4>
                <p class="text-gray-600">Genera cotizaciones profesionales en segundos usando inteligencia artificial.</p>
              </div>
              <div class="text-center">
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h4 class="text-lg font-semibold text-gray-900 mb-2">Profesional</h4>
                <p class="text-gray-600">PDFs con diseño profesional que impresionan a tus clientes.</p>
              </div>
              <div class="text-center">
                <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h4 class="text-lg font-semibold text-gray-900 mb-2">Fácil de Usar</h4>
                <p class="text-gray-600">Interfaz intuitiva que no requiere conocimientos técnicos.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="footer-elegant-compact">
        <div class="container mx-auto px-4 py-8">
          <div class="footer-content">
            <div class="footer-logo-mini">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <p class="footer-brand-name">AutoQuote</p>
            <p class="footer-tagline">Generador de cotizaciones profesionales con IA</p>
            <div class="footer-divider-mini"></div>
            <p class="footer-copyright-mini">
              © 2024 AutoQuote
            </p>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .min-h-screen { min-height: 100vh; }
    .bg-gray-50 { background-color: #f8fafc; }
    .bg-white { background-color: white; }
    .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
    .border-b { border-bottom-width: 1px; }
    .border-gray-200 { border-color: #e5e7eb; }
    .container { max-width: 1200px; margin: 0 auto; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
    .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .space-x-3 > * + * { margin-left: 0.75rem; }
    .w-10 { width: 2.5rem; }
    .h-10 { height: 2.5rem; }
    .bg-blue-600 { background-color: #2563eb; }
    .rounded-lg { border-radius: 0.5rem; }
    .w-6 { width: 1.5rem; }
    .h-6 { height: 1.5rem; }
    .text-white { color: white; }
    .text-2xl { font-size: 1.5rem; line-height: 2rem; }
    .font-bold { font-weight: 700; }
    .text-gray-900 { color: #111827; }
    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .text-gray-500 { color: #6b7280; }
    .text-gray-600 { color: #4b5563; }
    .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
    .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-8 { margin-bottom: 2rem; }
    .mt-16 { margin-top: 4rem; }
    .max-w-4xl { max-width: 56rem; }
    .max-w-2xl { max-width: 42rem; }
    .text-center { text-align: center; }
    .grid { display: grid; }
    .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .gap-8 { gap: 2rem; }
    .w-16 { width: 4rem; }
    .h-16 { height: 4rem; }
    .bg-blue-100 { background-color: #dbeafe; }
    .bg-green-100 { background-color: #dcfce7; }
    .bg-purple-100 { background-color: #f3e8ff; }
    .rounded-full { border-radius: 9999px; }
    .justify-center { justify-content: center; }
    .w-8 { width: 2rem; }
    .h-8 { height: 2rem; }
    .text-blue-600 { color: #2563eb; }
    .text-green-600 { color: #16a34a; }
    .text-purple-600 { color: #9333ea; }
    .font-semibold { font-weight: 600; }
    .mb-2 { margin-bottom: 0.5rem; }
    .border-t { border-top-width: 1px; }
    .mt-2 { margin-top: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    
    /* Header Cool Styles */
    .header-cool {
      background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%);
      position: relative;
      overflow: hidden;
    }
    .header-cool::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
      opacity: 0.3;
    }
    .header-icon {
      position: relative;
      z-index: 1;
    }
    
    .text-white { color: white; }
    .tracking-tight { letter-spacing: -0.025em; }
    .mt-1 { margin-top: 0.25rem; }
    .w-12 { width: 3rem; }
    .h-12 { height: 3rem; }
    .w-7 { width: 1.75rem; }
    .h-7 { height: 1.75rem; }
    .bg-opacity-20 { background-color: rgba(255, 255, 255, 0.2); }
    .bg-opacity-30 { background-color: rgba(255, 255, 255, 0.3); }
    .border-opacity-30 { border-color: rgba(255, 255, 255, 0.3); }
    .backdrop-blur-sm { backdrop-filter: blur(4px); }
    .rounded-xl { border-radius: 0.75rem; }
    .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
    .shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
    .text-blue-100 { color: #dbeafe; }
    
    /* Footer Elegant Compact */
    .footer-elegant-compact {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow: hidden;
    }
    .footer-elegant-compact::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10c-2 0-2 2-2 4s0 4 2 4 2-2 2-4 0-4-2-4z' fill='%23ffffff' opacity='0.03'/%3E%3C/svg%3E");
    }
    .footer-content {
      position: relative;
      z-index: 1;
      text-align: center;
      color: white;
    }
    .footer-logo-mini {
      margin: 0 auto 1rem;
      width: 3rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 50%;
      color: white;
    }
    .footer-brand-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
      margin: 0 0 0.5rem;
    }
    .footer-tagline {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 1.5rem;
    }
    .footer-divider-mini {
      width: 60px;
      height: 2px;
      background: rgba(255, 255, 255, 0.4);
      margin: 0 auto 1.5rem;
      border-radius: 1px;
    }
    .footer-copyright-mini {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.7);
      margin: 0;
    }
  `]
})
export class AppComponent {
  title = 'AutoQuote';
  generatedQuote: any = null;
  quoteId: string | null = null;
  isLoading = false;

  @ViewChild('quoteForm') quoteFormComponent!: QuoteFormComponent;

  onQuoteGenerated(data: { quote: any, quoteId: string }) {
    this.generatedQuote = data.quote;
    this.quoteId = data.quoteId;
    this.isLoading = false;
  }

  onNewQuote() {
    this.generatedQuote = null;
    this.quoteId = null;
    // Limpiar el formulario
    if (this.quoteFormComponent) {
      this.quoteFormComponent.resetForm();
    }
  }
}
