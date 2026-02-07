/**
 * Contact obfuscation utilities to prevent bot scraping
 */

export function encodeEmail(email: string): { user: string; domain: string } {
  // Reverse the strings for obfuscation
  const [user, domain] = email.split('@');
  return {
    user: user.split('').reverse().join(''),
    domain: domain.split('').reverse().join(''),
  };
}

export function decodeEmail(encoded: { user: string; domain: string }): string {
  const user = encoded.user.split('').reverse().join('');
  const domain = encoded.domain.split('').reverse().join('');
  return `${user}@${domain}`;
}

export function encodePhone(phone: string): string {
  // Simple obfuscation - reverse the string
  return phone.split('').reverse().join('');
}

export function decodePhone(encoded: string): string {
  return encoded.split('').reverse().join('');
}
