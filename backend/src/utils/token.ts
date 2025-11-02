import jwt from 'jsonwebtoken';

const DEFAULT_EXPIRES = '30d';

export function signQuoteToken(quoteId: number): string {
  const secret = process.env.JWT_SECRET || 'dev_secret';
  return jwt.sign({ quoteId }, secret, { expiresIn: DEFAULT_EXPIRES });
}

export function verifyQuoteToken(token: string): { quoteId: number } {
  const secret = process.env.JWT_SECRET || 'dev_secret';
  const payload = jwt.verify(token, secret) as { quoteId: number };
  return payload;
}


