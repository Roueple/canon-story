// src/lib/api/utils.ts
import { NextResponse } from 'next/server'

export function successResponse(data: any, status = 200) {
  return NextResponse.json(
    { success: true, data },
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
  return NextResponse.json({
    success: true,
    data,
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