import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST() {
  try {
    await connectToDatabase();

    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'บัญชี admin มีอยู่ในระบบแล้ว',
        username: 'admin',
      });
    }

    const hashedPassword = await hashPassword('admin1234');
    const admin = await User.create({
      username: 'admin',
      password: hashedPassword,
      name: 'ผู้ดูแลระบบ (Admin)',
      role: 'admin',
      department: 'สำนักเทคโนโลยีสารสนเทศ',
    });

    return NextResponse.json({
      success: true,
      message: 'สร้างบัญชีผู้ดูแลระบบ (admin / admin1234) สำเร็จแล้ว!',
      user: {
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
