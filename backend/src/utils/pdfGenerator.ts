import PDFDocument from 'pdfkit';
import { GeneratedQuote, QuoteItem } from '../models/Quote';
import fs from 'fs';
import path from 'path';
import { getAppConfig } from './appConfig';
import { formatCurrency } from './currencyDetector';

export class PDFGenerator {
  /**
   * Formatea montos según la moneda de la cotización
   */
  private static formatMoney(amount: number, currency: string = 'MXN'): string {
    return formatCurrency(amount, currency);
  }
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
        doc.on('end', () => resolve(Buffer.concat(buffers)));

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

        this.addHeader(doc, finalQuote, primaryColor, folio, validUntil);
        this.addClientInfo(doc, finalQuote, secondaryColor);
        this.addProjectDescription(doc, finalQuote, secondaryColor);
        this.addItemsTable(doc, finalItems, primaryColor, currency);
        this.addTotals(doc, finalQuote, accentColor, currency);
        this.addTerms(doc, finalQuote, secondaryColor);
        this.addFooter(doc);

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  private static addHeader(
    doc: PDFKit.PDFDocument,
    quote: GeneratedQuote,
    color: string,
    folio?: string,
    validUntil?: string
  ) {
    const { top, left, right } = doc.page.margins;
    const width = doc.page.width - left - right;
    const startY = top;

    // Bloque izquierdo (logo)
    doc.save().rect(left, startY, 60, 60).fill(color);
    doc.fillColor('#ffffff').fontSize(16).text('LOGO', left, startY + 18, { width: 60, align: 'center' });
    doc.restore();

    // Centro (marca)
    doc.fontSize(24)
      .fillColor(color)
      .text(getAppConfig().appName, left, startY, { width, align: 'center' });
    doc.fontSize(12)
      .fillColor('#64748b')
      .text('Generador de Cotizaciones Profesionales', left, startY + 28, { width, align: 'center' });

    // Bloque derecho
    const infoX = doc.page.width - right - 150;
    const currency = quote.currency || 'MXN';
    const currentDate = new Date().toLocaleDateString('es-ES');
    doc.fontSize(10).fillColor('#1f2937');
    doc.text(`Fecha: ${currentDate}`, infoX, startY, { width: 150, align: 'right' });
    doc.text(`Válida hasta: ${validUntil || quote.validUntil}`, infoX, startY + 12, { width: 150, align: 'right' });
    doc.text(`Moneda: ${currency}`, infoX, startY + 24, { width: 150, align: 'right' });
    if (folio) {
      doc.text(`Folio: ${folio}`, infoX, startY + 36, { width: 150, align: 'right' });
    }

    // Título
    doc.fontSize(20)
      .fillColor('#1f2937')
      .text(quote.title, left, startY + 72, { width, align: 'center' });

    doc.moveTo(left, startY + 100)
      .lineTo(doc.page.width - right, startY + 100)
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .stroke();

    doc.y = startY + 110;
  }

  /**
   * Añade información del cliente
   */
  private static addClientInfo(doc: PDFKit.PDFDocument, quote: GeneratedQuote, color: string) {
    this.ensureSpace(doc, 45);
    doc.fontSize(12)
      .fillColor('#1f2937')
      .text('Información del Cliente');
    doc.moveDown(0.2);
    doc.fontSize(10)
      .fillColor(color)
      .text(`Cliente: ${quote.clientName}`);
    doc.moveDown(0.4);
  }

