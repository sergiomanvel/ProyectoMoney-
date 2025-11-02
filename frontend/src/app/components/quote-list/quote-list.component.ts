import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuoteService, Quote } from '../../services/quote.service';

@Component({
  selector: 'app-quote-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <div class="p-8">
        <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 px-6 pt-2">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900 leading-tight">Historial de Cotizaciones</h3>
              <p class="text-sm text-gray-500 mt-0.5">Gestiona todas tus cotizaciones</p>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm flex items-center gap-2 ml-8" (click)="loadQuotes()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refrescar
          </button>
        </div>

        <!-- Búsqueda y Filtros -->
        <div class="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div class="form-group" style="margin-bottom:0;">
              <label class="text-sm font-medium text-gray-700 mb-2 block">
                <svg class="inline w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                Buscar
              </label>
              <input
                type="text"
                [(ngModel)]="searchTerm"
                placeholder="Cliente, folio, descripción..."
                class="form-control-search"
              />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="text-sm font-medium text-gray-700 mb-2 block">
                <svg class="inline w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                </svg>
                Estado
              </label>
              <select
                [(ngModel)]="statusFilter"
                class="form-control-filter"
              >
                <option value="">Todos los estados</option>
                <option value="draft">Borrador</option>
                <option value="sent">Enviada</option>
                <option value="accepted">Aceptada</option>
                <option value="expired">Expirada</option>
              </select>
            </div>
            <div class="flex gap-3 items-center">
              <button
                *ngIf="searchTerm || statusFilter"
                (click)="clearFilters()"
                class="btn btn-ghost btn-sm"
                type="button"
              >
                Limpiar filtros
              </button>
              <div class="text-xs text-gray-500 font-medium bg-white px-3 py-1.5 rounded-md border border-gray-200">
                <span class="font-semibold text-gray-700">{{ filteredQuotes.length }}</span>
                <span class="text-gray-500"> de {{ quotes.length }} cotizaciones</span>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="isLoading" class="loading mb-4">
          <div class="spinner"></div> Cargando cotizaciones...
        </div>

        <div class="overflow-x-auto" style="overflow-x: auto !important;">
          <table class="divide-y divide-gray-200 table-clean table-header-shadow" style="min-width: 1400px;">
            <thead class="bg-gray-100">
              <tr>
                <th class="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style="min-width: 130px; padding-left: 1.25rem; padding-right: 1.25rem;">Folio</th>
                <th class="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style="padding-left: 1.5rem; padding-right: 1.5rem;">Cliente</th>
                <th class="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style="padding-left: 1.5rem; padding-right: 1.5rem;">Descripción</th>
                <th class="py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style="padding-left: 1.5rem; padding-right: 1.5rem;">Total</th>
                <th class="py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style="padding-left: 1.5rem; padding-right: 1.5rem;">Vigencia</th>
                <th class="py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style="padding-left: 1.5rem; padding-right: 1.5rem;">Estado</th>
                <th class="py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style="width: 350px; min-width: 350px; max-width: 350px; white-space: nowrap; padding-left: 1.5rem; padding-right: 1.5rem;">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let q of filteredQuotes" class="table-row">
                <td class="text-sm text-gray-900" style="padding-left: 1.25rem; padding-right: 1.25rem; padding-top: 1rem; padding-bottom: 1rem;">{{ q.folio || ('#' + q.id) }}</td>
                <td class="text-sm text-gray-900" style="padding-left: 1.5rem; padding-right: 1.5rem; padding-top: 1rem; padding-bottom: 1rem;">{{ q.client_name }}</td>
                <td class="text-sm text-gray-600" style="padding-left: 1.5rem; padding-right: 1.5rem; padding-top: 1rem; padding-bottom: 1rem;">
                  <div class="line-clamp-2" [title]="q.project_description">{{ q.project_description }}</div>
                </td>
                <td class="text-sm text-gray-900 text-right" style="padding-left: 1.5rem; padding-right: 1.5rem; padding-top: 1rem; padding-bottom: 1rem;">{{ q.total_amount | currency:'MXN':'symbol':'1.0-0' }}</td>
                <td class="text-sm text-gray-500 text-center" style="padding-left: 1.5rem; padding-right: 1.5rem; padding-top: 1rem; padding-bottom: 1rem;">{{ q.valid_until | date:'shortDate' }}</td>
                <td class="text-sm whitespace-nowrap text-center" style="padding-left: 1.5rem; padding-right: 1.5rem; padding-top: 1rem; padding-bottom: 1rem;">
                  <span [ngClass]="statusClass(q.status)">{{ q.status || 'draft' }}</span>
                </td>
                <td class="text-sm text-center" style="width: 350px; min-width: 350px; max-width: 350px; white-space: nowrap; padding-left: 1.5rem; padding-right: 1.5rem; padding-top: 1rem; padding-bottom: 1rem;">
                  <div style="display:flex; gap:2px; justify-content: center;">
                    <button class="btn btn-primary btn-sm" style="padding: 0.25rem 0.5rem; font-size: 0.7rem;" (click)="download(q.id)">PDF</button>
                    <button class="btn btn-success btn-sm" style="padding: 0.25rem 0.5rem; font-size: 0.7rem;" (click)="send(q.id)">Email</button>
                    <button class="btn btn-secondary btn-sm" style="padding: 0.25rem 0.5rem; font-size: 0.7rem;" (click)="accept(q.id)">Aceptar</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="!isLoading && filteredQuotes.length === 0 && quotes.length > 0" class="text-sm text-gray-500 mt-4">
          No hay cotizaciones que coincidan con los filtros.
        </div>
        <div *ngIf="!isLoading && quotes.length === 0" class="text-sm text-gray-500 mt-4">
          Aún no hay cotizaciones guardadas.
        </div>

        <div *ngIf="successMessage" class="mt-4 alert alert-success">{{ successMessage }}</div>
        <div *ngIf="errorMessage" class="mt-4 alert alert-error">{{ errorMessage }}</div>
      </div>
    </div>
  `
})
export class QuoteListComponent {
  quotes: Quote[] = [];
  searchTerm = '';
  statusFilter = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private quoteService: QuoteService) {
    this.loadQuotes();
  }

  get filteredQuotes() {
    let filtered = [...this.quotes];

    // Filtro por búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(q =>
        q.client_name?.toLowerCase().includes(term) ||
        q.folio?.toLowerCase().includes(term) ||
        q.project_description?.toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (this.statusFilter) {
      filtered = filtered.filter(q => (q.status || 'draft') === this.statusFilter);
    }

    return filtered;
  }

  loadQuotes() {
    this.isLoading = true;
    this.quoteService.getQuotes().subscribe({
      next: (res) => {
        this.quotes = res.quotes;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'No se pudieron cargar las cotizaciones';
        setTimeout(() => (this.errorMessage = ''), 4000);
        console.error(err);
      }
    });
  }

  download(id: number) {
    this.quoteService.downloadPDF(String(id)).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cotizacion_${id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.successMessage = 'PDF descargado';
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: () => {
        this.errorMessage = 'Error al descargar el PDF';
        setTimeout(() => (this.errorMessage = ''), 4000);
      }
    });
  }

  send(id: number) {
    this.quoteService.sendEmail(String(id)).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Email enviado';
        this.quoteService.markSent(String(id)).subscribe({ next: () => this.loadQuotes() });
        setTimeout(() => (this.successMessage = ''), 4000);
      },
      error: () => {
        this.errorMessage = 'Error al enviar el email';
        setTimeout(() => (this.errorMessage = ''), 4000);
      }
    });
  }

  accept(id: number) {
    this.quoteService.acceptQuote(String(id)).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Cotización aceptada';
        this.loadQuotes();
        setTimeout(() => (this.successMessage = ''), 4000);
      },
      error: () => {
        this.errorMessage = 'Error al aceptar la cotización';
        setTimeout(() => (this.errorMessage = ''), 4000);
      }
    });
  }

  statusClass(status?: string) {
    switch (status) {
      case 'sent': return 'badge badge-blue';
      case 'accepted': return 'badge badge-green';
      case 'expired': return 'badge badge-red';
      default: return 'badge badge-gray';
    }
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = '';
  }
}


