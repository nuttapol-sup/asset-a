import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BorrowRecord from '@/models/BorrowRecord';
import Asset from '@/models/Asset';

export async function GET() {
  try {
    await connectToDatabase();
    const records = await BorrowRecord.find().populate('asset').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { assetId, borrowerName, department, contactNumber, expectedReturnDate, notes } = body;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return NextResponse.json({ success: false, error: 'ไม่พบครุภัณฑ์ที่ระบุ' }, { status: 404 });
    }

    if (asset.status === 'ถูกยืม') {
      return NextResponse.json({ success: false, error: 'ครุภัณฑ์ชิ้นนี้ถูกยืมอยู่แล้ว' }, { status: 400 });
    }

    const borrowRecord = await BorrowRecord.create({
      asset: assetId,
      borrowerName,
      department,
      contactNumber,
      expectedReturnDate: new Date(expectedReturnDate),
      notes,
      status: 'กำลังยืม',
    });

    asset.status = 'ถูกยืม';
    await asset.save();

    return NextResponse.json({ success: true, data: borrowRecord }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
