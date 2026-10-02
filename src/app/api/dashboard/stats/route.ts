import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Asset from '@/models/Asset';
import BorrowRecord from '@/models/BorrowRecord';
import { calculateStraightLineDepreciation } from '@/lib/depreciation';

export async function GET() {
  try {
    await connectToDatabase();

    const assets = await Asset.find({ deleteFlag: 0 });
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
      { $match: { deleteFlag: 0 } },
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
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
