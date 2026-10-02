'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight, PlusCircle, CheckCircle2 } from 'lucide-react';

interface Asset {
  _id: string;
  assetCode: string;
  name: string;
  location: string;
  status: string;
}

interface BorrowRecord {
  _id: string;
  asset: Asset;
  borrowerName: string;
  department?: string;
  contactNumber?: string;
  borrowDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: 'กำลังยืม' | 'คืนแล้ว' | 'เกินกำหนด';
  notes?: string;
}

export default function BorrowPage() {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    assetId: '',
    borrowerName: '',
    department: '',
    contactNumber: '',
    expectedReturnDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchRecords();
    fetchAvailableAssets();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/borrow');
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAssets = async () => {
    try {
      const res = await fetch('/api/assets?status=ปกติ');
      const data = await res.json();
      if (data.success) {
        setAvailableAssets(data.data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetId || !formData.borrowerName || !formData.expectedReturnDate) {
      alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        alert('บันทึกการขอยืมครุภัณฑ์สำเร็จ!');
        setShowBorrowModal(false);
        setFormData({
          assetId: '',
          borrowerName: '',
          department: '',
          contactNumber: '',
          expectedReturnDate: '',
          notes: '',
        });
        fetchRecords();
        fetchAvailableAssets();
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnAsset = async (recordId: string, assetName: string) => {
    if (!confirm(`ยืนยันการรับคืนครุภัณฑ์ "${assetName}" หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/borrow/${recordId}/return`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('รับคืนครุภัณฑ์เรียบร้อยแล้ว!');
        fetchRecords();
        fetchAvailableAssets();
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ระบบเบิก / ยืม - คืน ครุภัณฑ์</h1>
          <p className="text-sm text-slate-500 mt-1">จัดการประวัติการยืม-คืน และติดตามกำหนดส่งคืนครุภัณฑ์</p>
        </div>
        <button
          onClick={() => setShowBorrowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-sm cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          ทำเรื่องยืมครุภัณฑ์
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">รายการครุภัณฑ์</th>
                  <th className="py-3.5 px-4">ผู้ยืม / แผนก</th>
                  <th className="py-3.5 px-4">วันที่ยืม</th>
                  <th className="py-3.5 px-4">กำหนดคืน</th>
                  <th className="py-3.5 px-4 text-center">สถานะการยืม</th>
                  <th className="py-3.5 px-4 text-center">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      {rec.asset ? (
                        <div>
                          <div className="font-semibold text-slate-900">{rec.asset.name}</div>
                          <div className="text-xs font-mono text-indigo-600 font-semibold">{rec.asset.assetCode}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-italic">ไม่พบข้อมูลครุภัณฑ์</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{rec.borrowerName}</div>
                      <div className="text-xs text-slate-400">
                        {rec.department || '-'} {rec.contactNumber ? `(${rec.contactNumber})` : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(rec.borrowDate).toLocaleDateString('th-TH')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(rec.expectedReturnDate).toLocaleDateString('th-TH')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {rec.status === 'กำลังยืม' ? (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          กำลังยืม
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          คืนแล้ว ({rec.actualReturnDate ? new Date(rec.actualReturnDate).toLocaleDateString('th-TH') : ''})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {rec.status === 'กำลังยืม' && (
                        <button
                          onClick={() => handleReturnAsset(rec._id, rec.asset?.name || 'ครุภัณฑ์')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition mx-auto cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          รับคืนครุภัณฑ์
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 space-y-3">
            <p className="text-slate-400 text-base">ยังไม่มีประวัติการยืม-คืนในระบบ</p>
            <button
              onClick={() => setShowBorrowModal(true)}
              className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:underline text-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> ทำเรื่องยืมครุภัณฑ์ชิ้นแรก
            </button>
          </div>
        )}
      </div>

      {/* Borrow Modal */}
      {showBorrowModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
              ทำเรื่องขอยืมครุภัณฑ์
            </h3>

            <form onSubmit={handleBorrowSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  เลือกครุภัณฑ์ที่ต้องการยืม (สถานะปกติ) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.assetId}
                  onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- เลือกรายการครุภัณฑ์ --</option>
                  {availableAssets.map((asset) => (
                    <option key={asset._id} value={asset._id}>
                      [{asset.assetCode}] {asset.name} ({asset.location})
                    </option>
                  ))}
                </select>
                {availableAssets.length === 0 && (
                  <p className="text-xs text-rose-500 mt-1">ไม่มีครุภัณฑ์ที่มีสถานะ "ปกติ" พร้อมให้ยืมในขณะนี้</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  ชื่อผู้ขอยืม <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ชื่อ-นามสกุล ผู้ยืม"
                  value={formData.borrowerName}
                  onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">แผนก / สังกัด</label>
                  <input
                    type="text"
                    placeholder="เช่น ฝ่ายไอที"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">เบอร์ติดต่อ</label>
                  <input
                    type="text"
                    placeholder="081-xxxxxxx"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  กำหนดส่งคืน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.expectedReturnDate}
                  onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">วัตถุประสงค์ / หมายเหตุ</label>
                <textarea
                  rows={2}
                  placeholder="ระบุวัตถุประสงค์ในการยืม เช่น ใช้จัดงานสัมมนา"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBorrowModal(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting || availableAssets.length === 0}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกการยืม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
