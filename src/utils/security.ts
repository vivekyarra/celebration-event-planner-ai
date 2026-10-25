/**
 * Security & Input Sanitization Utilities
 * Protects against XSS, injection attacks, and malformed inputs.
 */

export function sanitizeHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function validateCurrencyAmount(val: number): boolean {
  return typeof val === 'number' && !isNaN(val) && isFinite(val) && val >= 0;
}

export function validateEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
}

export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return '';
  return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
}
