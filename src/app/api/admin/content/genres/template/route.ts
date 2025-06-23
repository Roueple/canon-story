// src/app/api/admin/content/genres/template/route.ts
import { NextResponse } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import * as XLSX from 'xlsx';

export const GET = createAdminRoute(async (req) => {
  try {
    const headers = [
      "name",
      "description",
      "color"
    ];
    const exampleData = [
      { name: "Fantasy", description: "Magic, mythical creatures, and otherworldly adventures.", color: "#8B5CF6" },
      { name: "Science Fiction", description: "Future technology and space exploration.", color: "#3B82F6" },
      { name: "Romance", description: "Love stories and emotional connections.", color: "#EC4899" },
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(exampleData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Genres");

    // Adjust column widths for better readability
    worksheet['!cols'] = [{ wch: 25 }, { wch: 60 }, { wch: 15 }];

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="genre_upload_template.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error) {
    console.error("Error generating genre template:", error);
    return NextResponse.json({ success: false, error: "Failed to generate template." }, { status: 500 });
  }
});