import { Pool } from 'pg';

export async function generateNextFolio(pool: Pool): Promise<string> {
  const year = new Date().getFullYear();
  const result = await pool.query(
    `SELECT folio FROM quotes WHERE folio LIKE $1 ORDER BY id DESC LIMIT 1`,
    [`AQ-${year}-%`]
  );

  let nextNumber = 1;
  if (result.rows.length > 0) {
    const last = result.rows[0].folio as string;
    const match = last.match(/AQ-\d{4}-(\d{4})/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  const padded = String(nextNumber).padStart(4, '0');
  return `AQ-${year}-${padded}`;
}


