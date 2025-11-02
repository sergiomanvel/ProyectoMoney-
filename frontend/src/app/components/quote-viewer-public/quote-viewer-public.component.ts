import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { QuoteService } from '../../services/quote.service';

@Component({
  selector: 'app-quote-viewer-public',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-4xl mx-auto px-4">
        <div *ngIf="isLoading" class="text-center py-12">
          <div class="loading">
            <div class="spinner"></div>
            <p class="mt-4 text-gray-600">Cargando cotización...</p>
          </div>
        </div>

        <div *ngIf="errorMessage && !isLoading" class="card p-6 mb-6">
          <div class="alert alert-error">
            {{ errorMessage }}
          </div>
          <button class="btn btn-secondary mt-4" (click)="goHome()">Volver al inicio</button>
        </div>

        <div *ngIf="quote && !isLoading" class="fade-in">
          <!-- Header público -->
          <div class="card mb-6">
            <div class="p-6 border-b border-gray-200">
              <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ quote.generated_content?.title || 'Cotización' }}</h1>
              <p class="text-sm text-gray-500">Folio: <strong>{{ quote.folio }}</strong></p>
            </div>
          </div>

          <!-- Cotización -->
          <div class="card p-6 mb-6">
            <div class="mb-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h2>
              <p class="text-gray-700"><strong>Cliente:</strong> {{ quote.client_name }}</p>
              <p class="text-gray-700"><strong>Email:</strong> {{ quote.client_email }}</p>
            </div>

            <div class="mb-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Descripción del Proyecto</h2>
              <p class="text-gray-700">{{ quote.project_description }}</p>
            </div>

            <!-- Items -->
            <div class="mb-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Detalle de Servicios</h2>
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr *ngFor="let item of quote.generated_content?.items">
                    <td class="px-4 py-3 text-sm text-gray-900">{{ item.description }}</td>
                    <td class="px-4 py-3 text-sm text-center text-gray-900">{{ item.quantity }}</td>
                    <td class="px-4 py-3 text-sm text-right text-gray-900">{{ item.unitPrice | currency:'MXN':'symbol':'1.0-0' }}</td>
                    <td class="px-4 py-3 text-sm text-right font-medium text-gray-900">{{ item.total | currency:'MXN':'symbol':'1.0-0' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Totales -->
            <div class="border-t border-gray-200 pt-4">
              <div class="flex justify-end">
                <div class="w-64">
                  <div class="flex justify-between py-2">
                    <span class="text-sm text-gray-600">Subtotal:</span>
                    <span class="text-sm text-gray-900">{{ quote.generated_content?.subtotal | currency:'MXN':'symbol':'1.0-0' }}</span>
                  </div>
                  <div class="flex justify-between py-2">
                    <span class="text-sm text-gray-600">IVA:</span>
                    <span class="text-sm text-gray-900">{{ quote.generated_content?.tax | currency:'MXN':'symbol':'1.0-0' }}</span>
                  </div>
                  <div class="flex justify-between py-3 border-t border-gray-200">
                    <span class="text-lg font-semibold text-gray-900">Total:</span>
                    <span class="text-lg font-semibold text-green-600">{{ quote.generated_content?.total | currency:'MXN':'symbol':'1.0-0' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Términos -->
            <div class="mt-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-3">Términos y Condiciones</h2>
              <ul class="text-sm text-gray-700 space-y-1">
                <li *ngFor="let term of quote.generated_content?.terms">• {{ term }}</li>
              </ul>
              <p class="text-sm text-gray-500 mt-3"><strong>Válida hasta:</strong> {{ quote.valid_until | date:'shortDate' }}</p>
            </div>

            <!-- Acciones -->
            <div class="mt-8 pt-6 border-t border-gray-200">
              <div class="flex flex-col sm:flex-row gap-4">
                <button class="btn btn-success btn-lg flex-1" (click)="acceptQuote()" [disabled]="isAccepting || quote.status === 'accepted'">
                  <span *ngIf="isAccepting" class="loading">
                    <div class="spinner"></div>
                    Aceptando...
                  </span>
                  <span *ngIf="!isAccepting && quote.status !== 'accepted'">
                    ✓ Aceptar Cotización
                  </span>
                  <span *ngIf="!isAccepting && quote.status === 'accepted'">
                    ✓ Cotización Aceptada
                  </span>
                </button>
                <button class="btn btn-primary btn-lg" (click)="downloadPDF()">
                  📄 Descargar PDF
                </button>
              </div>
              <div *ngIf="successMessage" class="mt-4 alert alert-success">{{ successMessage }}</div>
              <div *ngIf="errorMessage" class="mt-4 alert alert-error">{{ errorMessage }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class QuoteViewerPublicComponent implements OnInit {
  quote: any = null;
  isLoading = true;
  isAccepting = false;
  errorMessage = '';
  successMessage = '';
  token = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quoteService: QuoteService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        this.loadQuoteByToken();
      } else {
        this.errorMessage = 'Token de cotización no válido';
        this.isLoading = false;
      }
    });
  }

  loadQuoteByToken() {
    this.isLoading = true;
    this.quoteService.getQuoteByToken(this.token).subscribe({
      next: (res) => {
        this.quote = res.quote;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'No se pudo cargar la cotización. El link puede haber expirado.';
        console.error(err);
      }
    });
  }

  acceptQuote() {
    if (!this.quote?.id) return;
    this.isAccepting = true;
    this.quoteService.acceptQuote(String(this.quote.id)).subscribe({
      next: (res) => {
        this.isAccepting = false;
        this.successMessage = 'Cotización aceptada exitosamente';
        this.quote.status = 'accepted';
        setTimeout(() => (this.successMessage = ''), 5000);
      },
      error: () => {
        this.isAccepting = false;
        this.errorMessage = 'Error al aceptar la cotización';
        setTimeout(() => (this.errorMessage = ''), 5000);
      }
    });
  }

  downloadPDF() {
    if (!this.quote?.id) return;
    this.quoteService.downloadPDF(String(this.quote.id)).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cotizacion_${this.quote.folio || this.quote.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMessage = 'Error al descargar el PDF';
        setTimeout(() => (this.errorMessage = ''), 5000);
      }
    });
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
