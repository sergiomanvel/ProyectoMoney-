import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuoteService, QuoteItem } from '../../services/quote.service';

@Component({
  selector: 'app-quote-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card card-elevated">
      <div class="p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-900">
            Cotización Generada
          </h3>
          <div class="flex items-center space-x-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              Generada con IA
            </span>
            <span
              *ngIf="fallbackActive"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
            >
              <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.518 11.594c.75 1.335-.213 3.007-1.742 3.007H3.481c-1.53 0-2.492-1.672-1.742-3.007L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-.25-5.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z" clip-rule="evenodd"></path>
              </svg>
              Fallback activo
            </span>
            <button
              type="button"
              (click)="toggleDebug()"
              class="inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-xs font-medium text-gray-600 hover:text-gray-900 hover:border-gray-400 transition"
            >
              <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
              {{ showDebug ? 'Ocultar debug' : 'Ver debug' }}
            </button>
          </div>
        </div>

        <!-- Quote Preview -->
        <div class="bg-gray-50 rounded-lg p-6 mb-6">
          <div class="text-center mb-6">
            <h4 class="text-2xl font-bold text-gray-900 mb-2">{{ quote.title }}</h4>
            <p class="text-gray-600">Cliente: {{ quote.clientName }}</p>
          </div>

          <!-- Resumen Comercial -->
          <div *ngIf="quote.summary" class="mb-6 text-center">
            <p class="text-sm text-gray-700 leading-relaxed italic">{{ quote.summary }}</p>
          </div>

          <!-- Información contextual -->
          <div *ngIf="quote?.meta?.projectContext?.locationHint || quote?.fluctuationWarning || historicalPricing" class="mb-6 space-y-3">
            <div *ngIf="quote?.meta?.projectContext?.locationHint" class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <strong>Ubicación estimada:</strong>
              {{ quote.meta.projectContext.locationHint }}
              <span *ngIf="quote.meta.projectContext.locationMultiplier" class="block text-xs text-amber-700 mt-1">
                Ajuste regional aplicado: x{{ quote.meta.projectContext.locationMultiplier | number:'1.2-2' }}
              </span>
            </div>
            <div *ngIf="quote?.fluctuationWarning" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              <strong>Aviso de fluctuación:</strong> {{ quote.fluctuationWarning }}
            </div>
            <div *ngIf="historicalPricing" class="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
              <strong>Referencia histórica:</strong>
              Promedio {{ historicalPricing.average | currency:'MXN':'symbol':'1.0-0' }}
              <span *ngIf="historicalPricing.low !== undefined && historicalPricing.high !== undefined">
                (rango {{ historicalPricing.low | currency:'MXN':'symbol':'1.0-0' }} – {{ historicalPricing.high | currency:'MXN':'symbol':'1.0-0' }})
              </span>
              <span class="block text-xs text-emerald-700 mt-1" *ngIf="historicalPricing.count > 0">
                Basado en {{ historicalPricing.count }} cotización{{ historicalPricing.count === 1 ? '' : 'es' }} previas del mismo cliente.
              </span>
            </div>
          </div>

        <div *ngIf="fallbackMessages.length > 0" class="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <h5 class="text-sm font-medium text-amber-900 mb-1">Advertencias de fallback</h5>
          <ul class="text-xs text-amber-800 space-y-1 list-disc pl-4">
            <li *ngFor="let warning of fallbackMessages">{{ warning }}</li>
          </ul>
          <p class="text-xs text-amber-700 mt-2">
            Activa el modo debug para ver la trazabilidad completa.
          </p>
        </div>

          <!-- Alerta si hay items editables -->
          <div *ngIf="hasEditedItems" class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-sm text-blue-800">
              <strong>Modo edición:</strong> Esta cotización ha sido editada manualmente.
            </p>
          </div>

          <!-- Items Table (Editable) -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Unit.
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let item of displayItems; let i = index" [class]="i % 2 === 0 ? 'bg-white' : 'bg-gray-50'">
                  <td class="px-4 py-4 text-sm">
                    <input
                      *ngIf="isEditing(item)"
                      [(ngModel)]="editingItem.description"
                      class="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                      type="text"
                    />
                    <span *ngIf="!isEditing(item)">{{ item.description }}</span>
                  </td>
                  <td class="px-4 py-4 text-sm">
                    <input
                      *ngIf="isEditing(item)"
                      [(ngModel)]="editingItem.quantity"
                      (ngModelChange)="calculateItemTotal()"
                      class="border border-gray-300 rounded px-2 py-1 w-20 text-sm"
                      type="number"
                      min="1"
                    />
                    <span *ngIf="!isEditing(item)">{{ item.quantity }}</span>
                  </td>
                  <td class="px-4 py-4 text-sm">
                    <input
                      *ngIf="isEditing(item)"
                      [(ngModel)]="editingItem.unitPrice"
                      (ngModelChange)="calculateItemTotal()"
                      class="border border-gray-300 rounded px-2 py-1 w-32 text-sm"
                      type="number"
                      min="0"
                    />
                    <span *ngIf="!isEditing(item)">{{ item.unitPrice | currency:'MXN':'symbol':'1.0-0' }}</span>
                  </td>
                  <td class="px-4 py-4 text-sm font-medium text-gray-900">
                    {{ item.total | currency:'MXN':'symbol':'1.0-0' }}
                  </td>
                  <td class="px-4 py-4 text-sm">
                    <div class="flex gap-2">
                      <button
                        *ngIf="isEditing(item)"
                        (click)="saveItemEdit(item)"
                        class="text-green-600 hover:text-green-800"
                        title="Guardar"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </button>
                      <button
                        *ngIf="isEditing(item)"
                        (click)="cancelEdit()"
                        class="text-red-600 hover:text-red-800"
                        title="Cancelar"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                      <button
                        *ngIf="!isEditing(item) && quoteId"
                        (click)="startEdit(item)"
                        class="text-blue-600 hover:text-blue-800"
                        title="Editar"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button
                        *ngIf="!isEditing(item) && quoteId"
                        (click)="deleteItem(item)"
                        class="text-red-600 hover:text-red-800"
                        title="Eliminar"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Botón añadir item -->
          <div *ngIf="quoteId" class="mt-4">
            <button
              (click)="addNewItem()"
              class="btn btn-secondary btn-sm"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Añadir Concepto
            </button>
          </div>

          <!-- Formulario nuevo item -->
          <div *ngIf="addingNewItem" class="mt-4 p-4 bg-white border border-gray-300 rounded-lg">
            <h5 class="text-sm font-semibold mb-3">Nuevo concepto</h5>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <div class="md:col-span-2">
                <input
                  [(ngModel)]="newItem.description"
                  placeholder="Descripción"
                  class="form-control"
                  type="text"
                />
              </div>
              <div>
                <input
                  [(ngModel)]="newItem.quantity"
                  (ngModelChange)="calculateNewItemTotal()"
                  placeholder="Cantidad"
                  class="form-control"
                  type="number"
                  min="1"
                />
              </div>
              <div>
                <input
                  [(ngModel)]="newItem.unitPrice"
                  (ngModelChange)="calculateNewItemTotal()"
                  placeholder="Precio"
                  class="form-control"
                  type="number"
                  min="0"
                />
              </div>
            </div>
            <div class="flex gap-2">
              <button
                (click)="saveNewItem()"
                [disabled]="!newItem.description || !newItem.quantity || !newItem.unitPrice"
                class="btn btn-success btn-sm"
              >
                Guardar
              </button>
              <button
                (click)="cancelAddNewItem()"
                class="btn btn-secondary btn-sm"
              >
                Cancelar
              </button>
            </div>
          </div>

          <!-- Totales -->
          <div class="mt-6 flex justify-end">
            <div class="w-64">
              <div class="flex justify-between py-2">
                <span class="text-sm text-gray-600">Subtotal:</span>
                <span class="text-sm text-gray-900">{{ displayTotals.subtotal | currency:'MXN':'symbol':'1.0-0' }}</span>
              </div>
              <div class="flex justify-between py-2">
                <span class="text-sm text-gray-600">IVA (16%):</span>
                <span class="text-sm text-gray-900">{{ displayTotals.tax | currency:'MXN':'symbol':'1.0-0' }}</span>
              </div>
              <div class="flex justify-between py-3 border-t border-gray-200">
                <span class="text-lg font-semibold text-gray-900">Total:</span>
                <span class="text-lg font-semibold text-green-600">{{ displayTotals.total | currency:'MXN':'symbol':'1.0-0' }}</span>
              </div>
            </div>
          </div>

          <!-- Botón recalcular si hay cambios -->
          <div *ngIf="quoteId && (hasEditedItems || hasPendingChanges)" class="mt-4">
            <button
              (click)="recalculateQuote()"
              [disabled]="isRecalculating"
              class="btn btn-primary btn-sm"
            >
              <span *ngIf="isRecalculating" class="loading">
                <div class="spinner"></div>
                Recalculando...
              </span>
              <span *ngIf="!isRecalculating">Recalcular Totales</span>
            </button>
          </div>

          <!-- Terms -->
          <div class="mt-6">
            <h5 class="text-sm font-medium text-gray-900 mb-3">Términos y Condiciones:</h5>
            <ul class="text-sm text-gray-600 space-y-1">
              <li *ngFor="let term of quote.terms" class="flex items-start">
                <span class="text-gray-400 mr-2">•</span>
                <span>{{ term }}</span>
              </li>
            </ul>
            <p class="text-sm text-gray-500 mt-3">
              <strong>Válida hasta:</strong> {{ quote.validUntil }}
            </p>
          </div>

        <div *ngIf="showDebug" class="mt-6 p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h5 class="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <svg class="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 18.5a.5.5 0 11-1 0 .5.5 0 011 0z"></path>
            </svg>
            Panel de depuración
          </h5>

          <div class="grid md:grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <h6 class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">General</h6>
              <ul class="space-y-1">
                <li><span class="text-gray-500">TraceId:</span> <span class="font-mono text-gray-800">{{ traceId || '—' }}</span></li>
                <li><span class="text-gray-500">Generada por:</span> <span class="font-medium text-gray-800">{{ generatedBy || 'sin dato' }}</span></li>
                <li><span class="text-gray-500">Nivel de calidad:</span> <span class="font-medium text-gray-800">{{ qualityLevel || 'estándar' }}</span></li>
              </ul>
              <div *ngIf="historyIds.length > 0" class="mt-3">
                <h6 class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Cotizaciones similares</h6>
                <div class="flex flex-wrap gap-2">
                  <span
                    *ngFor="let id of historyIds"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-100 text-indigo-700"
                  >
                    #{{ id }}
                  </span>
                </div>
              </div>
            </div>

            <div *ngIf="estimateDetail">
              <h6 class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Estimación</h6>
              <ul class="space-y-1">
                <li><span class="text-gray-500">Escala:</span> <span class="font-medium text-gray-800">{{ estimateDetail?.scale || 'N/D' }}</span></li>
                <li *ngIf="estimateDetail?.baseTotal !== undefined">
                  <span class="text-gray-500">Base:</span>
                  <span class="font-medium text-gray-800">{{ estimateDetail?.baseTotal | currency:'MXN':'symbol':'1.0-0' }}</span>
                </li>
                <li *ngIf="estimateDetail?.blendedHistoricTotal !== undefined">
                  <span class="text-gray-500">Blending histórico:</span>
                  <span class="font-medium text-gray-800">{{ estimateDetail?.blendedHistoricTotal | currency:'MXN':'symbol':'1.0-0' }}</span>
                </li>
                <li>
                  <span class="text-gray-500">Fallback estimación:</span>
                  <span class="font-medium" [class.text-emerald-600]="!estimateDetail?.fallbackUsed" [class.text-red-600]="estimateDetail?.fallbackUsed">
                    {{ estimateDetail?.fallbackUsed ? 'Sí' : 'No' }}
                  </span>
                </li>
              </ul>
              <div *ngIf="estimateMultipliers.length > 0" class="mt-3">
                <h6 class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Multiplicadores aplicados</h6>
                <div class="flex flex-wrap gap-2">
                  <span
                    *ngFor="let multiplier of estimateMultipliers"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700"
                  >
                    {{ multiplier.key }} ×{{ multiplier.value | number:'1.2-2' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-4 text-xs text-gray-600 mt-4">
            <div>
              <h6 class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Flags</h6>
              <ul class="space-y-1">
                <li *ngIf="debugFlags.length === 0" class="text-gray-400">Sin flags registrados</li>
                <li *ngFor="let flag of debugFlags" class="flex items-center">
                  <svg class="w-3.5 h-3.5 mr-2" [ngClass]="flag.value ? 'text-emerald-500' : 'text-gray-300'" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-11a1 1 0 112 0v3a1 1 0 01-2 0V7zm1 6a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 13z"></path>
                  </svg>
                  <span class="font-mono text-gray-700">{{ flag.key }}</span>
                  <span class="ml-2 font-semibold" [class.text-emerald-600]="flag.value" [class.text-gray-400]="!flag.value">
                    {{ flag.value ? 'activo' : 'inactivo' }}
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h6 class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Tiempos (ms)</h6>
              <ul class="space-y-1">
                <li *ngIf="debugTimings.length === 0" class="text-gray-400">Sin datos de tiempo</li>
                <li *ngFor="let timing of debugTimings" class="flex justify-between">
                  <span class="font-mono text-gray-600">{{ timing.key }}</span>
                  <span class="ml-2 font-semibold text-gray-900">{{ timing.value | number:'1.0-0' }}</span>
                </li>
              </ul>
            </div>
          </div>

          <div *ngIf="distributionInfo" class="mt-4 text-xs text-gray-600 space-y-1">
            <h6 class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Distribución de precios</h6>
            <div *ngIf="distributionWeightsLabel">
              <span class="text-gray-500">Pesos:</span>
              <span class="font-mono text-gray-800">{{ distributionWeightsLabel }}</span>
            </div>
            <div *ngIf="distributionInfo?.marginMultiplier !== undefined">
              <span class="text-gray-500">Margen:</span>
              <span class="font-medium text-gray-800">×{{ distributionInfo?.marginMultiplier | number:'1.2-2' }}</span>
            </div>
            <div *ngIf="distributionInfo?.overheadMultiplier !== undefined">
              <span class="text-gray-500">Indirectos:</span>
              <span class="font-medium text-gray-800">×{{ distributionInfo?.overheadMultiplier | number:'1.2-2' }}</span>
            </div>
            <div *ngIf="distributionInfo?.minPerItem !== undefined">
              <span class="text-gray-500">Mínimo por ítem:</span>
              <span class="font-medium text-gray-800">{{ distributionInfo?.minPerItem | currency:'MXN':'symbol':'1.0-0' }}</span>
            </div>
          </div>
        </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-4">
          <button
            (click)="downloadPDF()"
            [disabled]="isDownloading"
            class="btn btn-primary flex-1"
          >
            <div *ngIf="isDownloading" class="loading">
              <div class="spinner"></div>
              Descargando...
            </div>
            <div *ngIf="!isDownloading" class="flex items-center justify-center">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Descargar PDF
            </div>
          </button>

          <button
            (click)="sendEmail()"
            [disabled]="isSendingEmail"
            class="btn btn-success flex-1"
          >
            <div *ngIf="isSendingEmail" class="loading">
              <div class="spinner"></div>
              Enviando...
            </div>
            <div *ngIf="!isSendingEmail" class="flex items-center justify-center">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              Enviar por Email
            </div>
          </button>

          <button
            (click)="createNewQuote()"
            class="btn btn-secondary"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Nueva Cotización
          </button>
        </div>

        <!-- Success Messages -->
        <div *ngIf="successMessage" class="mt-4 alert alert-success">
          {{ successMessage }}
        </div>

        <div *ngIf="errorMessage" class="mt-4 alert alert-error">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card { background: white; border-radius: 0.75rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); border: 1px solid #e5e7eb; overflow: hidden; }
    .card-elevated { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
    .p-6 { padding: 1.5rem; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .mb-6 { margin-bottom: 1.5rem; }
    .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
    .font-semibold { font-weight: 600; }
    .text-gray-900 { color: #111827; }
    .space-x-2 > * + * { margin-left: 0.5rem; }
    .inline-flex { display: inline-flex; }
    .px-2\\.5 { padding-left: 0.625rem; padding-right: 0.625rem; }
    .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
    .rounded-full { border-radius: 9999px; }
    .text-xs { font-size: 0.75rem; line-height: 1rem; }
    .font-medium { font-weight: 500; }
    .bg-green-100 { background-color: #dcfce7; }
    .text-green-800 { color: #166534; }
    .w-3 { width: 0.75rem; }
    .h-3 { height: 0.75rem; }
    .mr-1 { margin-right: 0.25rem; }
    .bg-gray-50 { background-color: #f9fafb; }
    .rounded-lg { border-radius: 0.5rem; }
    .text-center { text-align: center; }
    .text-2xl { font-size: 1.5rem; line-height: 2rem; }
    .font-bold { font-weight: 700; }
    .mb-2 { margin-bottom: 0.5rem; }
    .text-gray-600 { color: #4b5563; }
    .text-gray-700 { color: #374151; }
    .leading-relaxed { line-height: 1.625; }
    .italic { font-style: italic; }
    .overflow-x-auto { overflow-x: auto; }
    .min-w-full { min-width: 100%; }
    .divide-y { border-top-width: 1px; }
    .divide-gray-200 { border-color: #e5e7eb; }
    .bg-gray-100 { background-color: #f3f4f6; }
    .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
    .text-left { text-align: left; }
    .uppercase { text-transform: uppercase; }
    .tracking-wider { letter-spacing: 0.05em; }
    .text-gray-500 { color: #6b7280; }
    .bg-white { background-color: white; }
    .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .mt-6 { margin-top: 1.5rem; }
    .justify-end { justify-content: flex-end; }
    .w-64 { width: 16rem; }
    .justify-between { justify-content: space-between; }
    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
    .border-t { border-top-width: 1px; }
    .border-gray-200 { border-color: #e5e7eb; }
    .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
    .text-green-600 { color: #16a34a; }
    .space-y-1 > * + * { margin-top: 0.25rem; }
    .items-start { align-items: flex-start; }
    .text-gray-400 { color: #9ca3af; }
    .mr-2 { margin-right: 0.5rem; }
    .mt-3 { margin-top: 0.75rem; }
    .flex-col { flex-direction: column; }
    .sm\\:flex-row { flex-direction: row; }
    .gap-4 { gap: 1rem; }
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; font-weight: 500; font-size: 0.875rem; line-height: 1.25rem; text-decoration: none; cursor: pointer; transition: all 0.2s ease-in-out; gap: 0.5rem; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background-color: #2563eb; color: white; }
    .btn-primary:hover:not(:disabled) { background-color: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
    .btn-success { background-color: #16a34a; color: white; }
    .btn-success:hover:not(:disabled) { background-color: #15803d; }
    .btn-secondary { background-color: #e5e7eb; color: #374151; }
    .btn-secondary:hover:not(:disabled) { background-color: #d1d5db; }
    .btn-sm { padding: 0.5rem 1rem; font-size: 0.75rem; }
    .flex-1 { flex: 1 1 0%; }
    .loading { display: inline-flex; align-items: center; gap: 0.5rem; }
    .spinner { width: 1rem; height: 1rem; border: 2px solid #d1d5db; border-top: 2px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite; }
    .w-4 { width: 1rem; }
    .h-4 { height: 1rem; }
    .w-5 { width: 1.25rem; }
    .h-5 { height: 1.25rem; }
    .justify-center { justify-content: center; }
    .mt-4 { margin-top: 1rem; }
    .alert { padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; }
    .alert-success { background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
    .alert-error { background-color: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .gap-2 { gap: 0.5rem; }
    .form-control { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; }
    .form-control:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgb(37 99 235 / 0.1); }
    .grid { display: grid; }
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    .md\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .md\\:col-span-2 { grid-column: span 2 / span 2; }
    .gap-3 { gap: 0.75rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .w-20 { width: 5rem; }
    .w-32 { width: 8rem; }
    .w-full { width: 100%; }
    .border { border-width: 1px; }
    .border-gray-300 { border-color: #d1d5db; }
    .rounded { border-radius: 0.375rem; }
    .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
    .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
    .text-green-600 { color: #16a34a; }
    .hover\\:text-green-800:hover { color: #166534; }
    .text-red-600 { color: #dc2626; }
    .hover\\:text-red-800:hover { color: #991b1b; }
    .text-blue-600 { color: #2563eb; }
    .hover\\:text-blue-800:hover { color: #1e40af; }
    button { cursor: pointer; }
    .bg-blue-50 { background-color: #eff6ff; }
    .border-blue-200 { border-color: #bfdbfe; }
    .text-blue-800 { color: #1e40af; }
    @media (min-width: 640px) { .sm\\:flex-row { flex-direction: row; } }
  `]
})
export class QuoteViewerComponent implements OnInit, OnChanges {
  @Input() quote: any;
  @Input() quoteId: string | null = null;
  @Output() newQuote = new EventEmitter<void>();

  isDownloading = false;
  isSendingEmail = false;
  isRecalculating = false;
  successMessage = '';
  errorMessage = '';
  historicalPricing: { average: number; low?: number; high?: number; count: number } | null = null;

  showDebug = false;
  fallbackActive = false;
  fallbackMessages: string[] = [];
  debugFlags: Array<{ key: string; value: boolean }> = [];
  debugTimings: Array<{ key: string; value: number }> = [];
  distributionInfo: { weights?: number[]; marginMultiplier?: number; overheadMultiplier?: number; minPerItem?: number } | null = null;
  distributionWeightsLabel = '';
  estimateDetail: {
    scale?: string;
    baseTotal?: number;
    blendedHistoricTotal?: number;
    fallbackUsed?: boolean;
  } | null = null;
  estimateMultipliers: Array<{ key: string; value: number }> = [];
  traceId: string | null = null;
  generatedBy = '';
  qualityLevel = '';
  historyIds: number[] = [];
  editedItemsLoaded = false;

  // Items editables
  editedItems: QuoteItem[] = [];
  hasEditedItems = false;
  hasPendingChanges = false;
  displayItems: QuoteItem[] = [];
  displayTotals: any = { subtotal: 0, tax: 0, total: 0 };

  // Estado de edición
  editingItemId: number | null = null;
  editingItem: Partial<QuoteItem> = {};

  // Nuevo item
  addingNewItem = false;
  newItem: Partial<QuoteItem> = { description: '', quantity: 1, unitPrice: 0, total: 0 };

  constructor(private quoteService: QuoteService) {}

  ngOnInit() {
    this.initializeQuote();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['quoteId'] && !changes['quoteId'].firstChange) {
      this.editedItemsLoaded = false;
    }
    if (
      (changes['quote'] && changes['quote'].currentValue) ||
      (changes['quoteId'] && changes['quoteId'].currentValue)
    ) {
      this.initializeQuote();
    }
  }

  toggleDebug() {
    this.showDebug = !this.showDebug;
  }

  private initializeQuote(): void {
    if (!this.quote) {
      return;
    }

    this.showDebug = false;
    this.displayItems = this.quote.items || [];
    this.displayTotals = {
      subtotal: this.quote.subtotal || 0,
      tax: this.quote.tax || 0,
      total: this.quote.total || 0
    };

    const pricingMeta = this.quote?.meta?.historicalPricing;
    if (pricingMeta && typeof pricingMeta.suggestedAverage === 'number') {
      const count = Array.isArray(pricingMeta.similarQuoteIds) ? pricingMeta.similarQuoteIds.length : 0;
      this.historicalPricing = {
        average: pricingMeta.suggestedAverage,
        low: pricingMeta.low,
        high: pricingMeta.high,
        count
      };
    } else {
      this.historicalPricing = null;
    }

    this.extractDebugInsights();

    if (this.quoteId) {
      if (!this.editedItemsLoaded) {
        this.loadEditedItems();
      }
    } else {
      this.editedItemsLoaded = false;
    }
  }

  private extractDebugInsights(): void {
    const meta = this.quote?.meta || {};
    const debug = meta.debug || {};

    this.generatedBy = meta.generatedBy || '';
    this.qualityLevel = meta.qualityLevel || '';
    this.traceId = debug.traceId || null;

    this.debugFlags = [];
    this.debugTimings = [];
    this.distributionInfo = null;
    this.estimateDetail = null;
    this.estimateMultipliers = [];
    this.historyIds = [];
    this.fallbackMessages = [];
    this.fallbackActive = false;

    const flagsObj = (debug.flags as Record<string, boolean>) || {};
    this.debugFlags = Object.entries(flagsObj).map(([key, value]) => ({ key, value: !!value }));
    const fallbackTriggers = ['fallback', 'usedlocalitems', 'usedlocalsummary', 'usedfallback'];
    this.fallbackActive = this.debugFlags.some(
      entry => entry.value && fallbackTriggers.some(trigger => entry.key.toLowerCase().includes(trigger))
    );

    if (flagsObj['usedLocalItems']) {
      this.fallbackMessages.push('Los conceptos fueron contextualizados con fallback local.');
    }
    if (flagsObj['usedLocalSummary']) {
      this.fallbackMessages.push('El resumen comercial se generó con plantilla local.');
    }
    if (flagsObj['usedFallback']) {
      this.fallbackMessages.push('Se activó el modo fallback para completar la cotización.');
    }

    const estimate = meta.estimateDetail || {};
    if (Object.keys(estimate).length > 0) {
      this.estimateDetail = {
        scale: estimate.scale,
        baseTotal: estimate.baseTotal,
        blendedHistoricTotal: estimate.blendedHistoricTotal,
        fallbackUsed: !!estimate.fallbackUsed
      };
      const multipliers = estimate.appliedMultipliers || {};
      this.estimateMultipliers = Object.entries(multipliers)
        .filter(([_, val]) => typeof val === 'number' && !Number.isNaN(val as number))
        .map(([key, val]) => ({ key, value: Number(val) }));

      if (estimate.fallbackUsed && !this.fallbackMessages.includes('Se activó el modo fallback para completar la cotización.')) {
        this.fallbackMessages.push('Se activó el modo fallback para completar la cotización.');
      }
    }

    const timingsObj = debug.timings || {};
    this.debugTimings = Object.entries(timingsObj)
      .map(([key, val]) => ({ key, value: Math.round(Number(val) || 0) }))
      .filter(entry => Number.isFinite(entry.value))
      .sort((a, b) => b.value - a.value);

    this.distributionInfo = debug.distribution || null;
    if (this.distributionInfo?.weights && Array.isArray(this.distributionInfo.weights)) {
      this.distributionWeightsLabel = this.distributionInfo.weights
        .map(weight => Number(weight).toFixed(2))
        .join(', ');
    } else {
      this.distributionWeightsLabel = '';
    }

    const historySample = Array.isArray(debug.historySample) ? debug.historySample : [];
    const similarIds = Array.isArray(meta.historicalPricing?.similarQuoteIds)
      ? meta.historicalPricing.similarQuoteIds
      : [];
    this.historyIds = Array.from(new Set([...similarIds, ...historySample]));

    this.fallbackActive = this.fallbackActive || (this.estimateDetail?.fallbackUsed ?? false) || this.fallbackMessages.length > 0;
  }

  loadEditedItems() {
    if (!this.quoteId || this.editedItemsLoaded) return;
    this.editedItemsLoaded = true;
    this.quoteService.getQuoteItems(parseInt(this.quoteId)).subscribe({
      next: (res) => {
        if (res.items && res.items.length > 0) {
          // Verificar si los items tienen IDs (están en DB)
          const hasItemsWithIds = res.items.some(item => item.id !== undefined && item.id !== null);
          
          if (hasItemsWithIds) {
            // Items ya migrados, usar directamente
            this.editedItems = res.items;
            this.hasEditedItems = true;
            this.displayItems = res.items;
            this.recalculateDisplayTotals();
          } else {
            // Items sin IDs, migrar automáticamente
            this.migrateItems();
          }
        }
      },
      error: (err) => {
        console.error('Error cargando items:', err);
        this.editedItemsLoaded = false;
      }
    });
  }

  migrateItems() {
    if (!this.quoteId) return;
    this.quoteService.migrateItems(parseInt(this.quoteId)).subscribe({
      next: (res) => {
        if (res.items && res.items.length > 0) {
          this.editedItems = res.items;
          this.hasEditedItems = true;
          this.displayItems = res.items;
          this.recalculateDisplayTotals();
        }
      },
      error: (err) => console.error('Error migrando items:', err)
    });
  }

  recalculateDisplayTotals() {
    const subtotal = this.displayItems.reduce((sum, item) => sum + item.total, 0);
    const taxPercent = this.quote.tax / this.quote.subtotal * 100;
    const tax = subtotal * (taxPercent / 100);
    const total = subtotal + tax;
    this.displayTotals = { subtotal, tax, total };
  }

  // Helper para verificar si un item está siendo editado
  isEditing(item: QuoteItem): boolean {
    return this.editingItemId !== null && Number(this.editingItemId) === Number(item.id);
  }

  // Edición inline
  startEdit(item: QuoteItem) {
    this.editingItemId = item.id || null;
    this.editingItem = { ...item };
  }

  cancelEdit() {
    this.editingItemId = null;
    this.editingItem = {};
  }

  calculateItemTotal() {
    if (this.editingItem.quantity && this.editingItem.unitPrice) {
      this.editingItem.total = this.editingItem.quantity * this.editingItem.unitPrice;
    }
  }

  saveItemEdit(item: QuoteItem) {
    if (!this.quoteId || !this.editingItemId) return;
    this.quoteService.updateQuoteItem(parseInt(this.quoteId), this.editingItemId, this.editingItem).subscribe({
      next: (res) => {
        this.displayItems = res.items;
        this.recalculateDisplayTotals();
        this.cancelEdit();
        this.successMessage = 'Item actualizado';
        setTimeout(() => this.successMessage = '', 3000);
        this.hasPendingChanges = true;
      },
      error: (err) => {
        this.errorMessage = 'Error actualizando item';
        console.error(err);
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  deleteItem(item: QuoteItem) {
    if (!this.quoteId || !item.id || !confirm('¿Eliminar este concepto?')) return;
    this.quoteService.deleteQuoteItem(parseInt(this.quoteId), item.id).subscribe({
      next: (res) => {
        this.displayItems = res.items;
        this.recalculateDisplayTotals();
        this.successMessage = 'Item eliminado';
        setTimeout(() => this.successMessage = '', 3000);
        this.hasPendingChanges = true;
      },
      error: (err) => {
        this.errorMessage = 'Error eliminando item';
        console.error(err);
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // Nuevo item
  addNewItem() {
    this.addingNewItem = true;
    this.newItem = { description: '', quantity: 1, unitPrice: 0, total: 0 };
  }

  cancelAddNewItem() {
    this.addingNewItem = false;
    this.newItem = {};
  }

  calculateNewItemTotal() {
    if (this.newItem.quantity && this.newItem.unitPrice) {
      this.newItem.total = this.newItem.quantity * this.newItem.unitPrice;
    }
  }

  saveNewItem() {
    if (!this.quoteId || !this.newItem.description || !this.newItem.quantity || !this.newItem.unitPrice) return;
    this.quoteService.createQuoteItem(parseInt(this.quoteId), {
      description: this.newItem.description,
      quantity: this.newItem.quantity,
      unitPrice: this.newItem.unitPrice
    }).subscribe({
      next: (res) => {
        this.displayItems = res.items;
        this.recalculateDisplayTotals();
        this.cancelAddNewItem();
        this.successMessage = 'Item añadido';
        setTimeout(() => this.successMessage = '', 3000);
        this.hasPendingChanges = true;
        this.hasEditedItems = true;
      },
      error: (err) => {
        this.errorMessage = 'Error añadiendo item';
        console.error(err);
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // Recalcular
  recalculateQuote() {
    if (!this.quoteId) return;
    this.isRecalculating = true;
    this.quoteService.recalculateQuote(parseInt(this.quoteId)).subscribe({
      next: (res) => {
        this.quote = res.quote;
        this.displayTotals = res.totals;
        this.successMessage = 'Totales recalculados';
        setTimeout(() => this.successMessage = '', 3000);
        this.isRecalculating = false;
        this.hasPendingChanges = false;
      },
      error: (err) => {
        this.errorMessage = 'Error recalculando';
        console.error(err);
        setTimeout(() => this.errorMessage = '', 5000);
        this.isRecalculating = false;
      }
    });
  }

  downloadPDF() {
    if (!this.quoteId) return;

    this.isDownloading = true;
    this.errorMessage = '';

    this.quoteService.downloadPDF(this.quoteId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cotizacion_${this.quoteId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.isDownloading = false;
        this.successMessage = 'PDF descargado exitosamente';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.isDownloading = false;
        this.errorMessage = 'Error descargando el PDF';
        console.error('Error descargando PDF:', error);
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  sendEmail() {
    if (!this.quoteId) return;

    this.isSendingEmail = true;
    this.errorMessage = '';

    // Timeout de seguridad de 30 segundos
    const timeoutId = setTimeout(() => {
      if (this.isSendingEmail) {
        this.isSendingEmail = false;
        this.errorMessage = 'El servidor tardó mucho en responder. Verifica tu conexión.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    }, 30000);

    this.quoteService.sendEmail(this.quoteId).subscribe({
      next: (response) => {
        clearTimeout(timeoutId);
        this.isSendingEmail = false;
        this.successMessage = response.message;
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (error) => {
        clearTimeout(timeoutId);
        this.isSendingEmail = false;
        this.errorMessage = 'Error enviando el email';
        console.error('Error enviando email:', error);
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  createNewQuote() {
    this.newQuote.emit();
  }
}
