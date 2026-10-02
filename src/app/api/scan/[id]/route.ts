import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Asset from '@/models/Asset';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const asset = await Asset.findById(id);
    if (!asset || asset.deleteFlag === 1 || asset.isDeleted) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลครุภัณฑ์ หรือครุภัณฑ์นี้ถูกลบแล้ว' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: asset._id,
        assetCode: asset.assetCode,
        secondaryAssetCode: asset.secondaryAssetCode || '',
        name: asset.name,
        category: asset.category,
        brand: asset.brand || '-',
        model: asset.model || '-',
        serialNumber: asset.serialNumber || '-',
        price: asset.price || 0,
        purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
        location: asset.location || '-',
        custodian: asset.custodian || '-',
        division: asset.division || '-',
        subDivision: asset.subDivision || '-',
        status: asset.status || 'ปกติ',
        description: asset.description || '',
        imageUrl: asset.imageUrl || '',
        createdAt: asset.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch asset info' },
      { status: 500 }
    );
  }
}