  /**
   * Añade descripción del proyecto
   */
  private static addProjectDescription(doc: PDFKit.PDFDocument, quote: GeneratedQuote, color: string) {
    this.ensureSpace(doc, 80);
    doc.fontSize(12)
      .fillColor('#1f2937')
      .text('Descripción del Proyecto');
    doc.moveDown(0.2);
    doc.fontSize(10)
      .fillColor(color)
      .text(quote.projectDescription, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: 'justify'
      });
    doc.moveDown(0.6);
  }

  /**
   * Añade tabla de items
   */
  private static addItemsTable(
    doc: PDFKit.PDFDocument,
    items: QuoteItem[],
    primaryColor: string,
    currency: string
  ) {
    const startX = doc.page.margins.left;
    const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const headerHeight = 24;
    const rowHeight = 28;
    const columns = {
      desc: startX + 10,
      qty: startX + tableWidth * 0.60,
      unit: startX + tableWidth * 0.73,
      total: startX + tableWidth * 0.87
    };

    const drawHeader = () => {
      const y = doc.y;
      doc.save().rect(startX, y, tableWidth, headerHeight).fill(primaryColor).restore();
      doc.fontSize(10).fillColor('#ffffff');
      doc.text('Descripción', columns.desc, y + 7);
      doc.text('Cantidad', columns.qty, y + 7, { width: columns.unit - columns.qty - 6 });
      doc.text('Precio Unit.', columns.unit, y + 7, { width: columns.total - columns.unit - 6 });
      doc.text('Total', columns.total, y + 7, { align: 'left' });
      doc.y = y + headerHeight;
    };

    const drawRow = (item: QuoteItem, index: number) => {
      if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        doc.y = doc.page.margins.top;
        drawHeader();
      }
      const y = doc.y;
      const descHeight = doc.heightOfString(item.description, {
        width: columns.qty - columns.desc - 8,
        lineGap: 2
      });
      const effectiveHeight = Math.max(rowHeight, descHeight + 10);
      const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.save().rect(startX, y, tableWidth, effectiveHeight).fill(bgColor).restore();
      doc.fontSize(9.5).fillColor('#1f2937');
      doc.text(item.description, columns.desc, y + 6, {
        width: columns.qty - columns.desc - 8,
        lineGap: 2,
        height: effectiveHeight - 12
      });
      doc.text(item.quantity.toString(), columns.qty, y + 6, { width: columns.unit - columns.qty - 6, align: 'left' });
      doc.text(this.formatMoney(item.unitPrice, currency), columns.unit, y + 6, { width: columns.total - columns.unit - 6, align: 'left' });
      doc.text(this.formatMoney(item.unitPrice * item.quantity, currency), columns.total, y + 6, { align: 'left' });
      doc.y = y + effectiveHeight + 6;
    };

    this.ensureSpace(doc, headerHeight + 10);
    drawHeader();
    items.forEach((item, index) => drawRow(item, index));

    doc.strokeColor(primaryColor)
      .lineWidth(1)
      .moveTo(startX, doc.y)
      .lineTo(startX + tableWidth, doc.y)
      .stroke();
    doc.moveDown(0.4);
  }

  /**
   * Añade sección de totales
   */
  private static addTotals(doc: PDFKit.PDFDocument, quote: GeneratedQuote, accentColor: string, currency: string = 'MXN') {
    doc.moveDown(0.8);
    this.ensureSpace(doc, 60);
    const cfg = getAppConfig();
    const tax = Number.isFinite(quote.tax) ? (quote.tax as number) : Math.round(quote.subtotal * (cfg.defaultTaxPercent / 100));
    const total = Number.isFinite(quote.total) ? (quote.total as number) : Math.round(quote.subtotal + tax);
    const taxLabel = currency === 'EUR' ? 'IVA (21%)' : currency === 'USD' ? 'Tax' : `IVA (${cfg.defaultTaxPercent}%)`;
    const rightX = doc.page.width - doc.page.margins.right;

    doc.fontSize(11)
       .fillColor('#1f2937')
       .text('Subtotal:', rightX - 150, doc.y, { width: 90, align: 'right' })
       .text(`${this.formatMoney(quote.subtotal, currency)}`, rightX - 50, doc.y - 12, { width: 50, align: 'right' });
    doc.moveDown(0.2);
    doc.text(`${taxLabel}:`, rightX - 150, doc.y, { width: 90, align: 'right' })
       .text(`${this.formatMoney(tax, currency)}`, rightX - 50, doc.y - 12, { width: 50, align: 'right' });
    doc.moveDown(0.4);
    doc.fontSize(12)
       .fillColor(accentColor)
       .text('TOTAL:', rightX - 150, doc.y, { width: 90, align: 'right' })
       .text(`${this.formatMoney(total, currency)}`, rightX - 50, doc.y - 14, { width: 50, align: 'right' });
    doc.moveDown(0.6);
  }

  /**
   * Recalcula totales a partir de items y tax percent
   */
  private static recalculateTotals(items: QuoteItem[], taxPercent: number): GeneratedQuote {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
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
    if (!quote.terms || quote.terms.length === 0) {
      return;
    }
    this.ensureSpace(doc, 40 + quote.terms.length * 12);
    doc.x = doc.page.margins.left;
    doc.fontSize(11)
       .fillColor('#1f2937')
       .text('Términos y Condiciones');
    doc.moveDown(0.2);
    doc.fontSize(9)
       .fillColor(color);

    quote.terms.forEach((term) => {
      this.ensureSpace(doc, 12);
      doc.text(`• ${term}`, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: 'left'
      });
      doc.moveDown(0.1);
    });
    doc.moveDown(0.3);
  }

  /**
   * Añade footer
   */
  private static addFooter(doc: PDFKit.PDFDocument) {
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
      doc.y = doc.page.margins.top;
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
