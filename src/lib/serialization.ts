// Serialization utilities for handling Prisma types in JSON responses

/**
 * Recursively serialize data for JSON response
 * Handles Prisma Decimal, BigInt, Date, and other non-JSON types
 */
export function serializeForJSON(data) {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeForJSON(item));
  }

  // Handle Prisma Decimal type (has toNumber method)
  if (data && typeof data === 'object' && 'toNumber' in data && typeof data.toNumber === 'function') {
    return data.toNumber();
  }

  // Handle BigInt
  if (typeof data === 'bigint') {
    return data.toString();
  }

  // Handle Date objects
  if (data instanceof Date) {
    return data.toISOString();
  }

  // Handle plain objects
  if (data && typeof data === 'object' && data.constructor === Object) {
    const serialized = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeForJSON(value);
    }
    return serialized;
  }

  // Return primitives and other types as-is
  return data;
}

/**
 * Alias for serializeForJSON - used in some services
 */
export const serializePrismaData = serializeForJSON;

/**
 * Format chapter numbers for display
 * Handles both numeric and string chapter numbers
 */
export function formatChapterNumber(chapterNumber) {
  if (chapterNumber === null || chapterNumber === undefined) {
    return 'N/A';
  }

  // If it's already a string, return it
  if (typeof chapterNumber === 'string') {
    return chapterNumber;
  }

  // If it's a Prisma Decimal
  if (chapterNumber && typeof chapterNumber === 'object' && 'toNumber' in chapterNumber) {
    const num = chapterNumber.toNumber();
    return formatNumericChapter(num);
  }

  // If it's a number
  if (typeof chapterNumber === 'number') {
    return formatNumericChapter(chapterNumber);
  }

  // Fallback
  return String(chapterNumber);
}

function formatNumericChapter(num) {
  // Handle special cases
  if (num === 0) return 'Prologue';
  if (num === -1) return 'Epilogue';
  
  // Format with one decimal place if not a whole number
  if (num % 1 !== 0) {
    return `Chapter ${num.toFixed(1)}`;
  }
  
  return `Chapter ${num}`;
}

/**
 * Safe serialization for client-side data
 * Strips sensitive fields and ensures JSON compatibility
 */
export function serializeForClient(data, options = {}) {
  const { excludeFields = ['password', 'email', 'phoneNumber'] } = options;
  
  const serialized = serializeForJSON(data);
  
  if (!serialized || typeof serialized !== 'object') {
    return serialized;
  }
  
  // Remove sensitive fields
  const cleaned = { ...serialized };
  excludeFields.forEach(field => {
    delete cleaned[field];
  });
  
  return cleaned;
}

/**
 * Serialize Prisma model with relations
 * Handles nested relations and circular references
 */
export function serializeWithRelations(data, depth = 2) {
  if (depth <= 0 || !data) {
    return serializeForJSON(data);
  }

  if (Array.isArray(data)) {
    return data.map(item => serializeWithRelations(item, depth));
  }

  if (data && typeof data === 'object') {
    const serialized = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Skip Prisma internal fields
      if (key.startsWith('_')) continue;
      
      // Handle relations
      if (value && typeof value === 'object' && !value.constructor.name.includes('Date')) {
        serialized[key] = serializeWithRelations(value, depth - 1);
      } else {
        serialized[key] = serializeForJSON(value);
      }
    }
    
    return serialized;
  }

  return serializeForJSON(data);
}

/**
 * Convert Prisma Decimal to number
 */
export function decimalToNumber(decimal) {
  if (!decimal) return 0;
  if (typeof decimal === 'number') return decimal;
  if (decimal && typeof decimal.toNumber === 'function') return decimal.toNumber();
  return parseFloat(String(decimal));
}

/**
 * Safe JSON stringify for API responses
 */
export function safeStringify(data) {
  return JSON.stringify(serializeForJSON(data));
}

/**
 * Parse and serialize in one step
 */
export function parseAndSerialize(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    return serializeForJSON(parsed);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return null;
  }
}
