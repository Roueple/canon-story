// src/lib/serialization.ts
import { Prisma } from '@prisma/client';

// Type guard for Prisma.Decimal (or any Decimal.js like object)
function isDecimal(value: any): value is Prisma.Decimal {
  // Check if it's an object, not null, and has a toFixed method (characteristic of Decimal)
  // Also check constructor name if available, as Prisma.Decimal instances have it.
  return value !== null && typeof value === 'object' && typeof value.toFixed === 'function' && value.constructor?.name === 'Decimal';
}

export function serializePrismaData<T>(data: T): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'bigint') {
    return data.toString(); // Convert BigInt to string
  }

  if (isDecimal(data)) {
    return Number(data); // Convert Prisma.Decimal to number
  }

  if (data instanceof Date) {
    return data.toISOString(); // Ensure dates are ISO strings for consistency
  }

  if (Array.isArray(data)) {
    return data.map(item => serializePrismaData(item));
  }

  if (typeof data === 'object') {
    const result: { [key: string]: any } = {};
    for (const key in data) {
      // Check if the property belongs to the object itself, not its prototype
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = serializePrismaData((data as any)[key]);
      }
    }
    return result;
  }

  return data;
}