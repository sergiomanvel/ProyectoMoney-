import express from 'express';
import { AIService } from '../services/aiService';
import { PDFGenerator } from '../utils/pdfGenerator';
import { pool } from '../server';
import { Quote, GeneratedQuote } from '../models/Quote';
import nodemailer from 'nodemailer';
import { buildQuoteEmailHTML } from '../utils/emailTemplate';
import { getAppConfig } from '../utils/appConfig';
import { generateNextFolio } from '../utils/folio';
import { signQuoteToken, verifyQuoteToken } from '../utils/token';
import { QuoteItemsService } from '../services/quoteItemsService';

const router = express.Router();

// Configurar nodemailer con secure según puerto
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465, // SSL si 465, STARTTLS si 587
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * GET /api/email/test
 * Verifica credenciales SMTP y devuelve diagnóstico
 */
router.get('/email/test', async (_req, res) => {
  try {
    await transporter.verify();
    return res.json({
      success: true,
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      message: 'SMTP listo para enviar'
    });
  } catch (e: any) {
    console.error('SMTP verify error (GET /email/test):', e?.message || e);
    return res.status(500).json({
      success: false,
      error: 'Error de configuración SMTP',
      message: e?.message || 'Fallo en autenticación/conexión SMTP',
      code: e?.code
    });
  }
});

/**
 * GET /api/quotes/view/:token
 * Devuelve la cotización verificando token firmado (solo lectura)
 */
router.get('/quotes/view/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const payload = verifyQuoteToken(token);
    const query = `SELECT * FROM quotes WHERE id = $1`;
    const result = await pool.query(query, [payload.quoteId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }
    const quote = result.rows[0];
    const raw = quote.generated_content;
    const generated = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return res.json({
      success: true,
      quote: {
        id: quote.id,
        folio: quote.folio,
        status: quote.status,
        valid_until: quote.valid_until,
        client_name: quote.client_name,
        client_email: quote.client_email,
        project_description: quote.project_description,
        total_amount: quote.total_amount,
        generated_content: generated
      }
    });
  } catch (e: any) {
    return res.status(400).json({ error: 'Token inválido', message: e?.message });
  }
});

/**
 * GET /api/config
 * Devuelve configuración pública de la app
 */
router.get('/config', async (_req, res) => {
  const cfg = getAppConfig();
  res.json({
    appName: cfg.appName,
    companyName: cfg.companyName,
    primaryColor: cfg.primaryColor,
    defaultTaxPercent: cfg.defaultTaxPercent
  });
});

/**
 * GET /api/openai/test
 * Verifica credenciales de OpenAI y devuelve diagnóstico
 */
router.get('/openai/test', async (_req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.json({
        success: false,
        configured: false,
        error: 'OPENAI_API_KEY no configurado en .env',
        fallback: 'Sistema funcionará con clasificación local + fallback',
        demo: String(process.env.DEMO_MODE || 'false').toLowerCase() === 'true'
      });
    }

    const OpenAI = require('openai').default;
    const openai = new OpenAI({ apiKey });

    // Intentar una llamada simple para verificar quota y conectividad
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Responde solo con: "OK"' },
        { role: 'user', content: 'test' }
      ],
      max_tokens: 5
    });

    if (response.choices[0]?.message?.content) {
      return res.json({
        success: true,
        configured: true,
        message: 'OpenAI funcionando correctamente',
        model: 'gpt-4o-mini',
        response: response.choices[0].message.content,
        demo: String(process.env.DEMO_MODE || 'false').toLowerCase() === 'true'
      });
    } else {
      return res.status(500).json({
        success: false,
        configured: true,
        error: 'OpenAI respondió vacío',
        fallback: 'Sistema usará clasificación local + fallback'
      });
    }

  } catch (e: any) {
    console.error('OpenAI test error:', e?.message || e);
    
    let errorType = 'unknown';
    let errorMessage = e?.message || 'Error desconocido';
    let userMessage = 'Error conectando con OpenAI';

    if (e?.status === 429) {
      errorType = 'quota_exceeded';
      userMessage = '⚠️ Has excedido tu cuota de OpenAI';
    } else if (e?.status === 401) {
      errorType = 'invalid_api_key';
      userMessage = '❌ API Key inválida o incorrecta';
    } else if (e?.code === 'insufficient_quota') {
      errorType = 'quota_exceeded';
      userMessage = '⚠️ Has excedido tu cuota de OpenAI';
    }

    return res.status(200).json({
      success: false,
      configured: true,
      error: errorType,
      message: userMessage,
      details: errorMessage,
      fallback: '✅ Sistema funcionará con clasificación local + fallback',
      demo: String(process.env.DEMO_MODE || 'false').toLowerCase() === 'true',
      tip: 'Aumenta tu límite en https://platform.openai.com/usage'
    });
  }
});

