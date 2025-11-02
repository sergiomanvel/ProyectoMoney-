import { Pool } from 'pg';
import { QuoteItem } from '../models/Quote';

export class QuoteItemsService {
  /**
   * Migra items de generated_content a DB si es necesario
   */
  static async ensureItemsInDb(pool: Pool, quoteId: number): Promise<QuoteItem[]> {
    const dbCheck = await pool.query(
      `SELECT COUNT(*) as count FROM quote_items WHERE quote_id = $1`,
      [quoteId]
    );
    const hasItemsInDb = parseInt(dbCheck.rows[0].count) > 0;

    if (!hasItemsInDb) {
      // Migrar items de generated_content a DB
      const quoteResult = await pool.query(
        `SELECT generated_content FROM quotes WHERE id = $1`,
        [quoteId]
      );
      
      if (quoteResult.rows.length > 0) {
        const rawContent = quoteResult.rows[0].generated_content;
        const generatedContent = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
        
        if (generatedContent.items && generatedContent.items.length > 0) {
          // Insertar todos los items existentes en la DB
          for (let i = 0; i < generatedContent.items.length; i++) {
            const item = generatedContent.items[i];
            await pool.query(
              `INSERT INTO quote_items (quote_id, description, quantity, unit_price, total, position)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [quoteId, item.description, item.quantity, item.unitPrice, item.total, i + 1]
            );
          }
        }
      }
    }
    
    // Retornar items migrados
    return this.getItemsByQuoteId(pool, quoteId);
  }

  /**
   * Obtiene los items de una cotización (DB primero, luego generated_content como fallback)
   */
  static async getItemsByQuoteId(pool: Pool, quoteId: number): Promise<QuoteItem[]> {
    // Intentar obtener items de la DB
    const dbResult = await pool.query(
      `SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY position ASC, id ASC`,
      [quoteId]
    );

    if (dbResult.rows.length > 0) {
      return dbResult.rows.map(row => ({
        id: row.id,
        description: row.description,
        quantity: row.quantity,
        unitPrice: parseFloat(row.unit_price),
        total: parseFloat(row.total)
      }));
    }

    // Fallback: leer de generated_content
    const quoteResult = await pool.query(
      `SELECT generated_content FROM quotes WHERE id = $1`,
      [quoteId]
    );

    if (quoteResult.rows.length === 0) {
      return [];
    }

    const rawContent = quoteResult.rows[0].generated_content;
    const generatedContent = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;

    return generatedContent.items || [];
  }

  /**
   * Crea un nuevo item
   */
  static async createItem(
    pool: Pool,
    quoteId: number,
    itemData: { description: string; quantity: number; unitPrice: number }
  ): Promise<QuoteItem[]> {
    const { description, quantity, unitPrice } = itemData;
    const total = quantity * unitPrice;

    // Asegurar que los items existentes estén en DB (migración automática)
    await this.ensureItemsInDb(pool, quoteId);

    // Obtener siguiente position
    const posResult = await pool.query(
      `SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM quote_items WHERE quote_id = $1`,
      [quoteId]
    );
    const position = posResult.rows[0].next_pos;

    // Insertar el nuevo item
    await pool.query(
      `INSERT INTO quote_items (quote_id, description, quantity, unit_price, total, position)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [quoteId, description, quantity, unitPrice, total, position]
    );

    // Retornar lista actualizada
    return this.getItemsByQuoteId(pool, quoteId);
  }

  /**
   * Actualiza un item existente
   */
  static async updateItem(
    pool: Pool,
    quoteId: number,
    itemId: number,
    itemData: Partial<{ description: string; quantity: number; unitPrice: number; position: number }>
  ): Promise<QuoteItem[]> {
    // Asegurar que los items existentes estén en DB (migración automática)
    await this.ensureItemsInDb(pool, quoteId);

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (itemData.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(itemData.description);
    }

    if (itemData.quantity !== undefined) {
      updates.push(`quantity = $${paramIndex++}`);
      values.push(itemData.quantity);
    }

    if (itemData.unitPrice !== undefined) {
      updates.push(`unit_price = $${paramIndex++}`);
      values.push(itemData.unitPrice);
    }

    if (itemData.position !== undefined) {
      updates.push(`position = $${paramIndex++}`);
      values.push(itemData.position);
    }

    // Si cambió quantity o unitPrice, recalcular total
    if (itemData.quantity !== undefined || itemData.unitPrice !== undefined) {
      const currentResult = await pool.query(
        `SELECT quantity, unit_price FROM quote_items WHERE id = $1 AND quote_id = $2`,
        [itemId, quoteId]
      );

      if (currentResult.rows.length > 0) {
        const current = currentResult.rows[0];
        const qty = itemData.quantity !== undefined ? itemData.quantity : current.quantity;
        const price = itemData.unitPrice !== undefined ? itemData.unitPrice : parseFloat(current.unit_price);
        const newTotal = qty * price;
        
        updates.push(`total = $${paramIndex++}`);
        values.push(newTotal);
      }
    }

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      values.push(itemId, quoteId);

      await pool.query(
        `UPDATE quote_items SET ${updates.join(', ')} WHERE id = $${paramIndex} AND quote_id = $${paramIndex + 1}`,
        values
      );
    }

    return this.getItemsByQuoteId(pool, quoteId);
  }

  /**
   * Elimina un item
   */
  static async deleteItem(pool: Pool, quoteId: number, itemId: number): Promise<QuoteItem[]> {
    // Asegurar que los items existentes estén en DB (migración automática)
    await this.ensureItemsInDb(pool, quoteId);

    await pool.query(
      `DELETE FROM quote_items WHERE id = $1 AND quote_id = $2`,
      [itemId, quoteId]
    );

    return this.getItemsByQuoteId(pool, quoteId);
  }

  /**
   * Recalcula los totales de una cotización
   */
  static async recalculateQuoteTotals(pool: Pool, quoteId: number): Promise<{
    subtotal: number;
    tax: number;
    total: number;
  }> {
    const items = await this.getItemsByQuoteId(pool, quoteId);

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    // Obtener tax percent desde la cotización o config
    const quoteResult = await pool.query(
      `SELECT generated_content FROM quotes WHERE id = $1`,
      [quoteId]
    );

    if (quoteResult.rows.length === 0) {
      throw new Error('Cotización no encontrada');
    }

    const rawContent = quoteResult.rows[0].generated_content;
    const generatedContent = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;

    // Obtener tax percent de la cotización o usar default
    const taxPercent = generatedContent.taxPercent || parseFloat(process.env.DEFAULT_TAX_PERCENT || '16');
    const tax = subtotal * (taxPercent / 100);
    const total = subtotal + tax;

    // Actualizar quote
    await pool.query(
      `UPDATE quotes SET total_amount = $1 WHERE id = $2`,
      [total, quoteId]
    );

    // Actualizar generated_content con los items editados
    const updatedContent = {
      ...generatedContent,
      items,
      subtotal,
      taxAmount: tax,
      total
    };

    await pool.query(
      `UPDATE quotes SET generated_content = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(updatedContent), quoteId]
    );

    return { subtotal, tax, total };
  }
}

