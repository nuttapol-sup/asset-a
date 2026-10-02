import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Asset from '@/models/Asset';

export async function POST() {
  try {
    await connectToDatabase();
    const result = await Asset.deleteMany({});
    return NextResponse.json({
      success: true,
      message: `ลบข้อมูลครุภัณฑ์จำลองทั้งหมดเรียบร้อยแล้ว (ลบ ${result.deletedCount} รายการ)`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
