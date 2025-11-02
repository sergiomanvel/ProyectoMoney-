import { GeneratedQuote } from '../models/Quote';
import { getAppConfig } from './appConfig';

export function buildQuoteEmailHTML(opts: {
  clientName: string;
  projectDescription: string;
  quote: GeneratedQuote;
  customMessage?: string;
  ctaLink?: string;
}): string {
  const { clientName, projectDescription, quote, customMessage, ctaLink } = opts;

  const currency = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  });

  const itemsRows = quote.items
    .map(
      (i) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #111827;">${i.description}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align:center; color: #111827;">${i.quantity}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align:right; color: #111827;">${currency.format(i.unitPrice)}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align:right; color: #111827; font-weight:600;">${currency.format(i.total)}</td>
        </tr>`
    )
    .join('');

  const cfg = getAppConfig();
  return `
  <!doctype html>
  <html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${quote.title}</title>
  </head>
  <body style="margin:0; padding:0; background:#f8fafc; font-family: Inter, -apple-system, Segoe UI, Roboto, sans-serif; color:#111827;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="640" style="background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 1px 2px rgba(0,0,0,0.05); overflow:hidden;">
            <tr>
              <td style="padding:24px; background:${cfg.primaryColor}; color:#ffffff;">
                <table width="100%">
                  <tr>
                    <td style="font-size:20px; font-weight:700;">${cfg.appName}</td>
                    <td style="text-align:right; font-size:12px; opacity:0.9;">${cfg.companyName}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h1 style="margin:0 0 8px 0; font-size:20px;">${quote.title}</h1>
                <p style="margin:0 0 16px 0; color:#6b7280;">Cliente: <strong>${clientName}</strong></p>
                <p style="margin:0 0 16px 0;">${customMessage || 'Adjunto encontrará la cotización solicitada para su proyecto.'}</p>
                <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:16px; margin:16px 0;">
                  <p style="margin:0; color:#374151; font-weight:600;">Descripción del proyecto</p>
                  <p style="margin:8px 0 0 0; color:#374151;">${projectDescription}</p>
                </div>

                ${ctaLink ? `
                <div style="text-align:center; margin:20px 0;">
                  <a href="${ctaLink}"
                     style="background:${cfg.primaryColor}; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:600; display:inline-block;">
                    Ver cotización online
                  </a>
                </div>
                ` : ''}

                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:8px 0 16px 0;">
                  <thead>
                    <tr style="background:#f3f4f6; text-transform:uppercase; letter-spacing:.04em; font-size:12px; color:#6b7280;">
                      <th align="left" style="padding:10px 12px;">Descripción</th>
                      <th align="center" style="padding:10px 12px;">Cantidad</th>
                      <th align="right" style="padding:10px 12px;">Precio Unit.</th>
                      <th align="right" style="padding:10px 12px;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsRows}
                  </tbody>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
                  <tr>
                    <td style="text-align:right; color:#6b7280;">Subtotal:</td>
                    <td style="text-align:right; width:160px; font-weight:600;">${currency.format(quote.subtotal)}</td>
                  </tr>
                  <tr>
                    <td style="text-align:right; color:#6b7280;">IVA (16%):</td>
                    <td style="text-align:right; width:160px; font-weight:600;">${currency.format(quote.tax)}</td>
                  </tr>
                  <tr>
                    <td style="text-align:right; font-weight:700; padding-top:8px;">Total:</td>
                    <td style="text-align:right; width:160px; font-weight:700; color:#16a34a; padding-top:8px;">${currency.format(quote.total)}</td>
                  </tr>
                </table>

                <div style="margin-top:16px;">
                  <p style="margin:0 0 6px 0; font-weight:600;">Términos y Condiciones:</p>
                  <ul style="margin:6px 0; padding-left:18px; color:#374151;">
                    ${quote.terms.map((t) => `<li>${t}</li>`).join('')}
                  </ul>
                  <p style="margin:8px 0 0 0; color:#6b7280;">Válida hasta: <strong>${quote.validUntil}</strong></p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px; background:#ffffff; border-top:1px solid #e5e7eb; color:#6b7280; font-size:12px;">
                ${cfg.appName} · ${cfg.companyName}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}


