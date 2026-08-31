/**
 * Aceita o que a planilha do Google Sheets mandar de volta — nem sempre é
 * string (uma célula "Valor" preenchida na mão pode voltar como número).
 */
function asString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

/** Formata dígitos digitados como moeda brasileira: "R$ 1.234,56" */
export function formatCurrencyBRL(raw: unknown): string {
  const digits = asString(raw).replace(/\D/g, '');
  if (!digits) return '';
  const cents = digits.padStart(3, '0');
  const intPart = cents.slice(0, -2).replace(/^0+(?=\d)/, '');
  const decPart = cents.slice(-2);
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${withThousands},${decPart}`;
}

/** Converte uma string "R$ 1.234,56" (ou variações, ou número puro) em número (1234.56) */
export function parseCurrencyBRL(value: unknown): number {
  if (typeof value === 'number') return value;
  const digits = asString(value).replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

/** Formata dígitos digitados como telefone: "(84) 9 9999-9999" */
export function formatPhoneBR(raw: unknown): string {
  const digits = asString(raw).replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}
