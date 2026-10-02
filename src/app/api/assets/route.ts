import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import Asset from '@/models/Asset';
import { verifyJWT } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';

    const division = searchParams.get('division') || '';
    const subDivision = searchParams.get('subDivision') || '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { deleteFlag: 0 };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { assetCode: { $regex: search, $options: 'i' } },
        { secondaryAssetCode: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { custodian: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { division: { $regex: search, $options: 'i' } },
        { subDivision: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (division) {
      query.division = division;
    }

    if (subDivision) {
      query.subDivision = subDivision;
    }

    const assets = await Asset.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: assets });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    let createdBy = 'ระบบ (System)';
    if (token) {
      const payload = await verifyJWT(token);
      if (payload) {
        createdBy = `${payload.name} (@${payload.username})`;
      }
    }

    if (!body.assetCode) {
      const count = await Asset.countDocuments();
      const year = new Date().getFullYear();
      body.assetCode = `AST-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    body.createdBy = createdBy;
    body.deleteFlag = 0;
    body.isDeleted = false;

    const newAsset = await Asset.create(body);
    return NextResponse.json({ success: true, data: newAsset }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create asset' },
      { status: 500 }
    );
  }
}
