const xlsx = require('xlsx');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/asset_db';
const EXCEL_PATH = 'C:/Users/tmdnu/.gemini/antigravity/brain/429905d3-7903-44ee-88f6-16157fa385b5/.user_uploaded/media_1792473401896_fe71f7bb.xlsx';

function cleanCategory(raw, itemName) {
  if (!raw || String(raw).trim() === '') {
    if (itemName && (itemName.includes('จอ') || itemName.includes('คอมพิวเตอร์') || itemName.includes('PC'))) {
      return 'ครุภัณฑ์คอมพิวเตอร์';
    }
    return 'อื่นๆ';
  }
  let s = String(raw).trim();
  // ตัดรหัสตัวเลขด้านหน้า เช่น 12061000
  s = s.replace(/^\d+\s*/, '');
  // แก้คำสะกด คุรภัณฑ์ -> ครุภัณฑ์
  s = s.replace(/^คุรภัณฑ์/, 'ครุภัณฑ์');
  if (s === 'ครุภัณฑ์สนง.') s = 'ครุภัณฑ์สำนักงาน';
  if (s === 'สินทรัพย์-software') s = 'สินทรัพย์ซอฟต์แวร์ (Software)';
  return s;
}

function mapStatus(raw) {
  if (!raw) return 'ปกติ';
  const clean = String(raw).trim();
  if (clean.includes('จำหน่าย')) return 'แทงจำหน่าย';
  if (clean.includes('ชำรุด') || clean.includes('ชำรุุด') || clean.includes('ชำรด')) return 'ชำรุด';
  if (clean.includes('ซ่อม')) return 'รอซ่อม';
  if (clean.includes('เสื่อม') || clean.includes('เสื่ื่อม')) return 'ชำรุด';
  if (clean.includes('ยืม')) return 'ถูกยืม';
  if (clean.includes('ใช้งานได้') || clean.includes('ปกติ') || clean.includes('ทำงานได้')) return 'ปกติ';
  return 'ปกติ';
}

