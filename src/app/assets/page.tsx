'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, PlusCircle, Eye, Trash2, QrCode, Image as ImageIcon, ShieldCheck } from 'lucide-react';
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
  const [scope, setScope] = useState<{ role: string; agency?: string; department?: string } | null>(null);

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
        if (data.scope) {
          setScope(data.scope);
        }
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 whitespace-nowrap shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 whitespace-nowrap shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></span>
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
        <div className="flex items-center gap-2 flex-wrap">
          {scope?.role === 'admin' && (
            <button
              onClick={async () => {
                if (!confirm('คุณต้องการลบข้อมูลครุภัณฑ์ทั้งหมดออกจากระบบใช่หรือไม่?')) return;
                try {
                  const res = await fetch('/api/assets/clear', { method: 'POST' });
                  const data = await res.json();
                  if (data.success) {
                    alert(data.message || 'ลบข้อมูลครุภัณฑ์ตัวอย่างเรียบร้อยแล้ว');
                    fetchAssets();
                  } else {
                    alert('เกิดข้อผิดพลาด: ' + data.error);
                  }
                } catch (err: any) {
                  alert('เกิดข้อผิดพลาด: ' + err.message);
                }
              }}
              className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2.5 rounded-xl font-bold text-sm transition shadow-2xs cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              ลบข้อมูลตัวอย่างทั้งหมด
            </button>
          )}
          <Link
            href="/assets/new"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-sm self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            เพิ่มครุภัณฑ์ใหม่
          </Link>
        </div>
      </div>

      {/* Staff User Scope Notification Banner */}
      {scope && scope.role !== 'admin' && (scope.agency || scope.department) && (
        <div className="bg-indigo-50/90 border border-indigo-200/80 rounded-2xl p-4 flex items-center gap-3 text-indigo-950 text-sm font-semibold shadow-2xs">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-indigo-950">จำกัดสิทธิ์การแสดงผลข้อมูลตามสังกัดของผู้ใช้งาน (Staff Role Scoping)</p>
            <p className="text-xs text-indigo-700 mt-0.5">
              แสดงเฉพาะรายการครุภัณฑ์ของ {scope.department ? `สังกัด/แผนก: "${scope.department}"` : ''} {scope.agency ? `(${scope.agency})` : ''}
            </p>
          </div>
        </div>
      )}

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

          {scope?.role === 'admin' && (
            <div className="relative">
              <select
                value={divisionFilter}
                onChange={(e) => {
                  setDivisionFilter(e.target.value);
                  setSubDivisionFilter('');
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition font-medium"
              >
                <option value="">ทุกส่วนราชการ (All Divisions)</option>
                {divisions.map((div) => (
                  <option key={div._id} value={div.name}>
                    {div.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : assets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-4 text-center w-16">รูปภาพ</th>
                  <th className="py-4 px-4">รหัสครุภัณฑ์</th>
                  <th className="py-4 px-4">ชื่อรายการครุภัณฑ์</th>
                  <th className="py-4 px-4">หมวดหมู่</th>
                  <th className="py-4 px-4">กอง / ฝ่ายงาน</th>
                  <th className="py-4 px-4 text-right">ราคาจัดซื้อ</th>
                  <th className="py-4 px-4 text-center">สถานะ</th>
                  <th className="py-4 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedAssets.map((asset) => (
                  <tr key={asset._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center">
                      {asset.imageUrl ? (
                        <img
                          src={asset.imageUrl}
                          alt={asset.name}
                          className="w-10 h-10 object-cover rounded-lg border border-slate-200 mx-auto shadow-2xs"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mx-auto border border-slate-200 text-slate-400">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 text-xs">
                      <div>{asset.assetCode}</div>
                      {asset.secondaryAssetCode && (
                        <div className="text-[11px] font-mono text-slate-400 font-normal">
                          {asset.secondaryAssetCode}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 line-clamp-1">{asset.name}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">
                        {asset.brand && `${asset.brand} `}
                        {asset.model && `(${asset.model})`}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{asset.category}</td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                        {asset.division || '-'}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {asset.subDivision || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                      ฿{asset.price.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(asset.status)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/assets/${asset._id}`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="ดูรายละเอียด"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setQrModalAsset(asset)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="สร้าง QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        {scope?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(asset._id, asset.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="ลบรายการ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400">ไม่พบข้อมูลครุภัณฑ์ที่ค้นหา</div>
        )}

        {/* Pagination Footer */}
        {totalAssets > 0 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600">
            <div>
              แสดง <span className="font-bold text-slate-900">{startIndex + 1}</span> ถึง{' '}
              <span className="font-bold text-slate-900">{endIndex}</span> จากทั้งหมด{' '}
              <span className="font-bold text-slate-900">{totalAssets}</span> รายการ
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span>แสดงต่อหน้า:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={0}>ทั้งหมด (All)</option>
                </select>
              </div>

              {pageSize > 0 && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer font-bold"
                  >
                    ก่อนหน้า
                  </button>
                  <span className="px-2 font-bold text-indigo-600">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer font-bold"
                  >
                    ถัดไป
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {qrModalAsset && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">QR Code สำหรับติดสติ๊กเกอร์</h3>
            <p className="text-xs text-slate-500">{qrModalAsset.name}</p>

            <div className="bg-white p-4 inline-block border-2 border-slate-200 rounded-xl shadow-inner">
              <QRCodeSVG
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/scan/${qrModalAsset._id}`}
                size={180}
              />
            </div>

            <div className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 py-2 rounded-lg">
              {qrModalAsset.assetCode}
            </div>

            <button
              onClick={() => setQrModalAsset(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
