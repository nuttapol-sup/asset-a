import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเลือกไฟล์รูปภาพ' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'ไฟล์ที่อัปโหลดต้องเป็นรูปภาพเท่านั้น (JPG, PNG, WEBP)' },
        { status: 400 }
      );
    }

    // 10MB Limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'ขนาดไฟล์ต้องไม่เกิน 10 MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory in public folder and root folder for safety
    const publicUploadDir = path.join(process.cwd(), 'public', 'uploads');
    const rootUploadDir = path.join(process.cwd(), 'uploads');
    
    await mkdir(publicUploadDir, { recursive: true });
    await mkdir(rootUploadDir, { recursive: true });

    // Generate clean unique filename
    const ext = path.extname(file.name) || '.png';
    const nameWithoutExt = path.basename(file.name, ext);
    const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_') || 'img';
    const filename = `asset_${Date.now()}_${safeName.slice(0, 20)}${ext}`;

    const filePathPublic = path.join(publicUploadDir, filename);
    const filePathRoot = path.join(rootUploadDir, filename);

    // Save to both locations to ensure availability regardless of Next.js setup
    await writeFile(filePathPublic, buffer);
    await writeFile(filePathRoot, buffer);

    const publicUrl = `/uploads/${filename}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
