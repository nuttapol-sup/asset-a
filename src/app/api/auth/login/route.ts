import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { verifyPassword, hashPassword, signJWT } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'กรุณากรอก Username และ Password' }, { status: 400 });
    }

    let user = await User.findOne({ username: username.trim() });

    // Auto-create admin account on first login attempt if missing
    if (!user && username.trim() === 'admin') {
      const hashedPassword = await hashPassword('admin1234');
      user = await User.create({
        username: 'admin',
        password: hashedPassword,
        name: 'ผู้ดูแลระบบ (Admin)',
        role: 'admin',
        department: 'สำนักเทคโนโลยีสารสนเทศ',
      });
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'Username หรือ Password ไม่ถูกต้อง' }, { status: 401 });
    }

    let isMatch = await verifyPassword(password, user.password);

    // If admin password mismatch, automatically update admin password to admin1234 when admin1234 or admin123 is used
    if (!isMatch && username.trim() === 'admin' && (password === 'admin1234' || password === 'admin123')) {
      const hashedPassword = await hashPassword('admin1234');
      user.password = hashedPassword;
      await user.save();
      isMatch = true;
    }

    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Username หรือ Password ไม่ถูกต้อง' }, { status: 401 });
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Login failed' }, { status: 500 });
  }
}
