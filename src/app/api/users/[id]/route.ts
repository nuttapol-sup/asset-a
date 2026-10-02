import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { verifyJWT } from '@/lib/auth';

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
