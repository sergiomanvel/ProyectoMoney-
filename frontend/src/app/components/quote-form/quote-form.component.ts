import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { QuoteService, QuoteRequest } from '../../services/quote.service';
import { FormsModule } from '@angular/forms';

interface UserItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

@Component({
  selector: 'app-quote-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="card card-elevated">
      <div class="p-6">
        <h3 class="text-xl font-semibold text-gray-900 mb-6">
          Crear Nueva Cotización
        </h3>

        <form [formGroup]="quoteForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Información del Cliente -->
          <div class="grid md:grid-cols-2 gap-6">
            <div class="form-group">
              <label for="clientName">Nombre del Cliente *</label>
              <input
                type="text"
                id="clientName"
                formControlName="clientName"
                placeholder="Ej: Juan Pérez"
                class="form-control"
                [class.error]="isFieldInvalid('clientName')"
              />
              <div *ngIf="isFieldInvalid('clientName')" class="error-message">
                <span *ngIf="quoteForm.get('clientName')?.errors?.['required']">
                  El nombre del cliente es requerido
                </span>
                <span *ngIf="quoteForm.get('clientName')?.errors?.['minlength']">
                  El nombre debe tener al menos 2 caracteres
                </span>
              </div>
            </div>

            <div class="form-group">
              <label for="clientEmail">Email del Cliente *</label>
              <input
                type="email"
                id="clientEmail"
                formControlName="clientEmail"
                placeholder="cliente@ejemplo.com"
                class="form-control"
                [class.error]="isFieldInvalid('clientEmail')"
              />
              <div *ngIf="isFieldInvalid('clientEmail')" class="error-message">
                <span *ngIf="quoteForm.get('clientEmail')?.errors?.['required']">
                  El email es requerido
                </span>
                <span *ngIf="quoteForm.get('clientEmail')?.errors?.['email']">
                  Ingresa un email válido
                </span>
              </div>
            </div>

            <div class="form-group md:col-span-2">
              <label for="ownerId">Identificador interno (opcional)</label>
              <input
                type="text"
                id="ownerId"
                formControlName="ownerId"
                placeholder="Ej: cuenta-acme"
                class="form-control"
                [class.error]="isFieldInvalid('ownerId')"
              />
              <div *ngIf="isFieldInvalid('ownerId')" class="error-message">
                <span *ngIf="quoteForm.get('ownerId')?.errors?.['maxlength']">
                  El identificador debe tener máximo 191 caracteres
                </span>
              </div>
              <div class="text-sm text-gray-500 mt-1">
                Este valor ayuda a reutilizar precios históricos del mismo cliente o cuenta.
              </div>
            </div>
          </div>

          <!-- Sector -->
          <div class="form-group">
            <label for="sector">Sector del Servicio *</label>
            <select
              id="sector"
              formControlName="sector"
              class="form-control"
              [class.error]="isFieldInvalid('sector')"
            >
              <option value="">Selecciona un sector</option>
              <option value="software">Software / Desarrollo</option>
              <option value="marketing">Marketing / Redes</option>
              <option value="construccion">Construcción / Servicios técnicos</option>
              <option value="consultoria">Consultoría / Formación</option>
              <option value="ecommerce">Ecommerce / Retail</option>
              <option value="general">General</option>
            </select>
            <div *ngIf="isFieldInvalid('sector')" class="error-message">
              Selecciona el sector del servicio
            </div>
          </div>

          <!-- Ubicación del proyecto -->
          <div class="form-group">
            <label for="projectLocation">Ubicación del proyecto (ciudad, país)</label>
            <input
              type="text"
              id="projectLocation"
              formControlName="projectLocation"
              placeholder="Ej: Madrid, España"
              class="form-control"
              [class.error]="isFieldInvalid('projectLocation')"
            />
            <div *ngIf="isFieldInvalid('projectLocation')" class="error-message">
              <span *ngIf="quoteForm.get('projectLocation')?.errors?.['maxlength']">
                La ubicación debe tener máximo 120 caracteres
              </span>
            </div>
            <div class="text-sm text-gray-500 mt-1">
              Usa el formato "Ciudad, País" para mejorar los ajustes regionales.
            </div>
          </div>

          <!-- Descripción del Proyecto -->
          <div class="form-group">
            <label for="projectDescription">Descripción del Proyecto *</label>
            <textarea
              id="projectDescription"
              formControlName="projectDescription"
              placeholder="Describe detalladamente el proyecto o servicio que necesitas cotizar..."
              rows="4"
              class="form-control"
              [class.error]="isFieldInvalid('projectDescription')"
            ></textarea>
            <div *ngIf="isFieldInvalid('projectDescription')" class="error-message">
              <span *ngIf="quoteForm.get('projectDescription')?.errors?.['required']">
                La descripción del proyecto es requerida
              </span>
              <span *ngIf="quoteForm.get('projectDescription')?.errors?.['minlength']">
                La descripción debe tener al menos 20 caracteres
              </span>
            </div>
            <div class="text-sm text-gray-500 mt-1">
              {{ quoteForm.get('projectDescription')?.value?.length || 0 }} / 500 caracteres
            </div>
          </div>

          <!-- Rango de Precio -->
          <div class="form-group">
            <label for="priceRange">Rango de Precio Estimado *</label>
            <select
              id="priceRange"
              formControlName="priceRange"
              class="form-control"
              [class.error]="isFieldInvalid('priceRange')"
            >
              <option value="">Selecciona un rango de precio</option>
              <option value="500 - 2,000">$500 - $2,000</option>
              <option value="2,000 - 5,000">$2,000 - $5,000</option>
              <option value="5,000 - 10,000">$5,000 - $10,000</option>
              <option value="10,000 - 20,000">$10,000 - $20,000</option>
              <option value="20,000 - 40,000">$20,000 - $40,000</option>
              <option value="40,000 - 75,000">$40,000 - $75,000</option>
              <option value="75,000 - 125,000">$75,000 - $125,000</option>
              <option value="125,000 - 250,000">$125,000 - $250,000</option>
              <option value="250,000+">$250,000+</option>
            </select>
            <div *ngIf="isFieldInvalid('priceRange')" class="error-message">
              Selecciona un rango de precio
            </div>
          </div>

          <!-- Opción de Definir Items Manualmente -->
          <div class="form-group">
            <div class="flex items-start">
              <input
                type="checkbox"
                id="defineItems"
                [(ngModel)]="defineItems"
                [ngModelOptions]="{standalone: true}"
                class="checkbox"
              />
              <label for="defineItems" class="ml-2 cursor-pointer">
                <span class="font-medium">Quiero definir yo los conceptos (opcional)</span>
                <p class="text-sm text-gray-600 mt-1">
                  La IA solo completará título, términos y totales
                </p>
              </label>
            </div>
          </div>

          <!-- Tabla de Items Editables -->
          <div *ngIf="defineItems" class="form-group">
            <div class="border border-gray-300 rounded-lg overflow-hidden">
              <div class="bg-gray-50 px-4 py-3 border-b border-gray-300">
                <h4 class="font-semibold text-sm text-gray-900">
                  Conceptos de la Cotización
                </h4>
              </div>
              
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-100">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase w-8">
                        #
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Descripción *
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase w-24">
                        Cant. *
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase w-32">
                        Precio Unit.
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase w-24">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr *ngFor="let item of userItems; let i = index">
                      <td class="px-4 py-3 text-sm text-gray-600">{{ i + 1 }}</td>
                      <td class="px-4 py-3">
                        <input
                          type="text"
                          [(ngModel)]="item.description"
                          [ngModelOptions]="{standalone: true}"
                          placeholder="Ej: Análisis de requerimientos"
                          class="form-control-sm"
                          [class.error]="!item.description && userItems.length > 0"
                        />
                      </td>
                      <td class="px-4 py-3">
                        <input
                          type="number"
                          [(ngModel)]="item.quantity"
                          [ngModelOptions]="{standalone: true}"
                          min="1"
                          placeholder="1"
                          class="form-control-sm"
                          [class.error]="(!item.quantity || item.quantity <= 0) && userItems.length > 0"
                        />
                      </td>
                      <td class="px-4 py-3">
                        <input
                          type="number"
                          [(ngModel)]="item.unitPrice"
                          [ngModelOptions]="{standalone: true}"
                          min="0"
                          placeholder="0"
                          class="form-control-sm"
                        />
                      </td>
                      <td class="px-4 py-3">
                        <button
                          type="button"
                          (click)="removeItem(i)"
                          class="text-red-600 hover:text-red-800"
                          title="Eliminar"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="userItems.length === 0">
                      <td colspan="5" class="px-4 py-6 text-center text-sm text-gray-500">
                        No hay conceptos. Haz clic en "Añadir Concepto"
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="px-4 py-3 bg-gray-50 border-t border-gray-300">
                <button
                  type="button"
                  (click)="addItem()"
                  class="btn btn-secondary btn-sm"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                  Añadir Concepto
                </button>
              </div>
            </div>

            <!-- Mensaje informativo -->
            <div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="flex items-start">
                <svg class="w-4 h-4 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div class="text-sm text-blue-800">
                  <p class="font-medium mb-1">Modo profesional</p>
                  <p>
                    Si defines conceptos aquí, la IA solo completará: título, términos, vigencia y precios (si los dejas en 0). 
                    Tus conceptos serán la base de la cotización.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Botones -->
          <div class="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="submit"
              [disabled]="!canSubmit() || isLoading"
              class="btn btn-primary btn-lg flex-1"
            >
              <div *ngIf="isLoading" class="loading">
                <div class="spinner"></div>
                Generando Cotización...
              </div>
              <div *ngIf="!isLoading" class="flex items-center justify-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                {{ defineItems ? 'Generar Cotización Profesional' : 'Generar Cotización con IA' }}
              </div>
            </button>
          </div>
        </form>

        <!-- Información adicional -->
        <div class="mt-6 p-4 bg-blue-50 rounded-lg">
          <div class="flex items-start">
            <svg class="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div class="text-sm text-blue-800">
              <p class="font-medium mb-1">¿Cómo funciona?</p>
              <p>Puedes dejar que la IA genere todo automáticamente, o definir tus propios conceptos para mayor control. Nuestra IA siempre completará título, términos y cálculos de forma profesional.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card { background: white; border-radius: 0.75rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); border: 1px solid #e5e7eb; overflow: hidden; }
    .card-elevated { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
    .p-6 { padding: 1.5rem; }
    .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
    .font-semibold { font-weight: 600; }
    .text-gray-900 { color: #111827; }
    .mb-6 { margin-bottom: 1.5rem; }
    .space-y-6 > * + * { margin-top: 1.5rem; }
    .grid { display: grid; }
    .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .gap-6 { gap: 1.5rem; }
    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; }
    .form-control { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.875rem; transition: all 0.2s ease-in-out; }
    .form-control-sm { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; transition: all 0.2s ease-in-out; }
    .form-control:focus, .form-control-sm:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgb(37 99 235 / 0.1); }
    .form-control.error, .form-control-sm.error { border-color: #dc2626; }
    .error-message { color: #dc2626; font-size: 0.75rem; margin-top: 0.25rem; }
    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .text-gray-500 { color: #6b7280; }
    .text-gray-600 { color: #4b5563; }
    .mt-1 { margin-top: 0.25rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mt-3 { margin-top: 0.75rem; }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .sm\\:flex-row { flex-direction: row; }
    .gap-4 { gap: 1rem; }
    .pt-4 { padding-top: 1rem; }
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; font-weight: 500; font-size: 0.875rem; line-height: 1.25rem; text-decoration: none; cursor: pointer; transition: all 0.2s ease-in-out; gap: 0.5rem; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background-color: #2563eb; color: white; }
    .btn-primary:hover:not(:disabled) { background-color: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
    .btn-secondary { background-color: #6b7280; color: white; }
    .btn-secondary:hover { background-color: #4b5563; }
    .btn-sm { padding: 0.5rem 1rem; font-size: 0.875rem; }
    .btn-lg { padding: 1rem 2rem; font-size: 1rem; }
    .flex-1 { flex: 1 1 0%; }
    .loading { display: inline-flex; align-items: center; gap: 0.5rem; }
    .spinner { width: 1rem; height: 1rem; border: 2px solid #d1d5db; border-top: 2px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite; }
    .w-5 { width: 1.25rem; }
    .h-5 { height: 1.25rem; }
    .w-4 { width: 1rem; }
    .h-4 { height: 1rem; }
    .mr-2 { margin-right: 0.5rem; }
    .ml-2 { margin-left: 0.5rem; }
    .justify-center { justify-content: center; }
    .mt-6 { margin-top: 1.5rem; }
    .p-4 { padding: 1rem; }
    .p-3 { padding: 0.75rem; }
    .bg-blue-50 { background-color: #eff6ff; }
    .bg-blue-100 { background-color: #dbeafe; }
    .bg-gray-50 { background-color: #f9fafb; }
    .bg-gray-100 { background-color: #f3f4f6; }
    .rounded-lg { border-radius: 0.5rem; }
    .border { border-width: 1px; }
    .border-gray-300 { border-color: #d1d5db; }
    .border-blue-200 { border-color: #bfdbfe; }
    .border-b { border-bottom-width: 1px; }
    .border-t { border-top-width: 1px; }
    .items-start { align-items: flex-start; }
    .text-blue-600 { color: #2563eb; }
    .text-blue-800 { color: #1e40af; }
    .text-red-600 { color: #dc2626; }
    .text-red-800 { color: #991b1b; }
    .hover\\:text-red-800:hover { color: #991b1b; }
    .mt-0\\.5 { margin-top: 0.125rem; }
    .mr-3 { margin-right: 0.75rem; }
    .flex-shrink-0 { flex-shrink: 0; }
    .font-medium { font-weight: 500; }
    .mb-1 { margin-bottom: 0.25rem; }
    .cursor-pointer { cursor: pointer; }
    .checkbox { width: 1rem; height: 1rem; border: 2px solid #d1d5db; border-radius: 0.25rem; cursor: pointer; }
    .checkbox:checked { background-color: #2563eb; border-color: #2563eb; }
    .overflow-hidden { overflow: hidden; }
    .overflow-x-auto { overflow-x: auto; }
    .min-w-full { min-width: 100%; }
    .divide-y > * + * { border-top-width: 1px; }
    .divide-gray-200 > * + * { border-color: #e5e7eb; }
    .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
    .text-xs { font-size: 0.75rem; line-height: 1rem; }
    .uppercase { text-transform: uppercase; }
    .font-medium { font-weight: 500; }
    .text-gray-700 { color: #374151; }
    .bg-white { background-color: white; }
    .text-center { text-align: center; }
    .text-gray-500 { color: #6b7280; }
    .w-8 { width: 2rem; }
    .w-24 { width: 6rem; }
    .w-32 { width: 8rem; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class QuoteFormComponent {
  @Input() isLoading = false;
  @Output() quoteGenerated = new EventEmitter<{ quote: any, quoteId: string }>();

  quoteForm: FormGroup;
  defineItems = false;
  userItems: UserItem[] = [];

  constructor(
    private fb: FormBuilder,
    private quoteService: QuoteService
  ) {
    this.quoteForm = this.fb.group({
      clientName: ['', [Validators.required, Validators.minLength(2)]],
      clientEmail: ['', [Validators.required, Validators.email]],
      ownerId: ['', [Validators.maxLength(191)]],
      sector: ['', Validators.required],
      projectDescription: ['', [Validators.required, Validators.minLength(20)]],
      priceRange: ['', Validators.required],
      projectLocation: ['', [Validators.maxLength(120)]]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.quoteForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  addItem() {
    this.userItems.push({ description: '', quantity: 1, unitPrice: 0 });
  }

  removeItem(index: number) {
    this.userItems.splice(index, 1);
  }

  canSubmit(): boolean {
    if (!this.quoteForm.valid) {
      return false;
    }

    // Si defineItems está activado, debe tener al menos un item válido
    if (this.defineItems) {
      return this.userItems.length > 0 && 
             this.userItems.every(item => item.description && item.description.trim().length > 0 && item.quantity > 0);
    }

    return true;
  }

  onSubmit() {
    if (this.quoteForm.valid && this.canSubmit()) {
      this.isLoading = true;
      
      const formValue = this.quoteForm.value;
      const request: QuoteRequest = {
        clientName: formValue.clientName,
        clientEmail: formValue.clientEmail,
        ownerId: formValue.ownerId?.trim() || undefined,
        projectDescription: formValue.projectDescription,
        priceRange: formValue.priceRange,
        sector: formValue.sector,
        projectLocation: formValue.projectLocation?.trim() || undefined,
        items: this.defineItems && this.userItems.length > 0 
          ? this.userItems.map(item => ({
              description: item.description.trim(),
              quantity: item.quantity,
              unitPrice: item.unitPrice || 0
            }))
          : undefined
      };
      
      this.quoteService.generateQuote(request).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success === false && response.error === 'INVALID_DESCRIPTION') {
            alert(response.message || 'La descripción no es válida. Por favor, usa lenguaje profesional.');
            return;
          }
          if (response.quote && response.quoteId) {
            this.quoteGenerated.emit({
              quote: response.quote,
              quoteId: response.quoteId
            });
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error generando cotización:', error);
          alert('Error generando la cotización. Por favor, intenta de nuevo.');
        }
      });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.quoteForm.controls).forEach(key => {
        this.quoteForm.get(key)?.markAsTouched();
      });
    }
  }

  resetForm() {
    this.quoteForm.reset({
      clientName: '',
      clientEmail: '',
      ownerId: '',
      sector: '',
      projectDescription: '',
      priceRange: '',
      projectLocation: ''
    });
    this.defineItems = false;
    this.userItems = [];
    // Marcar como no tocado/pristino para limpiar errores
    Object.keys(this.quoteForm.controls).forEach(key => {
      this.quoteForm.get(key)?.markAsUntouched();
    });
  }
}
