import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Category from '@/models/Category';

const defaultCategories = [
  { name: 'คอมพิวเตอร์และไอที', description: 'คอมพิวเตอร์ โน้ตบุ๊ก เซิร์ฟเวอร์ อุปกรณ์ต่อพ่วง' },
  { name: 'ครุภัณฑ์สำนักงาน', description: 'โต๊ะ เก้าอี้ ตู้เอกสาร เครื่องพิมพ์' },
  { name: 'โสตทัศนูปกรณ์', description: 'โปรเจกเตอร์ เครื่องเสียง กล้อง ทีวี' },
  { name: 'เครื่องใช้ไฟฟ้า', description: 'เครื่องปรับอากาศ พัดลม ตู้เย็น' },
  { name: 'ยานพาหนะ', description: 'รถยนต์ รถจักรยานยนต์' },
  { name: 'ครุภัณฑ์การแพทย์', description: 'เครื่องมือและอุปกรณ์ทางการแพทย์' },
  { name: 'อื่นๆ', description: 'ครุภัณฑ์ประเภทอื่นๆ' },
];

export async function GET() {
  try {
    await connectToDatabase();
    let categories = await Category.find().sort({ name: 1 });

    if (categories.length === 0) {
      categories = await Category.insertMany(defaultCategories);
    }

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุชื่อหมวดหมู่' }, { status: 400 });
    }

    const existing = await Category.findOne({ name });
    if (existing) {
      return NextResponse.json({ success: false, error: 'มีหมวดหมู่นี้ในระบบแล้ว' }, { status: 400 });
    }

    const newCategory = await Category.create({ name, description });
    return NextResponse.json({ success: true, data: newCategory }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
