// src/lib/serialization.ts

// This is a robust, foolproof serializer. It uses a JSON replacer to handle
// special data types that are not native to JSON, like BigInt.
// It guarantees that the output is a plain JavaScript object/array.
export function serializeForJSON(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  const jsonString = JSON.stringify(data, (key, value) => {
    // Convert BigInt to a string. JSON.stringify() cannot handle BigInt by default.
    if (typeof value === 'bigint') {
      return value.toString();
    }
    
    // Prisma's Decimal type is an object. We convert it to a number.
    if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
      return Number(value);
    }

    return value;
  });

  return JSON.parse(jsonString);
}
