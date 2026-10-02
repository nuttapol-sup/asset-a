'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Boxes, Building2, MapPin, User, Calendar, Tag, ShieldAlert, CheckCircle2, AlertTriangle, FileText, ArrowRight, ExternalLink } from 'lucide-react';

interface PublicAsset {
  _id: string;
  assetCode: string;
  secondaryAssetCode: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  price: number;
  purchaseDate: string;
  location: string;
  custodian: string;
  division: string;
  subDivision: string;
  status: string;
  description: string;
  imageUrl?: string;
}

export default function ScanAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [asset, setAsset] = useState<PublicAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssetData();
  }, [id]);

  const fetchAssetData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/scan/${id}`);
      const data = await res.json();
      if (data.success) {
        setAsset(data.data);
      } else {
        setError(data.error || 'ไม่พบข้อมูลครุภัณฑ์');
      }
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ปกติ':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> ปกติ (พร้อมใช้งาน)
          </span>
        );
      case 'ถูกยืม':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" /> ถูกยืม
          </span>
        );
      case 'รอซ่อม':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-sky-100 text-sky-800 border border-sky-300">
            <ShieldAlert className="w-3.5 h-3.5" /> รอซ่อม
          </span>
        );
      case 'ชำรุด':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3.5 h-3.5" /> ชำรุด
          </span>
        );
      case 'แทงจำหน่าย':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-slate-200 text-slate-800 border border-slate-300">
            แทงจำหน่าย
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 space-y-0">
        {/* Header Banner */}
        <div className="bg-slate-900 text-white p-6 text-center space-y-2 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-600/20 rounded-full blur-xl pointer-events-none"></div>
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-lg mb-1">
            <Boxes className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">บัตรข้อมูลครุภัณฑ์</h1>
          <p className="text-xs text-slate-400">ระบบควบคุมและติดตามพัสดุ กรมอุตุนิยมวิทยา</p>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-10 text-center space-y-3">
            <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-xs text-slate-500 font-medium">กำลังโหลดข้อมูลครุภัณฑ์...</p>
          </div>
        ) : error || !asset ? (
          <div className="p-8 text-center space-y-4">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-full w-fit mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">ไม่พบข้อมูลครุภัณฑ์</h2>
              <p className="text-xs text-slate-500 mt-1">{error || 'รหัสครุภัณฑ์นี้อาจไม่มีในระบบหรือถูกลบออกแล้ว'}</p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow hover:bg-indigo-700 transition"
            >
              เข้าสู่ระบบเพื่อตรวจสอบ
            </Link>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {asset.imageUrl && (
              <div className="w-full h-56 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Status & Code Header Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">สถานะครุภัณฑ์</span>
                {getStatusBadge(asset.status)}
              </div>

              <div className="space-y-1">
                <div className="font-mono text-lg font-black text-indigo-700">{asset.assetCode}</div>
                {asset.secondaryAssetCode && (
                  <div className="font-mono text-xs text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded w-fit border border-amber-200 font-bold">
                    {asset.secondaryAssetCode}
                  </div>
                )}
              </div>

              <h2 className="text-base font-bold text-slate-900 leading-snug pt-1">{asset.name}</h2>
            </div>

            {/* Info Grid */}
            <div className="space-y-3 text-xs">
              {/* Division & SubDivision */}
              <div className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-xs">
                <Building2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">{asset.division}</div>
                  <div className="text-slate-500 font-medium">{asset.subDivision}</div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-xs">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-slate-400 font-medium">สถานที่จัดเก็บ: </span>
                  <span className="font-bold text-slate-800">{asset.location}</span>
                </div>
              </div>

              {/* Custodian */}
              <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-xs">
                <User className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-slate-400 font-medium">ผู้รับผิดชอบ: </span>
                  <span className="font-bold text-slate-800">{asset.custodian}</span>
                </div>
              </div>

              {/* Category, Brand, Model */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">หมวดหมู่</span>
                  <span className="font-semibold text-slate-800 truncate block mt-0.5">{asset.category}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">ยี่ห้อ / รุ่น</span>
                  <span className="font-semibold text-slate-800 truncate block mt-0.5">
                    {asset.brand} {asset.model !== '-' ? `(${asset.model})` : ''}
                  </span>
                </div>
              </div>

              {/* Price & Date */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">ราคาจัดซื้อ</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    ฿{asset.price.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Serial Number</span>
                  <span className="font-mono font-semibold text-slate-800 truncate block mt-0.5">
                    {asset.serialNumber}
                  </span>
                </div>
              </div>

              {/* Description if any */}
              {asset.description && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">รายละเอียดเพิ่มเติม</span>
                  <p className="text-slate-700 leading-relaxed">{asset.description}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <Link
                href={`/assets/${asset._id}`}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition shadow-md cursor-pointer"
              >
                <span>เปิดในระบบจัดการ (เข้าสู่ระบบเพื่อแก้ไข)</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-slate-400 mt-4">
        &copy; ระบบบริหารคุมครุภัณฑ์ กรมอุตุนิยมวิทยา
      </div>
    </div>
  );
}
