import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST() {
  try {
    await connectToDatabase();

    const hashedPassword = await hashPassword('admin1234');

    const admin = await User.findOneAndUpdate(
      { username: 'admin' },
      {
        username: 'admin',
        password: hashedPassword,
        name: 'ผู้ดูแลระบบ (Admin)',
        role: 'admin',
        department: 'สำนักเทคโนโลยีสารสนเทศ',
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'สร้าง/อัปเดตรหัสผ่านบัญชีผู้ดูแลระบบ (Username: admin / Password: admin1234) เรียบร้อยแล้ว!',
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

export async function GET() {
  return POST();
}
