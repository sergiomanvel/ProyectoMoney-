export type AppConfig = {
  appName: string;
  primaryColor: string;
  companyName: string;
  defaultTaxPercent: number;
  frontendPublicUrl: string;
};

export function getAppConfig(): AppConfig {
  const defaultTax = parseFloat(process.env.DEFAULT_TAX_PERCENT || '16');
  return {
    appName: process.env.APP_NAME || 'AutoQuote',
    primaryColor: process.env.APP_PRIMARY_COLOR || '#2563eb',
    companyName: process.env.COMPANY_NAME || 'Tu Empresa S.A. de C.V.',
    defaultTaxPercent: isFinite(defaultTax) ? defaultTax : 16,
    frontendPublicUrl: process.env.FRONTEND_PUBLIC_URL || 'http://localhost:4200',
  };
}


