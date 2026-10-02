import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Asset from '@/models/Asset';

const sampleAssets = [
  {
    assetCode: 'สส. 1000000009290',
    secondaryAssetCode: 'อต.7440-001-004-1681',
    name: 'เครื่องคอมพิวเตอร์ประมวลผลสูง (MacBook Pro M3 Max)',
    category: 'คอมพิวเตอร์และไอที',
    brand: 'Apple',
    model: 'MacBook Pro 16"',
    serialNumber: 'C02G1234MD6R',
    price: 114900,
    purchaseDate: new Date('2026-01-15'),
    location: 'ห้องฝ่ายเทคโนโลยีสารสนเทศ (Room 401)',
    custodian: 'นายสมชาย สายเทค',
    division: 'กองบริการดิจิทัลอุตุนิยมวิทยา',
    subDivision: 'ศูนย์เทคโนโลยีสารสนเทศ',
    status: 'ปกติ',
    description: 'เครื่องโน้ตบุ๊กสำหรับพัฒนาระบบและงานประมวลผลหนัก',
  },
  {
    assetCode: 'สส. 1000000009291',
    secondaryAssetCode: 'อต.7440-001-004-1682',
    name: 'เครื่องฉายโปรเจกเตอร์ 4K (Laser Projector)',
    category: 'โสตทัศนูปกรณ์',
    brand: 'Epson',
    model: 'EB-L730U',
    serialNumber: 'EP-99887766',
    price: 68500,
    purchaseDate: new Date('2025-11-20'),
    location: 'ห้องประชุมใหญ่ A (Room 201)',
    custodian: 'นางสาววิไล บริหารงาน',
    division: 'สำนักงานเลขานุการกรม',
    subDivision: 'กลุ่มบริหารงานทั่วไป',
    status: 'ปกติ',
    description: 'โปรเจกเตอร์เลเซอร์ติดตั้งเพดานห้องประชุมใหญ่',
  },
  {
    assetCode: 'สส. 1000000009292',
    secondaryAssetCode: 'อต.7440-002-001-0850',
    name: 'เครื่องพิมพ์มัลติฟังก์ชันเลเซอร์สี (Multifunction Printer)',
    category: 'ครุภัณฑ์สำนักงาน',
    brand: 'Fuji Film',
    model: 'ApeosPrint C325dw',
    serialNumber: 'FF-44556677',
    price: 24900,
    purchaseDate: new Date('2025-08-10'),
    location: 'แผนกบัญชีและการเงิน (Room 302)',
    custodian: 'นางวรรณา บัญชีดี',
    division: 'สำนักงานเลขานุการกรม',
    subDivision: 'กลุ่มการเงินและบัญชี',
    status: 'รอซ่อม',
    description: 'ตลับหมึกและชุดดรัมติดขัด รอช่างศูนย์เข้าเปลี่ยนอะไหล่',
  },
  {
    assetCode: 'สส. 1000000009293',
    secondaryAssetCode: 'อต.7110-003-002-0112',
    name: 'เก้าอี้ทำงานเพื่อสุขภาพ (Ergonomic Chair)',
    category: 'ครุภัณฑ์สำนักงาน',
    brand: 'Herman Miller',
    model: 'Aeron Chair',
    serialNumber: 'HM-112233',
    price: 49500,
    purchaseDate: new Date('2026-02-01'),
    location: 'ห้องผู้บริหาร (Room 501)',
    custodian: 'นายเกียรติศักดิ์ ผู้อำนวยการ',
    division: 'สำนักงานเลขานุการกรม',
    subDivision: 'กลุ่มช่วยอำนวยการนักบริหาร',
    status: 'ปกติ',
    description: 'เก้าอี้ปรับระดับสำหรับห้องผู้บริหาร',
  },
  {
    assetCode: 'สส. 1000000009294',
    secondaryAssetCode: 'อต.7440-001-008-0099',
    name: 'เครื่องสำรองไฟขนาดใหญ่ (UPS 10kVA)',
    category: 'คอมพิวเตอร์และไอที',
    brand: 'APC',
    model: 'Smart-UPS RT 10000VA',
    serialNumber: 'APC-88990011',
    price: 185000,
    purchaseDate: new Date('2024-05-12'),
    location: 'ห้อง Data Center (Room 101)',
    custodian: 'นายสมชาย สายเทค',
    division: 'กองสื่อสาร',
    subDivision: 'ส่วนไฟฟ้าและคอมพิวเตอร์',
    status: 'ปกติ',
    description: 'ระบบสำรองไฟฟ้าสำหรับตู้ Server หลัก',
  },
  {
    assetCode: 'สส. 1000000009295',
    secondaryAssetCode: 'อต.7730-004-001-0055',
    name: 'กล้องถ่ายภาพมัลติมีเดีย (Mirrorless Camera)',
    category: 'โสตทัศนูปกรณ์',
    brand: 'Sony',
    model: 'A7 IV + 24-70mm Lens',
    serialNumber: 'SN-33445566',
    price: 92000,
    purchaseDate: new Date('2025-09-30'),
    location: 'ห้องสตูดิโอประชาสัมพันธ์ (Room 105)',
    custodian: 'นายประชา สื่อสาร',
    division: 'สำนักงานเลขานุการกรม',
    subDivision: 'กลุ่มประชาสัมพันธ์',
    status: 'ถูกยืม',
    description: 'กล้องสำหรับถ่ายวิดีโอและภาพกิจกรรมองค์กร',
  },
];

export async function POST() {
  try {
    await connectToDatabase();
    await Asset.deleteMany({});
    const assetsWithAudit = sampleAssets.map((item) => ({
      ...item,
      deleteFlag: 0,
      isDeleted: false,
      createdBy: 'ระบบ (System Seed)',
    }));
    const created = await Asset.insertMany(assetsWithAudit);
    return NextResponse.json({ success: true, count: created.length, data: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
