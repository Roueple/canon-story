import { NextResponse } from 'next/server';
import { mediaService } from '@/services/mediaService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const novelId = searchParams.get('novelId');

    if (!novelId) {
      return NextResponse.json({ success: false, error: 'novelId is required' }, { status: 400 });
    }

    const categories = await mediaService.findUniqueCategoriesByNovel(novelId);
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    console.error('API Error fetching media categories:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}