import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import Asset from '@/models/Asset';
import BorrowRecord from '@/models/BorrowRecord';
import User from '@/models/User';
import { verifyJWT } from '@/lib/auth';
import { calculateStraightLineDepreciation } from '@/lib/depreciation';

export async function GET() {
  try {
    await connectToDatabase();

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

    const query: any = { deleteFlag: 0 };

    if (userRole !== 'admin') {
      const conditions: any[] = [];
      if (userDepartment) {
        conditions.push({ subDivision: { $regex: `^${userDepartment}$`, $options: 'i' } });
      }
      if (userAgency) {
        conditions.push({ division: { $regex: `^${userAgency}$`, $options: 'i' } });
      }

      if (conditions.length > 0) {
        query.$and = [{ $or: conditions }];
      }
    }

    // 1. Fetch scoped active assets
    const assets = await Asset.find(query).sort({ createdAt: -1 });

    let totalPurchasePrice = 0;
    let totalNetBookValue = 0;
    let totalAccumulatedDepreciation = 0;

    const assetReportList = assets.map((asset) => {
      const dep = calculateStraightLineDepreciation(
        asset.price,
        asset.salvageValue ?? 1,
        asset.usefulLifeYears ?? 5,
        asset.purchaseDate
      );

      totalPurchasePrice += asset.price;
      totalNetBookValue += dep.netBookValue;
      totalAccumulatedDepreciation += dep.accumulatedDepreciation;

      return {
        _id: asset._id.toString(),
        assetCode: asset.assetCode,
        secondaryAssetCode: asset.secondaryAssetCode || '-',
        name: asset.name,
        category: asset.category,
        brand: asset.brand || '-',
        model: asset.model || '-',
        location: asset.location,
        custodian: asset.custodian,
        division: asset.division || '-',
        subDivision: asset.subDivision || '-',
        status: asset.status,
        purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '-',
        price: asset.price,
        usefulLifeYears: asset.usefulLifeYears ?? 5,
        salvageValue: asset.salvageValue ?? 1,
        annualDepreciation: dep.annualDepreciation,
        accumulatedDepreciation: dep.accumulatedDepreciation,
        netBookValue: dep.netBookValue,
        createdBy: asset.createdBy || '-',
      };
    });

    // 2. Category Breakdown
    const categoryAgg = await Asset.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalPrice: { $sum: '$price' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // 3. Status Breakdown
    const statusCounts = {
      normal: assets.filter((a) => a.status === 'ปกติ').length,
      borrowed: assets.filter((a) => a.status === 'ถูกยืม').length,
      pendingRepair: assets.filter((a) => a.status === 'รอซ่อม').length,
      damaged: assets.filter((a) => a.status === 'ชำรุด').length,
      disposed: assets.filter((a) => a.status === 'แทงจำหน่าย').length,
    };

    // 4. Borrow Records Report
    const borrowRecords = await BorrowRecord.find({}).sort({ borrowDate: -1 }).limit(100);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalAssets: assets.length,
          totalPurchasePrice: Math.round(totalPurchasePrice),
          totalAccumulatedDepreciation: Math.round(totalAccumulatedDepreciation),
          totalNetBookValue: Math.round(totalNetBookValue),
        },
        statusCounts,
        categorySummary: categoryAgg,
        assets: assetReportList,
        borrows: borrowRecords,
        scope: {
          role: userRole,
          agency: userAgency,
          department: userDepartment,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
