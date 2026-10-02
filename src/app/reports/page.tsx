'use client';

import { useEffect, useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Boxes,
  TrendingDown,
  DollarSign,
  Calculator,
  PieChart,
  ArrowLeftRight,
  Filter,
  Search,
  ShieldCheck,
} from 'lucide-react';

interface AssetReportItem {
  _id: string;
  assetCode: string;
  secondaryAssetCode: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  location: string;
  custodian: string;
  division?: string;
  subDivision?: string;
  status: string;
  purchaseDate: string;
  price: number;
  usefulLifeYears: number;
  salvageValue: number;
  annualDepreciation: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  createdBy: string;
}

interface CategorySummary {
  _id: string;
  count: number;
  totalPrice: number;
}

interface BorrowRecordItem {
  _id: string;
  assetCode: string;
  assetName: string;
  borrowerName: string;
  department: string;
  borrowDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: string;
  purpose?: string;
}

interface DivisionType {
  _id: string;
  name: string;
  subDivisions: string[];
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assets' | 'categories' | 'borrows'>('assets');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [subDivisionFilter, setSubDivisionFilter] = useState('');
  const [divisions, setDivisions] = useState<DivisionType[]>([]);

  const [summary, setSummary] = useState({
    totalAssets: 0,
    totalPurchasePrice: 0,
    totalAccumulatedDepreciation: 0,
    totalNetBookValue: 0,
  });

  const [statusCounts, setStatusCounts] = useState({
    normal: 0,
    borrowed: 0,
    pendingRepair: 0,
    damaged: 0,
    disposed: 0,
  });

  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [assets, setAssets] = useState<AssetReportItem[]>([]);
  const [borrows, setBorrows] = useState<BorrowRecordItem[]>([]);
  const [scope, setScope] = useState<{ role: string; agency?: string; department?: string } | null>(null);