/**
 * POST /api/generate-quote
 * Genera una nueva cotización con IA
 */
router.post('/generate-quote', async (req, res) => {
  try {
    const { clientName, clientEmail, projectDescription, priceRange, sector, items } = req.body;

    // Validar datos requeridos
    if (!clientName || !clientEmail || !projectDescription || !priceRange) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        required: ['clientName', 'clientEmail', 'projectDescription', 'priceRange']
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    console.log('🤖 Generando cotización con IA...');
    
    // Generar cotización con IA Enterprise (puede retornar error si descripción inválida)
    const quoteResult = await AIService.generateQuoteEnterprise(
      projectDescription,
      clientName,
      priceRange,
      sector,
      items
    );

    // Verificar si la IA retornó error (validación previa)
    if ('error' in quoteResult && quoteResult.error) {
      return res.status(200).json({
        success: false,
        error: quoteResult.type,
        message: quoteResult.message
      });
    }

    const generatedQuote = quoteResult as GeneratedQuote;

    console.log('📄 Generando PDF...');
    
    // Folio y vigencia
    const folio = await generateNextFolio(pool);
    const validUntil = generatedQuote.validUntil
      ? new Date(generatedQuote.validUntil)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Generar PDF
    const pdfBuffer = await PDFGenerator.generateQuotePDF(generatedQuote, folio, validUntil.toISOString().split('T')[0]);
    
    // Guardar en base de datos
    const query = `
      INSERT INTO quotes (client_name, client_email, project_description, price_range, generated_content, total_amount, created_at, folio, valid_until, status)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, 'draft')
      RETURNING id
    `;
    
    const values = [
      clientName,
      clientEmail,
      projectDescription,
      priceRange,
      JSON.stringify(generatedQuote),
      generatedQuote.total,
      folio,
      validUntil
    ];

    const result = await pool.query(query, values);
    const quoteId = result.rows[0].id;

    // Guardar PDF en archivo
    const filename = `quote_${quoteId}_${Date.now()}.pdf`;
    const filepath = await PDFGenerator.savePDFToFile(pdfBuffer, filename);

    console.log('✅ Cotización generada exitosamente');

    res.json({
      success: true,
      quoteId,
      quote: generatedQuote,
      folio,
      validUntil: validUntil.toISOString(),
      pdfUrl: `/api/quotes/${quoteId}/pdf`,
      message: 'Cotización generada exitosamente'
    });

  } catch (error) {
    console.error('Error generando cotización:', error);
    res.status(500).json({
      error: 'Error generando cotización',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/quotes
 * Obtiene todas las cotizaciones
 */
router.get('/quotes', async (req, res) => {
  try {
    const query = `
      SELECT id, folio, status, valid_until, client_name, client_email, project_description, total_amount, created_at
      FROM quotes
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      quotes: result.rows
    });

  } catch (error) {
    console.error('Error obteniendo cotizaciones:', error);
    res.status(500).json({
      error: 'Error obteniendo cotizaciones'
    });
  }
});
/**
 * POST /api/quotes/:id/accept
 * Marca la cotización como aceptada
 */
router.post('/quotes/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE quotes SET status='accepted', accepted_at=NOW() WHERE id=$1`, [id]);
    res.json({ success: true, message: 'Cotización marcada como aceptada' });
  } catch (error) {
    console.error('Error marcando como aceptada:', error);
    res.status(500).json({ error: 'Error marcando como aceptada' });
  }
});

/**
 * POST /api/quotes/:id/mark-sent
 * Marca la cotización como enviada
 */
router.post('/quotes/:id/mark-sent', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE quotes SET status='sent' WHERE id=$1`, [id]);
    res.json({ success: true, message: 'Cotización marcada como enviada' });
  } catch (error) {
    console.error('Error marcando como enviada:', error);
    res.status(500).json({ error: 'Error marcando como enviada' });
  }
});

/**
 * GET /api/quotes/:id
 * Obtiene una cotización específica
 */
router.get('/quotes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT * FROM quotes WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    const quote = result.rows[0];
    quote.generated_content = typeof quote.generated_content === 'string' ? JSON.parse(quote.generated_content) : quote.generated_content;

    res.json({
      success: true,
      quote
    });

  } catch (error) {
    console.error('Error obteniendo cotización:', error);
    res.status(500).json({
      error: 'Error obteniendo cotización'
    });
  }
});

/**
 * GET /api/quotes/:id/pdf
 * Descarga el PDF de una cotización (usa items editados si existen)
 */
router.get('/quotes/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `SELECT generated_content, folio, valid_until FROM quotes WHERE id = $1`;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    const raw = result.rows[0].generated_content;
    const generatedContent: GeneratedQuote = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const folio = result.rows[0].folio;
    const validUntil = result.rows[0].valid_until ? new Date(result.rows[0].valid_until).toISOString().split('T')[0] : undefined;

    // Intentar obtener items editados de la DB
    const editedItems = await QuoteItemsService.getItemsByQuoteId(pool, parseInt(id));
    const useEditedItems = editedItems.length > 0 && editedItems.length !== generatedContent.items.length;
    
    const pdfBuffer = await PDFGenerator.generateQuotePDF(
      generatedContent,
      folio,
      validUntil,
      useEditedItems ? editedItems : undefined
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="cotizacion_${id}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({
      error: 'Error generando PDF'
    });
  }
});

/**
 * POST /api/quotes/:id/send-email
 * Envía la cotización por email
 */
router.post('/quotes/:id/send-email', async (req, res) => {
  try {
    const { id } = req.params;
    const { customMessage } = req.body;
    
    const query = `SELECT * FROM quotes WHERE id = $1`;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    const quote = result.rows[0];
    const rawContent = quote.generated_content;
    const generatedContent: GeneratedQuote = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
    const folio = quote.folio;
    const validUntil = quote.valid_until ? new Date(quote.valid_until).toISOString().split('T')[0] : undefined;
    
    // Obtener items editados si existen
    const editedItems = await QuoteItemsService.getItemsByQuoteId(pool, parseInt(id));
    const useEditedItems = editedItems.length > 0 && editedItems.length !== generatedContent.items.length;
    
    // Generar PDF con items editados
    const pdfBuffer = await PDFGenerator.generateQuotePDF(
      generatedContent,
      folio,
      validUntil,
      useEditedItems ? editedItems : undefined
    );
    
    // Generar token y link público (también en modo demo)
    const token = signQuoteToken(Number(id));
    const cfg = getAppConfig();
    const ctaLink = `${cfg.frontendPublicUrl}/quote/view?token=${token}`;

    // Si DEMO_MODE o no hay SMTP configurado → responder sin enviar correo
    const isDemo = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';
    if (isDemo || !process.env.SMTP_HOST || !process.env.SMTP_EMAIL || !process.env.SMTP_PASS) {
      // Marcar como enviada para permitir flujo completo en demo
      await pool.query(`UPDATE quotes SET status='sent', updated_at=NOW() WHERE id=$1`, [id]);
      return res.json({
        success: true,
        message: 'Email no enviado (modo demo), configure SMTP en .env para envíos reales',
        demo: true,
        link: ctaLink
      });
    }

    // Verificar credenciales SMTP antes de enviar (errores claros)
    console.log('🔍 Verificando SMTP config:', {
      host: process.env.SMTP_HOST,
      port: smtpPort,
      email: process.env.SMTP_EMAIL,
      hasPass: !!process.env.SMTP_PASS
    });
    try {
      await transporter.verify();
      console.log('✅ SMTP verificado correctamente');
    } catch (e: any) {
      console.error('❌ SMTP verify error:', e?.message || e);
      console.error('SMTP error code:', e?.code);
      return res.status(500).json({
        error: 'Error de configuración SMTP',
        message: e?.message || 'Fallo en autenticación/conexión SMTP',
        code: e?.code
      });
    }

    // Email con plantilla HTML
    const html = buildQuoteEmailHTML({
      clientName: quote.client_name,
      projectDescription: quote.project_description,
      quote: generatedContent,
      customMessage
    });

    // ctaLink ya calculado arriba

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: quote.client_email,
      subject: `Cotización - ${generatedContent.title}`,
      html: buildQuoteEmailHTML({
        clientName: quote.client_name,
        projectDescription: quote.project_description,
        quote: generatedContent,
        customMessage,
        ctaLink
      }),
      attachments: [
        {
          filename: `cotizacion_${id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email enviado:', info.messageId);
      res.json({
        success: true,
        message: 'Cotización enviada por email exitosamente'
      });
    } catch (e: any) {
      console.error('Nodemailer sendMail error:', {
        message: e?.message,
        code: e?.code,
        command: e?.command,
        response: e?.response
      });
      return res.status(500).json({
        error: 'Error enviando email',
        message: e?.message || 'Fallo enviando email',
        code: e?.code,
        command: e?.command
      });
    }

  } catch (error) {
    console.error('Error enviando email:', error);
    res.status(500).json({
      error: 'Error enviando email',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/quotes/:id/items
 * Obtiene los items de una cotización (DB primero, luego generated_content como fallback)
 */
router.get('/quotes/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const items = await QuoteItemsService.getItemsByQuoteId(pool, parseInt(id));
    
    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('Error obteniendo items:', error);
    res.status(500).json({
      error: 'Error obteniendo items',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * POST /api/quotes/:id/items
 * Crea un nuevo item en una cotización
 */
router.post('/quotes/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const { description, quantity, unitPrice } = req.body;

    if (!description || quantity === undefined || unitPrice === undefined) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        required: ['description', 'quantity', 'unitPrice']
      });
    }

    const items = await QuoteItemsService.createItem(pool, parseInt(id), {
      description,
      quantity,
      unitPrice
    });

    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('Error creando item:', error);
    res.status(500).json({
      error: 'Error creando item',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * PUT /api/quotes/:id/items/:itemId
 * Actualiza un item existente
 */
router.put('/quotes/:id/items/:itemId', async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const updates = req.body;

    const items = await QuoteItemsService.updateItem(pool, parseInt(id), parseInt(itemId), updates);

    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('Error actualizando item:', error);
    res.status(500).json({
      error: 'Error actualizando item',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * DELETE /api/quotes/:id/items/:itemId
 * Elimina un item
 */
router.delete('/quotes/:id/items/:itemId', async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const items = await QuoteItemsService.deleteItem(pool, parseInt(id), parseInt(itemId));

    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('Error eliminando item:', error);
    res.status(500).json({
      error: 'Error eliminando item',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * POST /api/quotes/:id/migrate-items
 * Migra items de generated_content a DB (para activar edición)
 */
router.post('/quotes/:id/migrate-items', async (req, res) => {
  try {
    const { id } = req.params;
    const items = await QuoteItemsService.ensureItemsInDb(pool, parseInt(id));
    
    res.json({
      success: true,
      items,
      message: 'Items migrados exitosamente'
    });
  } catch (error) {
    console.error('Error migrando items:', error);
    res.status(500).json({
      error: 'Error migrando items',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * POST /api/quotes/:id/recalculate
 * Recalcula los totales de una cotización basándose en los items editados
 */
router.post('/quotes/:id/recalculate', async (req, res) => {
  try {
    const { id } = req.params;
    const totals = await QuoteItemsService.recalculateQuoteTotals(pool, parseInt(id));

    // Obtener quote actualizada
    const quoteResult = await pool.query(
      `SELECT * FROM quotes WHERE id = $1`,
      [id]
    );

    if (quoteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    const quote = quoteResult.rows[0];
    quote.generated_content = typeof quote.generated_content === 'string' 
      ? JSON.parse(quote.generated_content) 
      : quote.generated_content;

    res.json({
      success: true,
      quote,
      totals
    });
  } catch (error) {
    console.error('Error recalculando cotización:', error);
    res.status(500).json({
      error: 'Error recalculando cotización',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router;
