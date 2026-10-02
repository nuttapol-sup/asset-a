import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Division from '@/models/Division';
import { TMD_ORGANIZATION } from '@/lib/organization';

export async function GET() {
  try {
    await connectToDatabase();

    let divisions = await Division.find({}).sort({ createdAt: 1 });

    // If database has no division records yet, auto-seed from TMD_ORGANIZATION
    if (divisions.length === 0) {
      await Division.insertMany(TMD_ORGANIZATION);
      divisions = await Division.find({}).sort({ createdAt: 1 });
    }

    return NextResponse.json({ success: true, data: divisions });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch divisions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกชื่อกอง / สำนัก / ศูนย์' },
        { status: 400 }
      );
    }

    const existing = await Division.findOne({ name: body.name.trim() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'ชื่อกอง / สำนัก / ศูนย์ นี้มีอยู่ในระบบแล้ว' },
        { status: 400 }
      );
    }

    const newDivision = await Division.create({
      name: body.name.trim(),
      description: body.description?.trim() || '',
      subDivisions: body.subDivisions || ['ฝ่ายบริหารงานทั่วไป'],
    });

    return NextResponse.json({ success: true, data: newDivision }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create division' },
      { status: 500 }
    );
  }
}