  useEffect(() => {
    fetchReportData();
    fetchDivisions();
  }, []);

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

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.success) {
        setSummary(data.data.summary);
        setStatusCounts(data.data.statusCounts);
        setCategorySummary(data.data.categorySummary);
        setAssets(data.data.assets);
        setBorrows(data.data.borrows);
        if (data.data.scope) {
          setScope(data.data.scope);
        }
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter((item) => {
    const matchSearch =
      search === '' ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.assetCode.toLowerCase().includes(search.toLowerCase()) ||
      item.secondaryAssetCode.toLowerCase().includes(search.toLowerCase()) ||
      item.custodian.toLowerCase().includes(search.toLowerCase());

    const matchCategory = categoryFilter === '' || item.category === categoryFilter;
    const matchStatus = statusFilter === '' || item.status === statusFilter;
    const matchDivision = divisionFilter === '' || item.division === divisionFilter;
    const matchSubDivision = subDivisionFilter === '' || item.subDivision === subDivisionFilter;

    return matchSearch && matchCategory && matchStatus && matchDivision && matchSubDivision;
  });

  const handlePrint = () => {
    window.print();
  };

  const exportToCSV = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel Thai language support

    if (activeTab === 'assets') {
      csvContent += 'รหัสครุภัณฑ์(สส),รหัสครุภัณฑ์(ภาครัฐ),ชื่อครุภัณฑ์,หมวดหมู่,ยี่ห้อ/รุ่น,ชื่อกอง/สำนัก,ส่วนราชการ/ฝ่าย,สถานที่จัดเก็บ,ผู้ดูแล,สถานะ,วันที่รับเข้า,ราคาจัดซื้อ(บาท),ค่าเสื่อมสะสม(บาท),มูลค่าสุทธิตามบัญชี(บาท)\n';
      filteredAssets.forEach((item) => {
        csvContent += `"${item.assetCode}","${item.secondaryAssetCode}","${item.name}","${item.category}","${item.brand} ${item.model}","${item.division || '-'}","${item.subDivision || '-'}","${item.location}","${item.custodian}","${item.status}","${item.purchaseDate}",${item.price},${item.accumulatedDepreciation},${item.netBookValue}\n`;
      });
    } else if (activeTab === 'categories') {
      csvContent += 'หมวดหมู่ครุภัณฑ์,จำนวนรายการ,มูลค่ารวม(บาท)\n';
      categorySummary.forEach((cat) => {
        csvContent += `"${cat._id}",${cat.count},${cat.totalPrice}\n`;
      });
    } else if (activeTab === 'borrows') {
      csvContent += 'รหัสครุภัณฑ์,ชื่อครุภัณฑ์,ผู้ยืม,แผนก/ฝ่าย,วันที่ยืม,กำหนดคืน,วันที่คืนจริง,สถานะ\n';
      borrows.forEach((b) => {
        const bDate = b.borrowDate ? new Date(b.borrowDate).toLocaleDateString('th-TH') : '-';
        const eDate = b.expectedReturnDate ? new Date(b.expectedReturnDate).toLocaleDateString('th-TH') : '-';
        const rDate = b.actualReturnDate ? new Date(b.actualReturnDate).toLocaleDateString('th-TH') : '-';
        csvContent += `"${b.assetCode}","${b.assetName}","${b.borrowerName}","${b.department}","${bDate}","${eDate}","${rDate}","${b.status}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `รายงานครุภัณฑ์_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto print:max-w-none print:m-0 print:p-0 print:bg-white text-slate-900">
      {/* Custom Print CSS Rules */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          aside, nav, header, footer, .print\:hidden {
            display: none !important;
          }
          html, body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          main {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            display: block !important;
          }
          .print-table {
            border-collapse: collapse !important;
            width: 100% !important;
            font-size: 11px !important;
          }
          .print-table thead {
            display: table-header-group !important;
          }
          .print-table tfoot {
            display: table-footer-group !important;
          }
          .print-table tr {
            page-break-inside: avoid !important;
          }
          .print-table th,
          .print-table td {
            border: 1px solid #94a3b8 !important;
            padding: 6px 8px !important;
            font-size: 11px !important;
            word-break: break-word !important;
          }
          .print-table th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: 700 !important;
          }
          .print-table tfoot td {
            background-color: #f1f5f9 !important;
            border-top: 2px solid #475569 !important;
          }
        }
      `}</style>

      {/* Top Header - Hidden on print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            รายงานและสรุปข้อมูลครุภัณฑ์
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ออกรายงานสรุปภาพรวม มูลค่าคงเหลือทางบัญชี ค่าเสื่อมราคา และประวัติการยืม-คืน (รูปแบบ Excel/PDF)
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            ส่งออก CSV (Excel)
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            พิมพ์รายงาน / PDF
          </button>
        </div>
      </div>

      {/* Staff User Scope Notification Banner */}
      {scope && scope.role !== 'admin' && (scope.agency || scope.department) && (
        <div className="bg-indigo-50/90 border border-indigo-200/80 rounded-2xl p-4 flex items-center gap-3 text-indigo-950 text-sm font-semibold shadow-2xs print:hidden">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-indigo-950">จำกัดสิทธิ์การรายงานตามสังกัดของผู้ใช้งาน (Staff Role Scoping)</p>
            <p className="text-xs text-indigo-700 mt-0.5">
              รายงานจะแสดงเฉพาะรายการครุภัณฑ์ของ {scope.department ? `สังกัด/แผนก: "${scope.department}"` : ''} {scope.agency ? `(${scope.agency})` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Header for Print / PDF View only (Matching Image Header) */}
      <div className="hidden print:block mb-4 text-slate-900 border-b border-slate-300 pb-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-900">
            ตารางทะเบียนครุภัณฑ์และการคำนวณค่าเสื่อมราคา
          </h1>
          <span className="text-xs text-slate-500 font-sans">
            พบ {filteredAssets.length} รายการ
          </span>
        </div>
      </div>

      {/* Summary KPI Cards - Visible on screen only, hidden on print */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">จำนวนครุภัณฑ์ทั้งหมด</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {summary.totalAssets.toLocaleString()} <span className="text-sm font-normal text-slate-500">รายการ</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ราคาทรวดจัดซื้อรวม</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-900 mt-2">
            ฿{summary.totalPurchasePrice.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600">ค่าเสื่อมราคาสะสมรวม</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">
            ฿{summary.totalAccumulatedDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">มูลค่าคงเหลือสุทธิตามบัญชี</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Calculator className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">
            ฿{summary.totalNetBookValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Tabs & Controls - Hidden on print */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('assets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === 'assets'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4" />
            รายการครุภัณฑ์ & ค่าเสื่อม
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-4 h-4" />
            หมวดหมู่ & สถานะ
          </button>

          <button
            onClick={() => setActiveTab('borrows')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === 'borrows'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            ประวัติการยืม-คืน
          </button>
        </div>

        {/* Filters (only for Assets tab) */}
        {activeTab === 'assets' && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, รหัส..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-44"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              <option value="">ทุกหมวดหมู่</option>
              {categorySummary.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat._id}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              <option value="">ทุกสถานะ</option>
              <option value="ปกติ">ปกติ</option>
              <option value="ถูกยืม">ถูกยืม</option>
              <option value="รอซ่อม">รอซ่อม</option>
              <option value="ชำรุด">ชำรุด</option>
              <option value="แทงจำหน่าย">แทงจำหน่าย</option>
            </select>

            <select
              value={divisionFilter}
              onChange={(e) => {
                setDivisionFilter(e.target.value);
                setSubDivisionFilter('');
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="">ทุกกอง / สำนัก / ศูนย์</option>
              {divisions.map((div) => (
                <option key={div._id} value={div.name}>
                  {div.name}
                </option>
              ))}
            </select>

            <select
              value={subDivisionFilter}
              onChange={(e) => setSubDivisionFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="">
                {divisionFilter ? `ทุกส่วนราชการใน (${divisionFilter})` : 'ทุกส่วนราชการ / ฝ่าย'}
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
        )}
      </div>

      {/* Tab 1: Assets & Depreciation Detailed Table (Matching User Screenshot Layout) */}
      {(activeTab === 'assets' || typeof window !== 'undefined') && (
        <div className={`bg-white rounded-2xl border border-slate-200 print:border-none shadow-sm overflow-hidden ${activeTab !== 'assets' ? 'hidden print:block' : ''}`}>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between print:hidden">
            <h2 className="font-bold text-slate-900 text-base">ตารางทะเบียนครุภัณฑ์และการคำนวณค่าเสื่อมราคา</h2>
            <span className="text-xs text-slate-500 font-sans">พบ {filteredAssets.length} รายการ</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs print-table">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider print:bg-slate-100">
                <tr>
                  <th className="py-3 px-2 text-center w-8">#</th>
                  <th className="py-3 px-3">รหัสครุภัณฑ์ (สส.)</th>
                  <th className="py-3 px-3">รหัสครุภัณฑ์ (ภาครัฐ)</th>
                  <th className="py-3 px-3">ชื่อรายการครุภัณฑ์</th>
                  <th className="py-3 px-3">หมวดหมู่</th>
                  <th className="py-3 px-3">ยี่ห้อ / รุ่น</th>
                  <th className="py-3 px-3">สถานที่จัดเก็บ / ผู้รับผิดชอบ</th>
                  <th className="py-3 px-2 text-center">สถานะ</th>
                  <th className="py-3 px-2 text-center">วันที่รับเข้า</th>
                  <th className="py-3 px-3 text-right">ราคาจัดซื้อ (บาท)</th>
                  <th className="py-3 px-3 text-right">ค่าเสื่อมสะสม (บาท)</th>
                  <th className="py-3 px-3 text-right">มูลค่าคงเหลือ (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-400 font-sans">
                      ไม่พบข้อมูลครุภัณฑ์ตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((item, idx) => (
                    <tr key={item._id} className="hover:bg-slate-50/80 transition print:bg-white">
                      <td className="py-3 px-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-indigo-950 font-mono">{item.assetCode}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono">{item.secondaryAssetCode || '-'}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="py-3 px-3 text-slate-700">{item.category}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {item.brand || item.model ? `${item.brand} ${item.model}`.trim() : '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        <div className="font-semibold text-slate-800">{item.division || '-'}</div>
                        {item.subDivision && <div className="text-[11px] text-slate-600">{item.subDivision}</div>}
                        <div className="text-[11px] text-slate-400">ห้อง/สถานที่: {item.location} ({item.custodian})</div>
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${
                            item.status === 'ปกติ'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.status === 'ถูกยืม'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : item.status === 'รอซ่อม'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : item.status === 'ชำรุด'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center text-slate-600 font-mono">
                        {item.purchaseDate !== '-' ? item.purchaseDate : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900 font-mono">
                        ฿{item.price.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-600 font-mono">
                        ฿{item.accumulatedDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-700 font-mono">
                        ฿{item.netBookValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {/* Summary Footer Row (Matching Image Footer SUM row) */}
              {filteredAssets.length > 0 && (
                <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-mono font-bold text-slate-900 print:bg-slate-100">
                  <tr>
                    <td colSpan={9} className="py-3.5 px-3 text-right font-sans font-bold text-slate-800">
                      ผลรวมทั้งหมด ({filteredAssets.length} รายการ):
                    </td>
                    <td className="py-3.5 px-3 text-right font-black text-indigo-900 print:text-black">
                      ฿{filteredAssets.reduce((sum, item) => sum + item.price, 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-rose-600 print:text-rose-700">
                      ฿{filteredAssets.reduce((sum, item) => sum + item.accumulatedDepreciation, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-3 text-right font-black text-emerald-700 print:text-emerald-800">
                      ฿{filteredAssets.reduce((sum, item) => sum + item.netBookValue, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Category & Status Summary */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Summary Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              สรุปข้อมูลตามหมวดหมู่ครุภัณฑ์
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm print-table">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">หมวดหมู่</th>
                    <th className="py-2.5 px-3 text-center">จำนวนรายการ</th>
                    <th className="py-2.5 px-3 text-right">ราคารวม (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {categorySummary.map((cat) => (
                    <tr key={cat._id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">{cat._id}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-indigo-600">{cat.count}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        ฿{cat.totalPrice.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Status Summary Breakdown Cards */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-600" />
              สรุปจำนวนแยกตามสถานะ
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                <span className="font-semibold text-emerald-900 text-sm">ปกติ (พร้อมใช้งาน)</span>
                <span className="font-mono font-black text-emerald-700 text-lg">{statusCounts.normal}</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
                <span className="font-semibold text-amber-900 text-sm">ถูกยืมอยู่</span>
                <span className="font-mono font-black text-amber-700 text-lg">{statusCounts.borrowed}</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-orange-50 border border-orange-100 rounded-xl">
                <span className="font-semibold text-orange-900 text-sm">รอซ่อมแซม</span>
                <span className="font-mono font-black text-orange-700 text-lg">{statusCounts.pendingRepair}</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-rose-50 border border-rose-100 rounded-xl">
                <span className="font-semibold text-rose-900 text-sm">ชำรุด</span>
                <span className="font-mono font-black text-rose-700 text-lg">{statusCounts.damaged}</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-slate-100 border border-slate-200 rounded-xl">
                <span className="font-semibold text-slate-700 text-sm">แทงจำหน่าย (Disposed)</span>
                <span className="font-mono font-black text-slate-800 text-lg">{statusCounts.disposed}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Borrow / Return History */}
      {activeTab === 'borrows' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-base">รายงานประวัติการยืม - คืน ครุภัณฑ์</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs print-table">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">รหัส / ครุภัณฑ์</th>
                  <th className="py-3 px-3">ผู้ยืม (แผนก)</th>
                  <th className="py-3 px-3 text-center">วันที่ยืม</th>
                  <th className="py-3 px-3 text-center">กำหนดคืน</th>
                  <th className="py-3 px-3 text-center">วันที่คืนจริง</th>
                  <th className="py-3 px-3 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {borrows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                      ยังไม่มีประวัติการยืม-คืนในระบบ
                    </td>
                  </tr>
                ) : (
                  borrows.map((b, idx) => (
                    <tr key={b._id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-indigo-700">{b.assetCode}</div>
                        <div className="font-sans text-slate-800">{b.assetName}</div>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-semibold text-slate-800">{b.borrowerName}</div>
                        <div className="text-[11px] text-slate-400">{b.department}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">
                        {b.borrowDate ? new Date(b.borrowDate).toLocaleDateString('th-TH') : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">
                        {b.expectedReturnDate ? new Date(b.expectedReturnDate).toLocaleDateString('th-TH') : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">
                        {b.actualReturnDate ? new Date(b.actualReturnDate).toLocaleDateString('th-TH') : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'คืนแล้ว'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
