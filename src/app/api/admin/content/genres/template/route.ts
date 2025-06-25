// src/app/api/admin/content/genres/template/route.ts
import { NextResponse } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { genreService } from '@/services/genreService';

export const GET = createAdminRoute(async (req) => {
  try {
    const buffer = genreService.generateBulkUploadTemplate();
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', 'attachment; filename="genre_upload_template.xlsx"');

    return new NextResponse(buffer, { status: 200, headers });
  } catch (error: any) {
    console.error("Error generating genre template:", error);
    return NextResponse.json({ success: false, error: "Failed to generate template." }, { status: 500 });
  }
});