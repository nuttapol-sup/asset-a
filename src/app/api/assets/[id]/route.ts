import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import Asset from '@/models/Asset';
import { verifyJWT } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const asset = await Asset.findOne({ _id: id, deleteFlag: 0 });
    if (!asset) {
      return NextResponse.json({ success: false, error: 'Asset not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: asset });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (token) {
      const payload = await verifyJWT(token);
      if (payload) {
        body.updatedBy = `${payload.name} (@${payload.username})`;
      }
    }

    const updatedAsset = await Asset.findOneAndUpdate(
      { _id: id, deleteFlag: 0 },
      body,
      { new: true, runValidators: true }
    );

    if (!updatedAsset) {
      return NextResponse.json({ success: false, error: 'Asset not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updatedAsset });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    let deletedBy = 'ระบบ (System)';
    if (token) {
      const payload = await verifyJWT(token);
      if (payload) {
        deletedBy = `${payload.name} (@${payload.username})`;
      }
    }

    // Soft delete: deleteFlag = 1, isDeleted = true
    const deletedAsset = await Asset.findOneAndUpdate(
      { _id: id, deleteFlag: 0 },
      {
        deleteFlag: 1,
        isDeleted: true,
        deletedBy,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!deletedAsset) {
      return NextResponse.json({ success: false, error: 'Asset not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Asset soft deleted successfully', data: deletedAsset });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