function parseDate(raw) {
  if (!raw) return null;
  if (typeof raw === 'number') {
    const d = new Date((raw - (25567 + 2)) * 86400 * 1000);
    return isNaN(d.getTime()) ? null : d;
  }
  const str = String(raw).trim();
  const match = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (match) {
    let day = parseInt(match[1], 10);
    let month = parseInt(match[2], 10) - 1;
    let year = parseInt(match[3], 10);
    if (year > 2400) year -= 543;
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function extractBrand(name) {
  if (!name) return '';
  const brandRegex = /(Apple|Dell|HP|Epson|Acer|Cisco|Sony|Brother|Canon|Asus|Lenovo|Samsung|Toshiba|Panasonic|Fuji Film|Herman Miller|APC|Yamaha|Shure|Soyal|3Com|Fortinet|D-Link|Zyxel|Emc|Carrier|Trane|Eminent|Saijo Denki|Hatari|Philips|Oki|Logica)/i;
  const match = name.match(brandRegex);
  return match ? match[0] : '';
}

function extractSerial(name) {
  if (!name) return '';
  const snMatch = name.match(/s\/n\s*[:\s]\s*([A-Za-z0-9\-]+)/i);
  return snMatch ? snMatch[1] : '';
}

function mapSubDivision(raw) {
  if (!raw) return 'ส่วนไฟฟ้าและคอมพิวเตอร์';
  const clean = raw.trim();
  if (clean === 'ส่วนช่างเทคนิคกระจายข่าวอากาศเพื่อการบินและเรือเดิน') {
    return 'ส่วนช่างเทคนิคกระจายข่าวอากาศเพื่อการบินและเรือเดินทางทะเล';
  }
  return clean;
}

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  const db = mongoose.connection.db;
  const categoriesCollection = db.collection('categories');
  const assetsCollection = db.collection('assets');

  // อ่านไฟล์ Excel
  console.log('Reading Excel file...');
  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheet = workbook.Sheets['Sheet1'];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`Read ${rows.length - 1} rows from Excel.`);

  // 1. รวบรวมหมวดหมู่ทั้งหมดจากไฟล์ Excel และเพิ่มลงใน Collection categories
  const newCategoriesSet = new Set();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;
    const catName = cleanCategory(r[3], r[5]);
    newCategoriesSet.add(catName);
  }

  console.log('Categories found in file:', Array.from(newCategoriesSet));

  const existingCategories = await categoriesCollection.find().toArray();
  const existingCatNames = new Set(existingCategories.map((c) => c.name));

  const catDocsToInsert = [];
  for (const catName of newCategoriesSet) {
    if (!existingCatNames.has(catName)) {
      catDocsToInsert.push({
        name: catName,
        description: `หมวดหมู่${catName} (จากระบบสินทรัพย์)`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      existingCatNames.add(catName);
    }
  }

  if (catDocsToInsert.length > 0) {
    await categoriesCollection.insertMany(catDocsToInsert);
    console.log(`Added ${catDocsToInsert.length} new categories to categories collection.`);
  } else {
    console.log('No new categories needed to insert.');
  }

  // 2. นำเข้าครุภัณฑ์ทั้งหมด
  const codeMap = new Map();
  const docsToInsert = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;

    const col0_gfNo = r[0] != null ? String(r[0]).trim() : '';
    const col1_subNo = r[1] != null ? String(r[1]).trim() : '';
    const col2_assetCode = r[2] != null ? String(r[2]).trim() : '';
    const col3_category = r[3] != null ? String(r[3]).trim() : '';
    const col4_costCenter = r[4] != null ? String(r[4]).trim() : '';
    const col5_name = r[5] != null ? String(r[5]).trim() : '';
    const col6_price = r[6] != null ? Number(String(r[6]).replace(/,/g, '')) || 0 : 0;
    const col7_date = r[7];
    const col8_location = r[8] != null ? String(r[8]).trim() : '';
    const col9_custodian = r[9] != null ? String(r[9]).trim() : '';
    const col10_status = r[10] != null ? String(r[10]).trim() : '';
    const col11_notes = r[11] != null ? String(r[11]).trim() : '';
    const col12_resp = r[12] != null ? String(r[12]).trim() : '';

    // Primary Asset Code (หมายเลขครุภัณฑ์)
    let finalCode = col2_assetCode;
    if (!finalCode) {
      finalCode = col0_gfNo || `AST-${i}`;
    }
    if (codeMap.has(finalCode)) {
      let suffix = 2;
      while (codeMap.has(`${finalCode} (${suffix})`)) {
        suffix++;
      }
      finalCode = `${finalCode} (${suffix})`;
    }
    codeMap.set(finalCode, true);

    // Secondary Asset Code (เลขที่สินทรัพย์ GF + เลขที่ย่อย)
    let secondaryCode = col0_gfNo;
    if (secondaryCode && col1_subNo && col1_subNo !== '0') {
      secondaryCode = `${secondaryCode}/${col1_subNo}`;
    }

    const category = cleanCategory(col3_category, col5_name);
    const status = mapStatus(col10_status);
    const purchaseDate = parseDate(col7_date);
    const brand = extractBrand(col5_name);
    const serialNumber = extractSerial(col5_name);
    const subDivision = mapSubDivision(col12_resp);
    const division = 'กองสื่อสาร';

    const descParts = [];
    if (col4_costCenter) descParts.push(`ศูนย์ต้นทุน: ${col4_costCenter}`);
    if (col11_notes) descParts.push(`หมายเหตุ: ${col11_notes}`);
    if (col10_status && col10_status !== status) descParts.push(`สถานะเดิม: ${col10_status}`);
    const description = descParts.join(' | ');

    docsToInsert.push({
      assetCode: finalCode,
      secondaryAssetCode: secondaryCode,
      name: col5_name || 'ครุภัณฑ์',
      category: category,
      brand: brand,
      model: '',
      serialNumber: serialNumber,
      price: col6_price,
      purchaseDate: purchaseDate,
      location: col8_location || '-',
      custodian: col9_custodian || '-',
      division: division,
      subDivision: subDivision,
      status: status,
      usefulLifeYears: 5,
      salvageValue: 1,
      description: description,
      deleteFlag: 0,
      isDeleted: false,
      createdBy: 'นำเข้าจาก Excel (ไฟล์ครุภัณฑ์ กองสื่อสาร)',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  console.log(`Prepared ${docsToInsert.length} documents for import.`);

  // ลบข้อมูลเดิมก่อนเสมอเพื่อป้องกันความซ้ำซ้อน
  await assetsCollection.deleteMany({});
  console.log('Cleared existing assets in DB.');

  // Insert in chunks of 500
  const CHUNK_SIZE = 500;
  let inserted = 0;
  for (let i = 0; i < docsToInsert.length; i += CHUNK_SIZE) {
    const chunk = docsToInsert.slice(i, i + CHUNK_SIZE);
    const res = await assetsCollection.insertMany(chunk, { ordered: false });
    inserted += res.insertedCount;
    console.log(`Inserted chunk ${Math.floor(i / CHUNK_SIZE) + 1}, total inserted: ${inserted}`);
  }

  const finalTotal = await assetsCollection.countDocuments({ deleteFlag: 0 });
  console.log(`Import completed successfully! Total assets in DB: ${finalTotal}`);

  await mongoose.disconnect();
  console.log('MongoDB connection closed.');
}

run().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
