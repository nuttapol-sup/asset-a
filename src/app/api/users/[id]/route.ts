import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { verifyJWT, hashPassword } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    await connectToDatabase();

    // Reset password action
    if (body.action === 'reset-password') {
      const passwordToSet = body.newPassword || 'tmd1234';
      const hashedPassword = await hashPassword(passwordToSet);
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { password: hashedPassword },
        { new: true }
      );
      if (!updatedUser) {
        return NextResponse.json({ success: false, error: 'ไม่พบผู้ใช้งาน' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: `รีเซ็ตรหัสผ่านสำหรับ @${updatedUser.username} เป็น "${passwordToSet}" เรียบร้อยแล้ว`,
      });
    }

    // General user update
    const updateData: any = {};
    if (body.username) updateData.username = body.username.trim();
    if (body.name) updateData.name = body.name.trim();
    if (body.role) updateData.role = body.role;
    if (body.department !== undefined) updateData.department = body.department.trim();
    if (body.agency !== undefined) updateData.agency = body.agency.trim();
    if (body.password && body.password.trim() !== '') {
      updateData.password = await hashPassword(body.password);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'ไม่พบผู้ใช้งาน' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ success: false, error: 'Username นี้ถูกใช้งานแล้ว' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (payload.userId === id) {
      return NextResponse.json({ success: false, error: 'ไม่สามารถลบบัญชีของตนเองได้' }, { status: 400 });
    }

    await connectToDatabase();
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'ไม่พบผู้ใช้งาน' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'ลบผู้ใช้งานสำเร็จ' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
