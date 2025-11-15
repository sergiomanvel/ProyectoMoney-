import PDFDocument from 'pdfkit';
import { GeneratedQuote, QuoteItem } from '../models/Quote';
import fs from 'fs';
import path from 'path';
import { getAppConfig } from './appConfig';
import { formatCurrency, getLocaleForCurrency } from './currencyDetector';

export class PDFGenerator {
  /**
   * Formatea montos según la moneda de la cotización
   */
  private static formatMoney(amount: number, currency: string = 'MXN'): string {
    return formatCurrency(amount, currency);
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
        const currency = quote.currency || 'MXN';
        
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
          finalQuote.currency = currency;
        }

        // Header
        this.addHeader(doc, finalQuote, primaryColor, folio, validUntil);
        
        // Información del cliente
        this.addClientInfo(doc, finalQuote, secondaryColor);
        
        // Descripción del proyecto
        this.addProjectDescription(doc, finalQuote, secondaryColor);
        
        // Tabla de items (usar items editados)
        this.addItemsTable(doc, finalItems, primaryColor, secondaryColor, currency);
        
        // Totales
        this.addTotals(doc, finalQuote, accentColor, currency);
        
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
    const currency = quote.currency || 'MXN';
    doc.fontSize(10)
       .fillColor('#64748b')
       .text(`Fecha: ${currentDate}`, 400, 50);
    if (validUntil) {
      doc.text(`Válida hasta: ${validUntil}`, 400, 65);
    } else {
      doc.text(`Válida hasta: ${quote.validUntil}`, 400, 65);
    }
    doc.text(`Moneda: ${currency}`, 400, 80);
  }

  /**
   * Añade información del cliente
   */
  private static addClientInfo(doc: PDFKit.PDFDocument, quote: GeneratedQuote, color: string) {
    if (doc.y < 200) {
      doc.y = 200;
    }
    this.ensureSpace(doc, 40);
    doc.moveDown(0.5);
    doc.fontSize(14)
       .fillColor('#1f2937')
       .text('Información del Cliente', { align: 'left' });
    doc.moveDown(0.2);
    doc.fontSize(12)
       .fillColor(color)
       .text(`Cliente: ${quote.clientName}`, { align: 'left' });
  }

  /**
   * Añade descripción del proyecto
   */
  private static addProjectDescription(doc: PDFKit.PDFDocument, quote: GeneratedQuote, color: string) {
    this.ensureSpace(doc, 80);
    doc.moveDown(1);
    doc.fontSize(14)
       .fillColor('#1f2937')
       .text('Descripción del Proyecto', { align: 'left' });
    doc.moveDown(0.3);
    doc.fontSize(11)
       .fillColor(color)
       .text(quote.projectDescription, {
         width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
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
    secondaryColor: string,
    currency: string = 'MXN'
  ) {
    doc.moveDown(1);
    const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const startX = doc.page.margins.left;
    const headerHeight = 24;
    const rowHeight = 26;
    const colDesc = startX + 10;
    const colQty = startX + tableWidth * 0.65;
    const colUnit = startX + tableWidth * 0.78;
    const colTotal = startX + tableWidth * 0.90;

    const drawHeader = () => {
      this.ensureSpace(doc, headerHeight + 10);
      const y = doc.y;
      doc.save();
      doc.rect(startX, y, tableWidth, headerHeight).fill(primaryColor);
      doc.restore();
      doc.fontSize(11).fillColor('#ffffff');
      doc.text('Descripción', colDesc, y + 7);
      doc.text('Cantidad', colQty, y + 7);
      doc.text('Precio Unit.', colUnit, y + 7);
      doc.text('Total', colTotal, y + 7);
      doc.y = y + headerHeight;
    };

    const drawRow = (item: QuoteItem, index: number) => {
      this.ensureSpace(doc, rowHeight + 10);
      const y = doc.y;
      const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.save();
      doc.rect(startX, y, tableWidth, rowHeight).fill(bgColor);
      doc.restore();
      doc.fontSize(10).fillColor('#1f2937');
      doc.text(item.description, colDesc, y + 6, { width: colQty - colDesc - 10 });
      doc.text(item.quantity.toString(), colQty, y + 6, { width: colUnit - colQty - 10, align: 'left' });
      doc.text(`${this.formatMoney(item.unitPrice, currency)}`, colUnit, y + 6, { width: colTotal - colUnit - 5, align: 'left' });
      doc.text(`${this.formatMoney(item.total, currency)}`, colTotal, y + 6, { align: 'left' });
      doc.y = y + rowHeight;
    };

    drawHeader();
    items.forEach((item, index) => drawRow(item, index));

    doc.strokeColor(primaryColor)
       .lineWidth(1)
       .moveTo(startX, doc.y)
       .lineTo(startX + tableWidth, doc.y)
       .stroke();
    doc.moveDown(0.5);
  }

  /**
   * Añade sección de totales
   */
  private static addTotals(doc: PDFKit.PDFDocument, quote: GeneratedQuote, accentColor: string, currency: string = 'MXN') {
    doc.moveDown(1.2);
    this.ensureSpace(doc, 80);
    const cfg = getAppConfig();
    const tax = Number.isFinite(quote.tax) ? (quote.tax as number) : Math.round(quote.subtotal * (cfg.defaultTaxPercent / 100));
    const total = Number.isFinite(quote.total) ? (quote.total as number) : Math.round(quote.subtotal + tax);
    const taxLabel = currency === 'EUR' ? 'IVA (21%)' : currency === 'USD' ? 'Tax' : `IVA (${cfg.defaultTaxPercent}%)`;
    const rightX = doc.page.width - doc.page.margins.right;

    doc.fontSize(12)
       .fillColor('#1f2937')
       .text('Subtotal:', rightX - 150, doc.y, { width: 80, align: 'right' })
       .text(`${this.formatMoney(quote.subtotal, currency)}`, rightX - 60, doc.y - 12, { width: 60, align: 'right' });
    doc.moveDown(0.2);
    doc.text(`${taxLabel}:`, rightX - 150, doc.y, { width: 80, align: 'right' })
       .text(`${this.formatMoney(tax, currency)}`, rightX - 60, doc.y - 12, { width: 60, align: 'right' });
    doc.moveDown(0.4);
    doc.fontSize(14)
       .fillColor(accentColor)
       .text('TOTAL:', rightX - 150, doc.y, { width: 80, align: 'right' })
       .text(`${this.formatMoney(total, currency)}`, rightX - 60, doc.y - 14, { width: 60, align: 'right' });
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
    doc.moveDown(1.2);
    this.ensureSpace(doc, 40 + quote.terms.length * 14);
    doc.fontSize(12)
       .fillColor('#1f2937')
       .text('Términos y Condiciones');
    doc.moveDown(0.4);
    doc.fontSize(10)
       .fillColor(color);

    quote.terms.forEach((term) => {
      this.ensureSpace(doc, 14);
      doc.text(`• ${term}`, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: 'left'
      });
      doc.moveDown(0.2);
    });
  }

  /**
   * Añade footer
   */
  private static addFooter(doc: PDFKit.PDFDocument, color: string) {
    const pageHeight = doc.page.height;
    const left = doc.page.margins.left;
    doc.fontSize(8)
       .fillColor('#64748b')
       .text(`${getAppConfig().companyName} - Generador de Cotizaciones Profesionales`, left, pageHeight - 30)
       .text('www.autoquote.com | contacto@autoquote.com', left, pageHeight - 20);
  }
  private static ensureSpace(doc: PDFKit.PDFDocument, required: number) {
    const available = doc.page.height - doc.page.margins.bottom;
    if (doc.y + required > available) {
      doc.addPage();
      doc.moveDown(0.5);
    }
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
