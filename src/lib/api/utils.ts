// src/lib/api/utils.ts
import { NextResponse } from 'next/server'

// Helper to convert BigInt to string in nested objects
const convertBigIntToString = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }
  if (typeof obj === 'object') {
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = convertBigIntToString(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

export function successResponse(data: any, status = 200) {
  const jsonData = convertBigIntToString(data);
  return NextResponse.json(
    { success: true, data: jsonData },
    { status }
  )
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  )
}

export function paginatedResponse(
  data: any[],
  page: number,
  limit: number,
  total: number
) {
  const jsonData = convertBigIntToString(data);
  return NextResponse.json({
    success: true,
    data: jsonData,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  })
}

export async function handleApiError(error: any) {
  console.error('API Error:', error)

  if (error.code === 'P2002') {
    return errorResponse('A record with this value already exists', 409)
  }

  if (error.code === 'P2025') {
    return errorResponse('Record not found', 404)
  }

  return errorResponse(
    error.message || 'An unexpected error occurred',
    500
  )
}

export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
  const skip = (page - 1) * limit

  return { page, limit, skip }
}