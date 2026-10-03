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

    // Create uploads directories in public folder and root folder for disk backup
    const publicUploadDir = path.join(process.cwd(), 'public', 'uploads');
    const rootUploadDir = path.join(process.cwd(), 'uploads');
    
    await mkdir(publicUploadDir, { recursive: true });
    await mkdir(rootUploadDir, { recursive: true });

    // Generate clean unique filename
    const ext = path.extname(file.name) || '.jpg';
    const nameWithoutExt = path.basename(file.name, ext);
    const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_') || 'img';
    const filename = `asset_${Date.now()}_${safeName.slice(0, 20)}${ext}`;

    const filePathPublic = path.join(publicUploadDir, filename);
    const filePathRoot = path.join(rootUploadDir, filename);

    // Save to both locations
    await writeFile(filePathPublic, buffer);
    await writeFile(filePathRoot, buffer);

    const publicUrl = `/uploads/${filename}`;
    const mimeType = file.type || 'image/jpeg';
    const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;

    // Return Base64 Data URI as main url for 100% fail-proof rendering across all devices & restarts
    return NextResponse.json({ 
      success: true, 
      url: base64Data,
      fileUrl: publicUrl,
      base64: base64Data 
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
