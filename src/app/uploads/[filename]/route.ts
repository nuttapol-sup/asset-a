import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    if (!filename) {
      return new NextResponse('Filename is required', { status: 400 });
    }

    // Sanitize filename to prevent directory traversal attacks
    const safeFilename = path.basename(filename);

    // List of candidate paths to search for uploaded files
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'uploads', safeFilename),
      path.join(process.cwd(), 'uploads', safeFilename),
      path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads', safeFilename),
    ];

    let filePath: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
        filePath = p;
        break;
      }
    }

    if (!filePath) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(/*turbopackIgnore: true*/ filePath);

    // Determine MIME content-type based on file extension
    const ext = path.extname(safeFilename).toLowerCase();
    let contentType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.svg') contentType = 'image/svg+xml';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    return new NextResponse('Error reading image file', { status: 500 });
  }
}
