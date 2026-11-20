import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { signJWT, verifyMfaTempToken } from '@/lib/auth';
import { verifyTotpCode } from '@/lib/mfa';

export async function POST(request: Request) {
  try {
    const { mfaToken, code } = await request.json();

    if (!mfaToken || !code) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกรหัส 6 หลักจาก Google Authenticator' },
        { status: 400 }
      );
    }

    const payload = await verifyMfaTempToken(mfaToken);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { success: false, error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(payload.userId);
    if (!user || !user.mfaSecret) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบบัญชีผู้ใช้ หรือไม่ได้เปิดใช้งาน MFA' },
        { status: 404 }
      );
    }

    const isValid = verifyTotpCode(user.mfaSecret, code);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'รหัสยืนยัน 6 หลักไม่ถูกต้อง หรือหมดเวลา กรุณาลองใหม่อีกครั้ง' },
        { status: 400 }
      );
    }

    const token = await signJWT({
      userId: user._id.toString(),
      username: user.username,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        department: user.department,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 Days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'MFA verification failed' },
      { status: 500 }
    );
  }
}
