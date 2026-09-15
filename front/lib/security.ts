/**
 * Security & Data Sanitization Utilities
 * Protects against XSS, Injection, Malicious payloads, and Data Tampering.
 */

// 1. Sanitize text by stripping executable HTML tags, javascript: links, and event handlers
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove <script>...</script>
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove <iframe>...</iframe>
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove <object>...</object>
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')   // Remove <embed>...</embed>
    .replace(/javascript:/gi, '')                                      // Strip javascript: pseudo-protocol
    .replace(/on\w+="[^"]*"/gi, '')                                    // Strip event handlers e.g. onclick="..."
    .replace(/on\w+='[^']*'/gi, '')                                    // Strip event handlers e.g. onclick='...'
    .replace(/on\w+=\S+/gi, '')                                        // Strip unquoted event handlers
    .trim();
}

// 2. Validate email format
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email.trim());
}

// 3. Normalize Pakistani phone number (formats: 03001234567, +923001234567, 923001234567 -> 03001234567)
export function normalizePhoneNumber(raw: string | null | undefined): string {
  if (!raw) return '';
  let cleaned = raw.trim().replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('+92')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('0092')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('92') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.slice(2);
  } else if (cleaned.length === 10 && cleaned.startsWith('3')) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
}

// 4. Validate Pakistani mobile / landline phone number format
export function isValidPakistaniPhone(phone: string): boolean {
  if (!phone) return false;
  const normalized = normalizePhoneNumber(phone);
  // Mobile format: 03xxxxxxxxx (11 digits) or Landline format: 021xxxxxxxx / 0[2-9]xxxxxxxx
  const mobileRegex = /^03[0-9]{9}$/;
  const landlineRegex = /^0[2-9][0-9]{8,9}$/;
  return mobileRegex.test(normalized) || landlineRegex.test(normalized);
}

// Legacy alias for compatibility
export function isValidPhone(phone: string): boolean {
  return isValidPakistaniPhone(phone);
}

// 4. Validate and clean slug
export function sanitizeSlug(slug: string): string {
  if (!slug) return '';
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

// 5. Rate-limiting tracker for client-side abuse prevention (in addition to server-side checks)
const rateLimitMap = new Map<string, { count: number; firstAttempt: number }>();

export function checkClientRateLimit(actionKey: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(actionKey);

  if (!record) {
    rateLimitMap.set(actionKey, { count: 1, firstAttempt: now });
    return true;
  }

  if (now - record.firstAttempt > windowMs) {
    // Window expired, reset
    rateLimitMap.set(actionKey, { count: 1, firstAttempt: now });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false; // Limit exceeded
  }

  record.count += 1;
  return true;
}
