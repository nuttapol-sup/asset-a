'use client';

import { useEffect, useState } from 'react';
import { Boxes, Banknote, ArrowLeftRight, Wrench, AlertTriangle, CheckCircle2, ShieldAlert, PlusCircle, TrendingDown, Calculator, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalAssets: number;
  totalValue: number;
  totalNetBookValue: number;
  totalAccumulatedDepreciation: number;
  statusCounts: {
    normal: number;
    borrowed: number;
    pendingRepair: number;
    damaged: number;
    disposed: number;
  };
  activeBorrows: number;
  categoryStats: { _id: string; count: number; totalValue: number }[];
  scope?: {
    role: string;
    agency?: string;
    department?: string;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err?.message || 'ไม่สามารถโหลดข้อมูลสถิติได้');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between">
        <div>
          <p className="font-semibold">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ภาพรวมระบบคุมครุภัณฑ์</h1>
          <p className="text-sm text-slate-500 mt-1">สรุปข้อมูลครุภัณฑ์ มูลค่าทางบัญชี และค่าเสื่อมราคาสินทรัพย์</p>
        </div>
      </div>

      {/* Staff User Scope Notification Banner */}
      {stats?.scope && stats.scope.role !== 'admin' && (stats.scope.agency || stats.scope.department) && (
        <div className="bg-indigo-50/90 border border-indigo-200/80 rounded-2xl p-4 flex items-center gap-3 text-indigo-950 text-sm font-semibold shadow-2xs">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-indigo-950">จำกัดสิทธิ์การแสดงผลข้อมูลตามสังกัดของผู้ใช้งาน (Staff Role Scoping)</p>
            <p className="text-xs text-indigo-700 mt-0.5">
              แสดงเฉพาะสถิติสรุปครุภัณฑ์ของ {stats.scope.department ? `สังกัด/แผนก: "${stats.scope.department}"` : ''} {stats.scope.agency ? `(${stats.scope.agency})` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">จำนวนครุภัณฑ์ทั้งหมด</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">
              {stats?.totalAssets.toLocaleString() || 0} <span className="text-sm font-normal text-slate-500">รายการ</span>
            </p>
          </div>
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Boxes className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">มูลค่าจัดซื้อรวม (Original Cost)</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">
              ฿{stats?.totalValue.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Banknote className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">มูลค่าสุทธิทางบัญชี (Net Book Value)</p>
            <p className="text-3xl font-extrabold text-indigo-600 mt-2">
              ฿{stats?.totalNetBookValue.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Calculator className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">ค่าเสื่อมสะสมรวม (Accumulated Dep.)</p>
            <p className="text-3xl font-extrabold text-rose-600 mt-2">
              ฿{stats?.totalAccumulatedDepreciation.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl">
            <TrendingDown className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Status Breakdown & Category Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            สัดส่วนสถานะครุภัณฑ์
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-slate-700">ปกติ พร้อมใช้งาน</span>
              </div>
              <span className="font-bold text-emerald-700">{stats?.statusCounts.normal || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-100">
              <div className="flex items-center gap-2.5">
                <ArrowLeftRight className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium text-slate-700">ถูกยืม</span>
              </div>
              <span className="font-bold text-amber-700">{stats?.statusCounts.borrowed || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50/60 border border-sky-100">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-sky-600" />
                <span className="text-sm font-medium text-slate-700">อยู่ระหว่างรอซ่อม</span>
              </div>
              <span className="font-bold text-sky-700">{stats?.statusCounts.pendingRepair || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 border border-rose-100">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span className="text-sm font-medium text-slate-700">ชำรุดเสียหาย</span>
              </div>
              <span className="font-bold text-rose-700">{stats?.statusCounts.damaged || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">แทงจำหน่ายแล้ว</span>
              </div>
              <span className="font-bold text-slate-700">{stats?.statusCounts.disposed || 0}</span>
            </div>
          </div>
        </div>

        {/* Category breakdown table */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">สรุปแยกตามหมวดหมู่ครุภัณฑ์</h2>
            <Link href="/assets" className="text-xs text-indigo-600 font-semibold hover:underline">
              ดูทั้งหมด &rarr;
            </Link>
          </div>

          {stats?.categoryStats && stats.categoryStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="py-2.5 px-3">หมวดหมู่</th>
                    <th className="py-2.5 px-3 text-center">จำนวน (ชิ้น)</th>
                    <th className="py-2.5 px-3 text-right">มูลค่ารวม (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.categoryStats.map((cat) => (
                    <tr key={cat._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-medium text-slate-800">{cat._id || 'ไม่ระบุ'}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-full text-slate-700 text-xs font-semibold">
                          {cat.count}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-900">
                        ฿{cat.totalValue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              ยังไม่มีข้อมูลหมวดหมู่
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
