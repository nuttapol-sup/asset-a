import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BorrowRecord from '@/models/BorrowRecord';
import Asset from '@/models/Asset';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const record = await BorrowRecord.findById(id);
    if (!record) {
      return NextResponse.json({ success: false, error: 'ไม่พบรายการยืม' }, { status: 404 });
    }

    record.actualReturnDate = new Date();
    record.status = 'คืนแล้ว';
    await record.save();

    if (record.asset) {
      await Asset.findByIdAndUpdate(record.asset, { status: 'ปกติ' });
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
