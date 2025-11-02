import PDFDocument from 'pdfkit';
import { GeneratedQuote, QuoteItem } from '../models/Quote';
import fs from 'fs';
import path from 'path';
import { getAppConfig } from './appConfig';

export class PDFGenerator {
  /**
   * Formatea montos a MXN con locale es-MX
   */
  private static formatMoney(amount: number): string {
    try {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: 0
      }).format(amount);
    } catch {
      return `$${Math.round(amount).toLocaleString('es-MX')}`;
    }
  }
  /**
   * Genera un PDF profesional de la cotización
   * @param quote - Cotización base
   * @param folio - Folio de la cotización (opcional)
   * @param validUntil - Fecha de vigencia (opcional)
   * @param editedItems - Items editados desde la DB (opcional, sobreescribe quote.items)
   */
  static async generateQuotePDF(
    quote: GeneratedQuote,
    folio?: string,
    validUntil?: string,
    editedItems?: QuoteItem[]
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Configurar fuentes y colores
        const primaryColor = getAppConfig().primaryColor;
        const secondaryColor = '#64748b';
        const accentColor = '#059669';

        // Usar items editados si están disponibles
        const finalItems = editedItems || quote.items;
        
        // Calcular totales si hay items editados
        let finalQuote = quote;
        if (editedItems && editedItems.length > 0) {
          const taxPercent = quote.subtotal > 0 ? (quote.tax / quote.subtotal * 100) : parseFloat(process.env.DEFAULT_TAX_PERCENT || '16');
          finalQuote = this.recalculateTotals(finalItems, taxPercent);
          // Mantener metadata original
          finalQuote.title = quote.title;
          finalQuote.clientName = quote.clientName;
          finalQuote.projectDescription = quote.projectDescription;
          finalQuote.validUntil = quote.validUntil;
          finalQuote.terms = quote.terms;
        }

        // Header
        this.addHeader(doc, finalQuote, primaryColor, folio, validUntil);
        
        // Información del cliente
        this.addClientInfo(doc, finalQuote, secondaryColor);
        
        // Descripción del proyecto
        this.addProjectDescription(doc, finalQuote, secondaryColor);
        
        // Tabla de items (usar items editados)
        this.addItemsTable(doc, finalItems, primaryColor, secondaryColor);
        
        // Totales
        this.addTotals(doc, finalQuote, accentColor);
        
        // Términos y condiciones
        this.addTerms(doc, finalQuote, secondaryColor);
        
        // Footer
        this.addFooter(doc, primaryColor);

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Añade el header del PDF
   */
  private static addHeader(doc: PDFKit.PDFDocument, quote: GeneratedQuote, color: string, folio?: string, validUntil?: string) {
    // Logo placeholder (bloque)
    doc.roundedRect(50, 40, 60, 60, 8).fill(color);
    doc.fillColor('#ffffff').fontSize(18).text('LOGO', 60, 65);

    // Marca y subtítulo
    doc.fontSize(24)
       .fillColor(color)
       .text(getAppConfig().appName, 130, 50)
       .fontSize(12)
       .fillColor('#64748b')
       .text('Generador de Cotizaciones Profesionales', 130, 80);

    // Título de la cotización
    doc.fontSize(20)
       .fillColor('#1f2937')
       .text(quote.title, 50, 120);

    // Fecha
    const currentDate = new Date().toLocaleDateString('es-ES');
    doc.fontSize(10)
       .fillColor('#64748b')
       .text(`Fecha: ${currentDate}`, 400, 50);
    if (validUntil) {
      doc.text(`Válida hasta: ${validUntil}`, 400, 65);
    } else {
      doc.text(`Válida hasta: ${quote.validUntil}`, 400, 65);
    }
    doc.text('Moneda: MXN', 400, 80);
  }

  /**
   * Añade información del cliente
   */
  private static addClientInfo(doc: PDFKit.PDFDocument, quote: GeneratedQuote, color: string) {
    doc.fontSize(14)
       .fillColor('#1f2937')
       .text('Información del Cliente', 50, 180)
       .fontSize(12)
       .fillColor(color)
       .text(`Cliente: ${quote.clientName}`, 50, 205);
  }

  /**
   * Añade descripción del proyecto
   */
  private static addProjectDescription(doc: PDFKit.PDFDocument, quote: GeneratedQuote, color: string) {
    doc.fontSize(14)
       .fillColor('#1f2937')
       .text('Descripción del Proyecto', 50, 240)
       .fontSize(11)
       .fillColor(color)
       .text(quote.projectDescription, 50, 265, {
         width: 500,
         align: 'justify'
       });
  }

  /**
   * Añade tabla de items
   */
  private static addItemsTable(
    doc: PDFKit.PDFDocument, 
    items: QuoteItem[], 
    primaryColor: string, 
    secondaryColor: string
  ) {
    const startY = 320;
    let currentY = startY;

    // Header de la tabla
    doc.fontSize(12)
       .fillColor('#ffffff')
       .rect(50, currentY, 500, 25)
       .fill(primaryColor)
       .text('Descripción', 60, currentY + 8)
       .text('Cantidad', 350, currentY + 8)
       .text('Precio Unit.', 400, currentY + 8)
       .text('Total', 480, currentY + 8);

    currentY += 25;

    // Items
    items.forEach((item, index) => {
      const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
      
      doc.fillColor(bgColor)
         .rect(50, currentY, 500, 30)
         .fill()
         .fontSize(10)
         .fillColor('#1f2937')
         .text(item.description, 60, currentY + 8, { width: 280 })
         .text(item.quantity.toString(), 350, currentY + 8)
         .text(`${this.formatMoney(item.unitPrice)}`, 400, currentY + 8)
         .text(`${this.formatMoney(item.total)}`, 480, currentY + 8);

      currentY += 30;
    });

    // Línea separadora
    doc.strokeColor(primaryColor)
       .lineWidth(2)
       .moveTo(50, currentY)
       .lineTo(550, currentY)
       .stroke();
  }

  /**
   * Añade sección de totales
   */
  private static addTotals(doc: PDFKit.PDFDocument, quote: GeneratedQuote, accentColor: string) {
    const startY = 320 + (quote.items.length * 30) + 40;
    const cfg = getAppConfig();
    const tax = Number.isFinite(quote.tax) ? (quote.tax as number) : Math.round(quote.subtotal * (cfg.defaultTaxPercent / 100));
    const total = Number.isFinite(quote.total) ? (quote.total as number) : Math.round(quote.subtotal + tax);

    doc.fontSize(12)
       .fillColor('#1f2937')
       .text('Subtotal:', 400, startY)
       .text(`${this.formatMoney(quote.subtotal)}`, 480, startY)
       .text(`IVA (${cfg.defaultTaxPercent}%):`, 400, startY + 20)
       .text(`${this.formatMoney(tax)}`, 480, startY + 20)
       .fontSize(14)
       .fillColor(accentColor)
       .text('TOTAL:', 400, startY + 45)
       .text(`${this.formatMoney(total)}`, 480, startY + 45);
  }

  /**
   * Recalcula totales a partir de items y tax percent
   */
  private static recalculateTotals(items: QuoteItem[], taxPercent: number): GeneratedQuote {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * (taxPercent / 100);
    const total = subtotal + tax;

    return {
      title: 'COTIZACIÓN',
      clientName: '',
      projectDescription: '',
      items,
      subtotal,
      tax,
      total,
      validUntil: new Date().toISOString(),
      terms: []
    };
  }

  /**
   * Añade términos y condiciones
   */
  private static addTerms(doc: PDFKit.PDFDocument, quote: GeneratedQuote, color: string) {
    const startY = 320 + (quote.items.length * 30) + 100;
    
    doc.fontSize(12)
       .fillColor('#1f2937')
       .text('Términos y Condiciones', 50, startY)
       .fontSize(10)
       .fillColor(color);

    quote.terms.forEach((term, index) => {
      doc.text(`• ${term}`, 50, startY + 25 + (index * 15));
    });
  }

  /**
   * Añade footer
   */
  private static addFooter(doc: PDFKit.PDFDocument, color: string) {
    const pageHeight = doc.page.height;
    
    doc.fontSize(8)
       .fillColor('#64748b')
       .text(`${getAppConfig().companyName} - Generador de Cotizaciones Profesionales`, 50, pageHeight - 30)
        .text('www.autoquote.com | contacto@autoquote.com | Moneda: MXN', 50, pageHeight - 20);
  }

  /**
   * Guarda el PDF en el sistema de archivos
   */
  static async savePDFToFile(pdfBuffer: Buffer, filename: string): Promise<string> {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, pdfBuffer);
    
    return filepath;
  }
}
