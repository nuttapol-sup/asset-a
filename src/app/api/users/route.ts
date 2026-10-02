import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { verifyJWT, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Access denied: Admin only' }, { status: 403 });
    }

    await connectToDatabase();
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Access denied: Admin only' }, { status: 403 });
    }

    await connectToDatabase();
    const { username, password, name, role, department, agency } = await request.json();

    if (!username || !password || !name) {
      return NextResponse.json({ success: false, error: 'กรุณากรอก Username, Password และชื่อ-นามสกุล' }, { status: 400 });
    }

    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'Username นี้ถูกใช้งานแล้ว' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
      username: username.trim(),
      password: hashedPassword,
      name: name.trim(),
      role: role || 'staff',
      department: department?.trim() || '',
      agency: agency?.trim() || '',
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newUser._id,
          username: newUser.username,
          name: newUser.name,
          role: newUser.role,
          department: newUser.department,
          agency: newUser.agency,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
