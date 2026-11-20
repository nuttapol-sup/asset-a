import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { verifyJWT, signJWT } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();
    const dbUser = await User.findById(payload.userId, '-password');

    // Rolling session: refresh token on active use for another 60 minutes
    const refreshedToken = await signJWT({
      userId: payload.userId as string,
      username: (payload.username || dbUser?.username) as string,
      name: (dbUser?.name || payload.name) as string,
      role: (dbUser?.role || payload.role) as string,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        userId: payload.userId,
        username: payload.username,
        name: dbUser?.name || payload.name,
        role: dbUser?.role || payload.role,
        agency: dbUser?.agency || '',
        department: dbUser?.department || '',
        mfaEnabled: !!dbUser?.mfaEnabled,
      },
    });

    response.cookies.set('auth_token', refreshedToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 60 Minutes rolling session
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
