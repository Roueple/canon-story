// src/lib/api/utils.ts
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

// Comprehensive serializer for all Prisma types
export function serializeForJSON(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  // Handle BigInt
  if (typeof obj === 'bigint') return obj.toString();
  
  // Handle Date
  if (obj instanceof Date) return obj.toISOString();
  
  // Handle Prisma Decimal (has toNumber method)
  if (obj && typeof obj === 'object' && 'toNumber' in obj && typeof obj.toNumber === 'function') {
    return obj.toNumber();
  }
  
  // Handle Prisma Decimal alternative structure {s, e, d}
  if (obj && typeof obj === 'object' && 's' in obj && 'e' in obj && 'd' in obj) {
    // This is a Decimal.js object, convert to number
    return parseFloat(obj.toString());
  }
  
  // Handle Buffer/Bytes
  if (obj instanceof Buffer) return obj.toString('base64');
  
  // Handle Arrays
  if (Array.isArray(obj)) return obj.map(serializeForJSON);
  
  // Handle regular objects
  if (typeof obj === 'object' && obj.constructor === Object) {
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeForJSON(value);
    }
    return serialized;
  }
  
  // Return primitives as-is
  return obj;
}

// Deprecated: Use serializeForJSON instead
export const serializeBigInt = serializeForJSON;

export function successResponse(data: any, status = 200) {
  return NextResponse.json({
    success: true,
    data: serializeForJSON(data)
  }, { status })
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({
    success: false,
    error: message
  }, { status })
}

export function paginatedResponse(
  data: any[],
  page: number,
  limit: number,
  total: number
) {
  const totalPages = Math.ceil(total / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return NextResponse.json({
    success: true,
    data: serializeForJSON(data),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage
    }
  })
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return errorResponse('A record with this data already exists', 409)
    }
    if (error.code === 'P2025') {
      return errorResponse('Record not found', 404)
    }
    return errorResponse(`Database error: ${error.message}`, 400)
  }

  if (error instanceof Error) {
    return errorResponse(error.message, 500)
  }

  return errorResponse('An unexpected error occurred', 500)
}

export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))

  return { page, limit }
}

export function getSkipTake(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    take: limit
  }
}