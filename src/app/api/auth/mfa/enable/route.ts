import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { verifyJWT } from '@/lib/auth';
import { verifyTotpCode } from '@/lib/mfa';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { secret, code } = await request.json();
    if (!secret || !code) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกรหัส 6 หลักจาก Google Authenticator' },
        { status: 400 }
      );
    }

    const isValid = verifyTotpCode(secret, code);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'รหัสยืนยัน 6 หลักไม่ถูกต้อง กรุณาตรวจสอบเวลาในโทรศัพท์ หรือลองสแกน QR Code ใหม่อีกครั้ง' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'ไม่พบผู้ใช้งาน' }, { status: 404 });
    }

    user.mfaEnabled = true;
    user.mfaSecret = secret;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'เปิดใช้งานการยืนยันตัวตน 2 ขั้นตอน (Google Authenticator) เรียบร้อยแล้ว',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to enable MFA' },
      { status: 500 }
    );
  }
}
