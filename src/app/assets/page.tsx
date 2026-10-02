'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, PlusCircle, Eye, Trash2, QrCode, Image as ImageIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface AssetType {
  _id: string;
  assetCode: string;
  secondaryAssetCode?: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  price: number;
  location: string;
  custodian: string;
  division?: string;
  subDivision?: string;
  status: 'ปกติ' | 'ชำรุด' | 'รอซ่อม' | 'แทงจำหน่าย' | 'ถูกยืม';
  imageUrl?: string;
  createdAt: string;
}

interface CategoryType {
  _id: string;
  name: string;
}

interface DivisionType {
  _id: string;
  name: string;
  subDivisions: string[];
}

export default function AssetsListPage() {
  const [assets, setAssets] = useState<AssetType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [divisions, setDivisions] = useState<DivisionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [subDivisionFilter, setSubDivisionFilter] = useState('');
  const [qrModalAsset, setQrModalAsset] = useState<AssetType | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchCategories();
    fetchDivisions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchAssets();
  }, [search, statusFilter, categoryFilter, divisionFilter, subDivisionFilter]);

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
      if (data.success) {
        setDivisions(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (statusFilter) query.append('status', statusFilter);
      if (categoryFilter) query.append('category', categoryFilter);
      if (divisionFilter) query.append('division', divisionFilter);
      if (subDivisionFilter) query.append('subDivision', subDivisionFilter);

      const res = await fetch(`/api/assets?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAssets(data.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculation
  const totalAssets = assets.length;
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalAssets / pageSize);
  const startIndex = pageSize === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = pageSize === 0 ? totalAssets : Math.min(startIndex + pageSize, totalAssets);
  const paginatedAssets = assets.slice(startIndex, endIndex);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`ยืนยันลบรายการครุภัณฑ์ "${name}" หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAssets(assets.filter((a) => a._id !== id));
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const getStatusBadge = (status: AssetType['status']) => {
    switch (status) {
      case 'ปกติ':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 whitespace-nowrap shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            ปกติ
          </span>
        );
      case 'ถูกยืม':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 whitespace-nowrap shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
            ถูกยืม
          </span>
        );
      case 'รอซ่อม':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 whitespace-nowrap shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0"></span>
            รอซ่อม
          </span>
        );
      case 'ชำรุด':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 whitespace-nowrap shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
            ชำรุด
          </span>
        );
      case 'แทงจำหน่าย':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-300/80 whitespace-nowrap shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
            แทงจำหน่าย
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ทะเบียนครุภัณฑ์ทั้งหมด</h1>
          <p className="text-sm text-slate-500 mt-1">จัดการ ค้นหา และตรวจสอบสถานะครุภัณฑ์ในองค์กร ({totalAssets} รายการ)</p>
        </div>
        <Link
          href="/assets/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          เพิ่มครุภัณฑ์ใหม่
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหารหัสครุภัณฑ์ (ทั้ง 2 แบบ), ชื่อ, สถานที่..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition appearance-none"
            >
              <option value="">ทุกสถานะ (All Status)</option>
              <option value="ปกติ">ปกติ (Normal)</option>
              <option value="ถูกยืม">ถูกยืม (Borrowed)</option>
              <option value="รอซ่อม">รอซ่อม (Pending Repair)</option>
              <option value="ชำรุด">ชำรุด (Damaged)</option>
              <option value="แทงจำหน่าย">แทงจำหน่าย (Disposed)</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            >
              <option value="">ทุกหมวดหมู่ (All Categories)</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={divisionFilter}
              onChange={(e) => {
                setDivisionFilter(e.target.value);
                setSubDivisionFilter(''); // Reset subDivision when division changes
              }}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition font-medium text-slate-800"
            >
              <option value="">ทุกกอง / สำนัก / ศูนย์</option>
              {divisions.map((div) => (
                <option key={div._id} value={div.name}>
                  {div.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Filter Row for Sub-division */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-1 border-t border-slate-100">
          <div className="lg:col-span-3 flex items-center gap-3 text-xs text-slate-600 flex-wrap">
            {divisionFilter && (
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-200">
                🏢 กรองเฉพาะกอง: {divisionFilter} {subDivisionFilter ? `> ${subDivisionFilter}` : '(ทุกฝ่ายในกองนี้)'}
              </span>
            )}

            {(search || statusFilter || categoryFilter || divisionFilter || subDivisionFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setCategoryFilter('');
                  setDivisionFilter('');
                  setSubDivisionFilter('');
                }}
                className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer underline"
              >
                ล้างตัวกรองทั้งหมด (Clear All Filters)
              </button>
            )}
          </div>

          <div className="relative lg:col-span-2">
            <select
              value={subDivisionFilter}
              onChange={(e) => setSubDivisionFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition font-medium text-slate-800"
            >
              <option value="">
                {divisionFilter ? `ทุกส่วนราชการใน (${divisionFilter})` : 'ทุกส่วนราชการ / ฝ่าย / กลุ่ม'}
              </option>
              {divisionFilter ? (
                divisions
                  .filter((d) => d.name === divisionFilter)
                  .map((div) => (
                    <optgroup key={div._id} label={`📂 ${div.name}`}>
                      {div.subDivisions.map((sub) => (
                        <option key={`${div._id}-${sub}`} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </optgroup>
                  ))
              ) : (
                divisions.map((div) => (
                  <optgroup key={div._id} label={`📂 ${div.name}`}>
                    {div.subDivisions.map((sub) => (
                      <option key={`${div._id}-${sub}`} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </optgroup>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : paginatedAssets.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">เลขครุภัณฑ์ (2 แบบ)</th>
                    <th className="py-3.5 px-4">ชื่อครุภัณฑ์ / ยี่ห้อ - รุ่น</th>
                    <th className="py-3.5 px-4">หมวดหมู่</th>
                    <th className="py-3.5 px-4">หน่วยงาน (กอง / ส่วน)</th>
                    <th className="py-3.5 px-4">สถานที่จัดเก็บ</th>
                    <th className="py-3.5 px-4">ผู้รับผิดชอบ</th>
                    <th className="py-3.5 px-4 text-right">ราคา (บาท)</th>
                    <th className="py-3.5 px-4 text-center">สถานะ</th>
                    <th className="py-3.5 px-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAssets.map((asset) => (
                    <tr key={asset._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-indigo-600">{asset.assetCode}</div>
                        {asset.secondaryAssetCode && (
                          <div className="font-mono text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded w-fit border border-amber-200/80 mt-0.5">
                            {asset.secondaryAssetCode}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {asset.imageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={asset.imageUrl}
                              alt={asset.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 text-slate-400">
                              <ImageIcon className="w-5 h-5 text-slate-300" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-900">{asset.name}</div>
                            {(asset.brand || asset.model) && (
                              <div className="text-xs text-slate-400">
                                {asset.brand} {asset.model}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{asset.category}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{asset.division || '-'}</div>
                        {asset.subDivision && <div className="text-xs text-slate-500">{asset.subDivision}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{asset.location}</td>
                      <td className="py-3.5 px-4 text-slate-600">{asset.custodian}</td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                        ฿{asset.price.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">{getStatusBadge(asset.status)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setQrModalAsset(asset)}
                            title="ดู QR Code"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/assets/${asset._id}`}
                            title="ดูรายละเอียด/แก้ไข"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(asset._id, asset.name)}
                            title="ลบ"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span>แสดงแถวต่อหน้า:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                >
                  <option value={10}>10 แถว</option>
                  <option value={25}>25 แถว</option>
                  <option value={50}>50 แถว</option>
                  <option value={100}>100 แถว</option>
                  <option value={0}>ทั้งหมด (All)</option>
                </select>
                <span className="text-slate-500 ml-2">
                  (แสดง {totalAssets > 0 ? startIndex + 1 : 0} ถึง {endIndex} จาก {totalAssets} รายการ)
                </span>
              </div>

              {pageSize > 0 && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    หน้าแรก
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    ก่อนหน้า
                  </button>

                  <span className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold">
                    หน้า {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    ถัดไป
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    หน้าสุดท้าย
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-16 space-y-3">
            <p className="text-slate-400 text-base">ไม่พบรายการครุภัณฑ์ที่ตรงกับการค้นหา</p>
            <Link
              href="/assets/new"
              className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:underline text-sm"
            >
              <PlusCircle className="w-4 h-4" /> เพิ่มครุภัณฑ์ใหม่ตอนนี้
            </Link>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {qrModalAsset && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-slate-900">QR Code พิมพ์สติกเกอร์</h3>

            <div className="p-4 bg-yellow-300 rounded-xl border-2 border-slate-900 space-y-2 text-slate-900 font-mono">
              <div className="text-xs font-extrabold flex flex-col items-center justify-center gap-0.5">
                <span>{qrModalAsset.assetCode}</span>
                {qrModalAsset.secondaryAssetCode && <span>{qrModalAsset.secondaryAssetCode}</span>}
              </div>

              <div className="bg-white p-3 rounded-lg inline-block shadow-inner">
                <QRCodeSVG
                  value={typeof window !== 'undefined' ? `${window.location.origin}/scan/${qrModalAsset._id}` : `/scan/${qrModalAsset._id}`}
                  size={150}
                />
              </div>

              <div className="text-[11px] font-sans font-bold truncate px-2">
                {qrModalAsset.name}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition cursor-pointer"
              >
                พิมพ์สติกเกอร์
              </button>
              <button
                onClick={() => setQrModalAsset(null)}
                className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl text-sm font-semibold hover:bg-slate-200 transition cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
