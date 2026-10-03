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
      const escapeRegex = (str: string) => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      if (userDepartment) {
        query.subDivision = { $regex: `^${escapeRegex(userDepartment)}$`, $options: 'i' };
      }
      if (userAgency) {
        query.division = { $regex: `^${escapeRegex(userAgency)}$`, $options: 'i' };
      }
    }

    const assets = await Asset.find(query);
    const totalAssets = assets.length;

    let totalValue = 0;
    let totalNetBookValue = 0;
    let totalAccumulatedDepreciation = 0;

    assets.forEach((asset) => {
      const dep = calculateStraightLineDepreciation(
        asset.price,
        asset.salvageValue ?? 1,
        asset.usefulLifeYears ?? 5,
        asset.purchaseDate
      );
      totalValue += asset.price;
      totalNetBookValue += dep.netBookValue;
      totalAccumulatedDepreciation += dep.accumulatedDepreciation;
    });

    const normalCount = assets.filter((a) => a.status === 'ปกติ').length;
    const borrowedCount = assets.filter((a) => a.status === 'ถูกยืม').length;
    const pendingRepairCount = assets.filter((a) => a.status === 'รอซ่อม').length;
    const damagedCount = assets.filter((a) => a.status === 'ชำรุด').length;
    const disposedCount = assets.filter((a) => a.status === 'แทงจำหน่าย').length;

    const categoryStats = await Asset.aggregate([
      { $match: query },
      { $group: { _id: '$category', count: { $sum: 1 }, totalValue: { $sum: '$price' } } },
      { $sort: { count: -1 } },
    ]);

    const activeBorrows = await BorrowRecord.countDocuments({ status: 'กำลังยืม' });

    return NextResponse.json({
      success: true,
      data: {
        totalAssets,
        totalValue: Math.round(totalValue),
        totalNetBookValue: Math.round(totalNetBookValue),
        totalAccumulatedDepreciation: Math.round(totalAccumulatedDepreciation),
        statusCounts: {
          normal: normalCount,
          borrowed: borrowedCount,
          pendingRepair: pendingRepairCount,
          damaged: damagedCount,
          disposed: disposedCount,
        },
        activeBorrows,
        categoryStats,
        scope: {
          role: userRole,
          agency: userAgency,
          department: userDepartment,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
