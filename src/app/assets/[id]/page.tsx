'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, Printer, QrCode, Calculator, TrendingDown, User, Upload, Image as ImageIcon, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { calculateStraightLineDepreciation, DepreciationResult } from '@/lib/depreciation';
import { TMD_ORGANIZATION } from '@/lib/organization';

interface CategoryType {
  _id: string;
  name: string;
}

interface DivisionType {
  _id?: string;
  name: string;
  subDivisions: string[];
}

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [divisions, setDivisions] = useState<DivisionType[]>(TMD_ORGANIZATION);
  const [auditInfo, setAuditInfo] = useState<{ createdBy?: string; updatedBy?: string }>({});
  const [formData, setFormData] = useState({
    assetCode: '',
    secondaryAssetCode: '',
    name: '',
    category: '',
    brand: '',
    model: '',
    serialNumber: '',
    price: 0,
    purchaseDate: '',
    location: '',
    custodian: '',
    division: TMD_ORGANIZATION[0].name,
    subDivision: TMD_ORGANIZATION[0].subDivisions[0],
    status: 'ปกติ',
    usefulLifeYears: 5,
    salvageValue: 1,
    description: '',
    imageUrl: '',
  });

  const [depResult, setDepResult] = useState<DepreciationResult | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchDivisions();
    fetchAsset();
  }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    setUploading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (result.success) {
        setFormData((prev) => ({ ...prev, imageUrl: result.url }));
      } else {
        alert('เกิดข้อผิดพลาดในการอัปโหลด: ' + result.error);
      }
    } catch (err: any) {
      alert('อัปโหลดล้มเหลว: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (formData.price) {
      const res = calculateStraightLineDepreciation(
        Number(formData.price),
        Number(formData.salvageValue),
        Number(formData.usefulLifeYears),
        formData.purchaseDate
      );
      setDepResult(res);
    }
  }, [formData.price, formData.salvageValue, formData.usefulLifeYears, formData.purchaseDate]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDivisions = async () => {
    try {
      const res = await fetch('/api/divisions');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setDivisions(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAsset = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/assets/${id}`);
      const data = await res.json();
      if (data.success) {
        const item = data.data;
        setFormData({
          assetCode: item.assetCode || '',
          secondaryAssetCode: item.secondaryAssetCode || '',
          name: item.name || '',
          category: item.category || '',
          brand: item.brand || '',
          model: item.model || '',
          serialNumber: item.serialNumber || '',
          price: item.price || 0,
          purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : '',
          location: item.location || '',
          custodian: item.custodian || '',
          division: item.division || TMD_ORGANIZATION[0].name,
          subDivision: item.subDivision || TMD_ORGANIZATION[0].subDivisions[0],
          status: item.status || 'ปกติ',
          usefulLifeYears: item.usefulLifeYears ?? 5,
          salvageValue: item.salvageValue ?? 1,
          description: item.description || '',
          imageUrl: item.imageUrl || '',
        });
        setAuditInfo({
          createdBy: item.createdBy || 'ไม่ระบุ',
          updatedBy: item.updatedBy || 'ยังไม่มีการแก้ไข',
        });
      } else {
        alert('ไม่พบข้อมูลครุภัณฑ์');
        router.push('/assets');
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedDivisionObj = divisions.find((d) => d.name === formData.division) || divisions[0] || TMD_ORGANIZATION[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'division') {
      const divObj = divisions.find((d) => d.name === value);
      setFormData((prev) => ({
        ...prev,
        division: value,
        subDivision: divObj && divObj.subDivisions.length > 0 ? divObj.subDivisions[0] : '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          usefulLifeYears: Number(formData.usefulLifeYears),
          salvageValue: Number(formData.salvageValue),
          purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.data?.updatedBy) {
          setAuditInfo((prev) => ({ ...prev, updatedBy: data.data.updatedBy }));
        }
        alert('อัปเดตข้อมูลครุภัณฑ์เรียบร้อยแล้ว!');
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`ยืนยันลบรายการครุภัณฑ์ "${formData.name}" หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('ลบรายการสำเร็จ');
        router.push('/assets');
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/assets"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{formData.name}</h1>
              <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-mono font-bold rounded-md">
                {formData.assetCode}
              </span>
              {formData.secondaryAssetCode && (
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-mono font-bold rounded-md">
                  {formData.secondaryAssetCode}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">รายละเอียด การคำนวณค่าเสื่อมราคา และแก้ไขข้อมูลครุภัณฑ์</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            พิมพ์สติกเกอร์
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            ลบ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Image Card, QR Code Tag & Audit Log */}
        <div className="space-y-6 h-fit">
          {/* Asset Image Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3 text-center">
            <h2 className="text-sm font-bold text-slate-900 flex items-center justify-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              รูปภาพครุภัณฑ์
            </h2>
            {formData.imageUrl ? (
              <div className="relative w-full h-52 rounded-xl overflow-hidden border border-slate-200 shadow-inner group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={formData.imageUrl} alt={formData.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full h-40 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-4">
                <ImageIcon className="w-8 h-8 text-slate-300 mb-1" />
                <span className="text-xs">ยังไม่มีรูปภาพครุภัณฑ์</span>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-600" />
              สติกเกอร์ครุภัณฑ์
            </h2>

            <div className="p-4 bg-yellow-300 rounded-xl border-2 border-slate-900 space-y-2 text-slate-900 font-mono">
              <div className="text-xs font-extrabold flex flex-col items-center justify-center gap-0.5">
                <span>{formData.assetCode}</span>
                {formData.secondaryAssetCode && <span>{formData.secondaryAssetCode}</span>}
              </div>

              <div className="bg-white p-3 rounded-lg inline-block shadow-inner">
                <QRCodeSVG
                  value={typeof window !== 'undefined' ? `${window.location.origin}/scan/${id}` : `/scan/${id}`}
                  size={140}
                />
              </div>

              <div className="text-[11px] font-sans font-bold truncate px-1">
                {formData.name}
              </div>
            </div>
          </div>

          {/* User Audit Log Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-indigo-600" />
              ประวัติผู้บันทึก/แก้ไข (Audit Log)
            </h2>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-400">ผู้เพิ่มข้อมูล (Created By)</p>
                <p className="font-medium text-slate-800 mt-0.5">{auditInfo.createdBy || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-400">ผู้แก้ไขล่าสุด (Updated By)</p>
                <p className="font-medium text-slate-800 mt-0.5">{auditInfo.updatedBy || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleUpdate} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">เลขครุภัณฑ์ (แบบที่ 1 - สส./ภายใน)</label>
              <input
                type="text"
                name="assetCode"
                value={formData.assetCode}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">เลขครุภัณฑ์ (แบบที่ 2 - ภาครัฐ/จำแนก)</label>
              <input
                type="text"
                name="secondaryAssetCode"
                value={formData.secondaryAssetCode}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">ชื่อครุภัณฑ์</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">หมวดหมู่ครุภัณฑ์</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
              >
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">สถานะปัจจุบัน</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
              >
                <option value="ปกติ">ปกติ (Normal)</option>
                <option value="ถูกยืม">ถูกยืม (Borrowed)</option>
                <option value="รอซ่อม">รอซ่อม (Pending Repair)</option>
                <option value="ชำรุด">ชำรุด (Damaged)</option>
                <option value="แทงจำหน่าย">แทงจำหน่าย (Disposed)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">ยี่ห้อ</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">รุ่น</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Serial Number</label>
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">ราคาจัดซื้อ (บาท)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">วันที่รับเข้า</label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            {/* Depreciation Fields */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">อายุการใช้งานทางบัญชี (ปี)</label>
              <input
                type="number"
                name="usefulLifeYears"
                value={formData.usefulLifeYears}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">ราคาซาก / มูลค่าคงเหลือ (บาท)</label>
              <input
                type="number"
                name="salvageValue"
                value={formData.salvageValue}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">ชื่อกอง / สำนัก / ศูนย์</label>
              <select
                name="division"
                value={formData.division}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
              >
                {divisions.map((div) => (
                  <option key={div.name} value={div.name}>
                    {div.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">ส่วนราชการ / ฝ่าย / ส่วน / กลุ่ม</label>
              <select
                name="subDivision"
                value={formData.subDivision}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
              >
                {selectedDivisionObj.subDivisions.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">สถานที่จัดเก็บ</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">ผู้รับผิดชอบ</label>
              <input
                type="text"
                name="custodian"
                value={formData.custodian}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">อัปเดต/เปลี่ยนรูปภาพครุภัณฑ์</label>
            {formData.imageUrl ? (
              <div className="relative w-full max-w-xs h-40 rounded-xl overflow-hidden border border-slate-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={formData.imageUrl} alt="Asset preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                  className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-md transition cursor-pointer"
                  title="ลบรูปภาพ"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl bg-slate-50 hover:bg-indigo-50/30 transition cursor-pointer">
                <div className="flex flex-col items-center justify-center pt-4 pb-5">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600 mb-1"></div>
                  ) : (
                    <Upload className="w-7 h-7 text-indigo-500 mb-1" />
                  )}
                  <p className="text-xs font-semibold text-slate-700">
                    {uploading ? 'กำลังอัปโหลดรูปภาพ...' : 'คลิกเพื่อเปลี่ยน/อัปโหลดรูปภาพใหม่'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">รองรับ JPG, PNG, WEBP (ไม่เกิน 10 MB)</p>
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
              </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">รายละเอียด / หมายเหตุ</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </form>
      </div>

      {/* Depreciation Summary & Yearly Schedule Table */}
      {depResult && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" />
            ตารางและผลการคำนวณค่าเสื่อมราคาทางบัญชี (วิธีเส้นตรง)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">ค่าเสื่อมราคาต่อปี</p>
              <p className="text-xl font-black text-slate-900 mt-1">฿{depResult.annualDepreciation.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">อายุใช้งานมาแล้ว</p>
              <p className="text-xl font-black text-slate-900 mt-1">{depResult.yearsElapsed} ปี</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-xs text-rose-600 font-medium">ค่าเสื่อมราคาสะสมปัจจุบัน</p>
              <p className="text-xl font-black text-rose-700 mt-1">฿{depResult.accumulatedDepreciation.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs text-emerald-600 font-medium">มูลค่าสุทธิตามบัญชีปัจจุบัน</p>
              <p className="text-xl font-black text-emerald-700 mt-1">฿{depResult.netBookValue.toLocaleString()}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-4 text-center">ปีที่</th>
                  <th className="py-2.5 px-4 text-center">ปี พ.ศ. / ค.ศ.</th>
                  <th className="py-2.5 px-4 text-right">ค่าเสื่อมราคาประจำปี (บาท)</th>
                  <th className="py-2.5 px-4 text-right">ค่าเสื่อมราคาสะสม (บาท)</th>
                  <th className="py-2.5 px-4 text-right">มูลค่าคงเหลือตามบัญชี (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {depResult.yearlySchedule.map((item) => (
                  <tr key={item.yearNumber} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center font-bold text-slate-700">{item.yearNumber}</td>
                    <td className="py-3 px-4 text-center text-slate-600">พ.ศ. {item.calendarYear + 543} ({item.calendarYear})</td>
                    <td className="py-3 px-4 text-right text-slate-800">฿{item.annualDepreciation.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-rose-600">฿{item.accumulatedDepreciation.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">฿{item.bookValue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
