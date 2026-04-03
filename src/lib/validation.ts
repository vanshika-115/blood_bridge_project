export function isValidContact(value: string): boolean {
  return /^\d{10}$/.test(value);
}

export function sanitizeContactInput(value: string): string {
  // Strip non-digit characters
  return value.replace(/\D/g, "").slice(0, 10);
}
