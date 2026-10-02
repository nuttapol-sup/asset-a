import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import Asset from '@/models/Asset';
import User from '@/models/User';
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

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    let userRole = 'staff';
    let userAgency = '';
    let userDepartment = '';

    if (token) {
      const payload = await verifyJWT(token);
      if (payload) {
        userRole = (payload.role as string) || 'staff';
        const dbUser = await User.findById(payload.userId);
        if (dbUser) {
          userAgency = dbUser.agency?.trim() || '';
          userDepartment = dbUser.department?.trim() || '';
        }
      }
    }

    // Base query excluding deleted assets
    const query: any = { deleteFlag: 0 };

    // Enforce Staff Department / Division Scoping if not Admin
    if (userRole !== 'admin') {
      const conditions: any[] = [];
      if (userDepartment) {
        conditions.push({ subDivision: { $regex: `^${userDepartment}$`, $options: 'i' } });
      }
      if (userAgency) {
        conditions.push({ division: { $regex: `^${userAgency}$`, $options: 'i' } });
      }

      if (conditions.length > 0) {
        query.$and = query.$and || [];
        query.$and.push({ $or: conditions });
      }
    } else {
      // Admin filter parameters
      if (division) {
        query.division = division;
      }
      if (subDivision) {
        query.subDivision = subDivision;
      }
    }

    if (search) {
      const searchConditions = [
        { name: { $regex: search, $options: 'i' } },
        { assetCode: { $regex: search, $options: 'i' } },
        { secondaryAssetCode: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { custodian: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { division: { $regex: search, $options: 'i' } },
        { subDivision: { $regex: search, $options: 'i' } },
      ];
      query.$and = query.$and || [];
      query.$and.push({ $or: searchConditions });
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    const assets = await Asset.find(query).sort({ createdAt: -1 });
    return NextResponse.json({
      success: true,
      data: assets,
      scope: {
        role: userRole,
        agency: userAgency,
        department: userDepartment,
      },
    });
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
