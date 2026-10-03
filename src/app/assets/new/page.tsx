'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Upload, Image as ImageIcon, X } from 'lucide-react';
import { TMD_ORGANIZATION } from '@/lib/organization';
import { compressImage } from '@/lib/imageCompressor';

interface CategoryType {
  _id: string;
  name: string;
}

interface DivisionType {
  _id?: string;
  name: string;
  subDivisions: string[];
}

export default function NewAssetPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [divisions, setDivisions] = useState<DivisionType[]>(TMD_ORGANIZATION);
  const [formData, setFormData] = useState({
    assetCode: '',
    secondaryAssetCode: '',
    name: '',
    category: '',
    brand: '',
    model: '',
    serialNumber: '',
    price: '',
    purchaseDate: '',
    location: '',
    custodian: '',
    division: TMD_ORGANIZATION[0].name,
    subDivision: TMD_ORGANIZATION[0].subDivisions[0],
    status: 'ปกติ',
    description: '',
    imageUrl: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchDivisionsAndUser();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setUploading(true);
    try {
      // 1. Generate compressed base64 data URI directly in browser (~60KB)
      let base64Url = '';
      let fileToUpload = rawFile;
      try {
        const compressed = await compressImage(rawFile, 1000, 1000, 0.78);
        fileToUpload = compressed.compressedFile;
        base64Url = compressed.dataUrl;
      } catch (err) {
        console.warn('Compression skipped', err);
        base64Url = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve(evt.target?.result as string || '');
          reader.readAsDataURL(rawFile);
        });
      }

      // Immediately set Base64 Data URI in React state for fail-proof preview
      if (base64Url) {
        setFormData((prev) => ({ ...prev, imageUrl: base64Url }));
      }

      // 2. Upload file to server as backup
      const data = new FormData();
      data.append('file', fileToUpload);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();

      // If server returned a valid Base64 data URI, update it; otherwise keep local base64Url
      if (result.success && result.base64) {
        setFormData((prev) => ({ ...prev, imageUrl: result.base64 }));
      } else if (base64Url) {
        setFormData((prev) => ({ ...prev, imageUrl: base64Url }));
      }
    } catch (err: any) {
      alert('อัปโหลดล้มเหลว: ' + (err?.message || 'เกิดข้อผิดพลาดในการอัปโหลด'));
    } finally {
      setUploading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setCategories(data.data);
        setFormData((prev) => ({ ...prev, category: data.data[0].name }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDivisionsAndUser = async () => {
    try {
      const [divRes, meRes] = await Promise.all([
        fetch('/api/divisions'),
        fetch('/api/auth/me'),
      ]);

      const divData = await divRes.json();
      const meData = await meRes.json();

      let activeDivisions = TMD_ORGANIZATION;
      if (divData.success && divData.data.length > 0) {
        activeDivisions = divData.data;
        setDivisions(activeDivisions);
      }

      let defaultDivision = activeDivisions[0]?.name || '';
      let defaultSubDivision = activeDivisions[0]?.subDivisions?.[0] || '';

      if (meData.success && meData.user) {
        const userAgency = meData.user.agency?.trim();
        const userDept = meData.user.department?.trim();

        if (userAgency) {
          const matchedDiv = activeDivisions.find(
            (d) => d.name.toLowerCase() === userAgency.toLowerCase()
          );
          if (matchedDiv) {
            defaultDivision = matchedDiv.name;
            if (userDept && matchedDiv.subDivisions?.includes(userDept)) {
              defaultSubDivision = userDept;
            } else if (matchedDiv.subDivisions?.length > 0) {
              defaultSubDivision = matchedDiv.subDivisions[0];
            }
          }
        }
      }

      setFormData((prev) => ({
        ...prev,
        division: defaultDivision,
        subDivision: defaultSubDivision,
      }));
    } catch (err) {
      console.error('Failed to fetch divisions or user profile:', err);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.location || !formData.custodian) {
      alert('กรุณากรอกข้อมูลสำคัญ (ชื่อครุภัณฑ์, หมวดหมู่, สถานที่ตั้ง, ผู้รับผิดชอบ) ให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? Number(formData.price) : 0,
          purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('ลงทะเบียนครุภัณฑ์สำเร็จ!');
        router.push('/assets');
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            <h1 className="text-2xl font-bold text-slate-900">ลงทะเบียนครุภัณฑ์ใหม่</h1>
            <p className="text-sm text-slate-500 mt-0.5">กรอกข้อมูลรายละเอียดสินทรัพย์ พร้อมเลือกหมวดหมู่ครุภัณฑ์</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              เลขครุภัณฑ์ (แบบที่ 1 - รหัสภายใน/สส.) <span className="text-xs text-slate-400 font-normal">(สร้างให้อัตโนมัติหากไม่ระบุ)</span>
            </label>
            <input
              type="text"
              name="assetCode"
              placeholder="เช่น สส. 1000000009290"
              value={formData.assetCode}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              เลขครุภัณฑ์ (แบบที่ 2 - รหัสภาครัฐ/จำแนกพัสดุ)
            </label>
            <input
              type="text"
              name="secondaryAssetCode"
              placeholder="เช่น อต.7440-001-004-1681"
              value={formData.secondaryAssetCode}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              ชื่อครุภัณฑ์ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="เช่น เครื่องคอมพิวเตอร์ประมวลผลสูง (MacBook Pro)"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              หมวดหมู่ครุภัณฑ์ <span className="text-rose-500">*</span>
            </label>
            <select
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
            >
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">ยี่ห้อ (Brand)</label>
            <input
              type="text"
              name="brand"
              placeholder="เช่น Apple, Dell, Herman Miller"
              value={formData.brand}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">รุ่น (Model)</label>
            <input
              type="text"
              name="model"
              placeholder="เช่น MacBook Pro 16"
              value={formData.model}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Serial Number</label>
            <input
              type="text"
              name="serialNumber"
              placeholder="หมายเลขเครื่องประจำชิ้นส่วน"
              value={formData.serialNumber}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">ราคาจัดซื้อ (บาท)</label>
            <input
              type="number"
              name="price"
              placeholder="0"
              value={formData.price}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">วันที่รับเข้า / ซื้อ</label>
            <input
              type="date"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              ชื่อกอง / สำนัก / ศูนย์ <span className="text-rose-500">*</span>
            </label>
            <select
              name="division"
              value={formData.division}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
            >
              {divisions.map((div) => (
                <option key={div.name} value={div.name}>
                  {div.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              ส่วนราชการ / ฝ่าย / ส่วน / กลุ่ม <span className="text-rose-500">*</span>
            </label>
            <select
              name="subDivision"
              value={formData.subDivision}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
            >
              {selectedDivisionObj.subDivisions.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              สถานที่จัดเก็บ / ห้อง <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="location"
              required
              placeholder="เช่น ห้อง IT Room 401"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              ผู้รับผิดชอบ / ผู้ถือครอง <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="custodian"
              required
              placeholder="เช่น นายสมชาย สายเทค"
              value={formData.custodian}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">สถานะเริ่มต้น</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            >
              <option value="ปกติ">ปกติ (พร้อมใช้งาน)</option>
              <option value="รอซ่อม">รอซ่อม</option>
              <option value="ชำรุด">ชำรุด</option>
              <option value="แทงจำหน่าย">แทงจำหน่าย</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">รูปภาพครุภัณฑ์ (Asset Photo)</label>
          
          {/* Always available hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="hidden"
          />

          {formData.imageUrl ? (
            <div className="space-y-3">
              <div className="relative w-full max-w-xs h-44 rounded-2xl overflow-hidden border border-slate-200 group bg-slate-50 flex items-center justify-center shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.imageUrl}
                  alt="Asset preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.new-img-fallback');
                      if (fallback) fallback.classList.remove('hidden');
                    }
                  }}
                />
                <div className="new-img-fallback hidden flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                  <ImageIcon className="w-8 h-8 text-slate-300 mb-1 mx-auto" />
                  <span className="text-xs font-medium text-slate-500">ไม่สามารถแสดงรูปภาพได้</span>
                </div>
              </div>

              <div className="flex items-center gap-2 max-w-xs">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer border border-indigo-200 shadow-2xs"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-600"></div>
                  ) : (
                    <Upload className="w-4 h-4 text-indigo-600" />
                  )}
                  <span>{uploading ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปภาพ'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition cursor-pointer border border-rose-200"
                >
                  <X className="w-4 h-4" />
                  <span>ลบ</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex flex-col items-center justify-center w-full max-w-xs h-36 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl bg-slate-50 hover:bg-indigo-50/30 transition cursor-pointer text-center"
            >
              <div className="flex flex-col items-center justify-center p-4">
                {uploading ? (
                  <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-indigo-600 mb-2"></div>
                ) : (
                  <Upload className="w-8 h-8 text-indigo-500 mb-2" />
                )}
                <p className="text-xs font-semibold text-slate-700">
                  {uploading ? 'กำลังอัปโหลดรูปภาพ...' : 'คลิกเพื่อเลือกไฟล์รูปภาพ (JPG, PNG, WEBP)'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">ขนาดไฟล์ไม่เกิน 10 MB</p>
              </div>
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">รายละเอียดเพิ่มเติม / หมายเหตุ</label>
          <textarea
            name="description"
            rows={3}
            placeholder="รายละเอียด สเปก สภาพการใช้งาน หรือหมายเหตุพัสดุ"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/assets"
            className="px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-semibold transition"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-md disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'กำลังบันทึก...' : 'บันทึกครุภัณฑ์'}
          </button>
        </div>
      </form>
    </div>
  );
}
