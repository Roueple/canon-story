import { NextRequest } from 'next/server'; // Keep NextRequest for consistency
import { createAdminRoute } from '@/lib/api/middleware';
import { documentImportService } from '@/services/documentImportService';
import { NextResponse } from 'next/server';

export const GET = createAdminRoute(async (req) => { // req is available if needed later
  try {
    const buffer = documentImportService.generateBulkUploadTemplate();
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', 'attachment; filename="bulk_chapter_upload_template.xlsx"');

    return new NextResponse(buffer, { status: 200, headers });
  } catch (error: any) {
    console.error("Error generating template:", error);
    return NextResponse.json({ success: false, error: "Failed to generate template." }, { status: 500 });
  }
});