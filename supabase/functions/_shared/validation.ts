/**
 * Shared validation utilities for Edge Functions
 * Provides input sanitization and validation without external dependencies
 */

// Maximum field lengths for various input types
export const MAX_LENGTHS = {
  name: 200,
  email: 255,
  phone: 30,
  address: 500,
  notes: 10000,
  content: 5000,
  url: 2000,
  templateText: 1000,
  specialTerms: 5000,
} as const;

// Validation result type
export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: unknown;
}

/**
 * Validates and sanitizes a string field
 */
export function validateString(
  value: unknown,
  fieldName: string,
  options: {
    required?: boolean;
    maxLength?: number;
    minLength?: number;
    pattern?: RegExp;
    sanitizeForAI?: boolean;
  } = {}
): ValidationResult {
  const { required = false, maxLength, minLength, pattern, sanitizeForAI = false } = options;

  // Handle null/undefined
  if (value === null || value === undefined || value === "") {
    if (required) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true, sanitized: undefined };
  }

  // Must be a string
  if (typeof value !== "string") {
    return { valid: false, error: `${fieldName} must be a string` };
  }

  let sanitized = value.trim();

  // Check length constraints
  if (maxLength && sanitized.length > maxLength) {
    return { valid: false, error: `${fieldName} must be less than ${maxLength} characters` };
  }

  if (minLength && sanitized.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }

  // Check pattern
  if (pattern && !pattern.test(sanitized)) {
    return { valid: false, error: `${fieldName} has an invalid format` };
  }

  // Sanitize for AI if requested (removes potential prompt injection patterns)
  if (sanitizeForAI) {
    sanitized = sanitizeForAIInput(sanitized);
  }

  return { valid: true, sanitized };
}

/**
 * Validates a number field
 */
export function validateNumber(
  value: unknown,
  fieldName: string,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}
): ValidationResult {
  const { required = false, min, max, integer = false } = options;

  // Handle null/undefined
  if (value === null || value === undefined) {
    if (required) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true, sanitized: undefined };
  }

  // Must be a number
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (typeof num !== "number" || isNaN(num) || !isFinite(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  // Check if integer is required
  if (integer && !Number.isInteger(num)) {
    return { valid: false, error: `${fieldName} must be an integer` };
  }

  // Check range
  if (min !== undefined && num < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }

  if (max !== undefined && num > max) {
    return { valid: false, error: `${fieldName} must be at most ${max}` };
  }

  return { valid: true, sanitized: num };
}

/**
 * Validates an email address
 */
export function validateEmail(value: unknown, required = false): ValidationResult {
  if (!value || value === "") {
    if (required) {
      return { valid: false, error: "Email is required" };
    }
    return { valid: true, sanitized: undefined };
  }

  if (typeof value !== "string") {
    return { valid: false, error: "Email must be a string" };
  }

  const sanitized = value.trim().toLowerCase();

  if (sanitized.length > MAX_LENGTHS.email) {
    return { valid: false, error: `Email must be less than ${MAX_LENGTHS.email} characters` };
  }

  // Basic email pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(sanitized)) {
    return { valid: false, error: "Invalid email format" };
  }

  return { valid: true, sanitized };
}

/**
 * Validates a URL
 */
export function validateUrl(value: unknown, required = false): ValidationResult {
  if (!value || value === "") {
    if (required) {
      return { valid: false, error: "URL is required" };
    }
    return { valid: true, sanitized: undefined };
  }

  if (typeof value !== "string") {
    return { valid: false, error: "URL must be a string" };
  }

  const sanitized = value.trim();

  if (sanitized.length > MAX_LENGTHS.url) {
    return { valid: false, error: `URL must be less than ${MAX_LENGTHS.url} characters` };
  }

  // Basic URL pattern (must be http or https)
  try {
    const url = new URL(sanitized);
    if (!["http:", "https:"].includes(url.protocol)) {
      return { valid: false, error: "URL must use http or https protocol" };
    }
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  return { valid: true, sanitized };
}

/**
 * Validates a UUID
 */
export function validateUUID(value: unknown, fieldName: string, required = false): ValidationResult {
  if (!value || value === "") {
    if (required) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true, sanitized: undefined };
  }

  if (typeof value !== "string") {
    return { valid: false, error: `${fieldName} must be a string` };
  }

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(value)) {
    return { valid: false, error: `${fieldName} must be a valid UUID` };
  }

  return { valid: true, sanitized: value.toLowerCase() };
}

/**
 * Validates an enum value
 */
export function validateEnum<T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[],
  required = false
): ValidationResult {
  if (!value || value === "") {
    if (required) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true, sanitized: undefined };
  }

  if (typeof value !== "string") {
    return { valid: false, error: `${fieldName} must be a string` };
  }

  if (!allowedValues.includes(value as T)) {
    return { valid: false, error: `${fieldName} must be one of: ${allowedValues.join(", ")}` };
  }

  return { valid: true, sanitized: value };
}

/**
 * Sanitizes text for AI input to prevent prompt injection attacks
 */
export function sanitizeForAIInput(text: string, maxLength = 5000): string {
  if (!text) return "";

  // Trim and normalize whitespace
  let sanitized = text.trim().replace(/\s+/g, " ");

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + "...";
  }

  // Remove or replace potential prompt injection patterns
  const dangerousPatterns = [
    { pattern: /ignore\s+(all\s+)?previous\s+(instructions|prompts?)/gi, replacement: "[instruction reference removed]" },
    { pattern: /disregard\s+(all\s+)?(previous|above|prior)/gi, replacement: "[instruction reference removed]" },
    { pattern: /system\s*:\s*/gi, replacement: "" },
    { pattern: /assistant\s*:\s*/gi, replacement: "" },
    { pattern: /user\s*:\s*/gi, replacement: "" },
    { pattern: /you\s+are\s+now\s+(a|an)?/gi, replacement: "" },
    { pattern: /pretend\s+(you\s+are|to\s+be)/gi, replacement: "" },
    { pattern: /act\s+as\s+(a|an|if)/gi, replacement: "" },
    { pattern: /\[\s*INST\s*\]/gi, replacement: "" },
    { pattern: /\[\s*\/\s*INST\s*\]/gi, replacement: "" },
    { pattern: /<<\s*SYS\s*>>/gi, replacement: "" },
    { pattern: /<<\s*\/\s*SYS\s*>>/gi, replacement: "" },
  ];

  for (const { pattern, replacement } of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  return sanitized;
}

/**
 * Creates a validation error response
 */
export function validationErrorResponse(
  errors: string[],
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ 
      error: "Validation failed", 
      details: errors 
    }),
    { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
}

/**
 * Bulk validate multiple fields and collect errors
 */
export function validateFields(
  validations: Array<{ result: ValidationResult; field: string }>
): { valid: boolean; errors: string[]; sanitized: Record<string, unknown> } {
  const errors: string[] = [];
  const sanitized: Record<string, unknown> = {};

  for (const { result, field } of validations) {
    if (!result.valid && result.error) {
      errors.push(result.error);
    } else {
      sanitized[field] = result.sanitized;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}
