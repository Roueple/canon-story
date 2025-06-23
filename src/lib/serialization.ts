// A type guard to check if a value is a plain object.
function isObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Recursively serializes data to make it compatible with Next.js page props.
 * Handles Dates, Prisma's Decimals, and nested objects/arrays.
 * @param data The data to serialize.
 * @returns The serialized data, safe to pass from Server to Client Components.
 */
export function serializePrismaData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Convert Date objects to ISO strings.
  if (data instanceof Date) {
    return data.toISOString() as unknown as T;
  }
  
  // Robustly convert Prisma's Decimal type to a string.
  // This is more reliable than 'instanceof' in some module-bundling scenarios.
  if (typeof data === 'object' && data.constructor.name === 'Decimal') {
    return data.toString() as unknown as T;
  }

  // If it's an array, serialize each item.
  if (Array.isArray(data)) {
    return data.map(serializePrismaData) as unknown as T;
  }

  // If it's a plain object, serialize its properties.
  if (isObject(data)) {
    const serializedObject: Record<string, unknown> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        serializedObject[key] = serializePrismaData(data[key]);
      }
    }
    return serializedObject as T;
  }

  // Return primitive types as-is.
  return data;
}
