/**
 * Strips HTML/script tags from string inputs to prevent stored XSS attacks.
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/on\w+\s*=\s*[^\s>]+/gi, "")
    .trim();
}

/**
 * Sanitizes an object's string fields by stripping HTML tags.
 * Returns a new object with sanitized strings.
 */
export function sanitizeStrings<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = stripHtml(sanitized[key] as string) as T[Extract<keyof T, string>];
    }
  }
  return sanitized;
}