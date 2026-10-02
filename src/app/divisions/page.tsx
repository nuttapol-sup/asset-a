'use client';

import { useEffect, useState } from 'react';
import { Building2, Plus, Trash2, Edit3, FolderPlus, Layers, X, Check } from 'lucide-react';

interface DivisionType {
  _id: string;
  name: string;
  description?: string;
  subDivisions: string[];
  createdAt?: string;
}

export default function DivisionsPage() {
  const [divisions, setDivisions] = useState<DivisionType[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDivision, setEditingDivision] = useState<DivisionType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Division Form State
  const [divisionForm, setDivisionForm] = useState({
    name: '',
    description: '',
    subDivisionsText: '', // newline or comma separated initial sub-divisions
  });

  // Sub-division quick add input per division ID
  const [newSubDivInput, setNewSubDivInput] = useState<{ [divId: string]: string }>({});

  useEffect(() => {
    fetchDivisions();
  }, []);

  const fetchDivisions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/divisions');
      const data = await res.json();
      if (data.success) {
        setDivisions(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDivision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!divisionForm.name.trim()) {
      alert('กรุณากรอกชื่อกอง / สำนัก / ศูนย์');
      return;
    }

    setSubmitting(true);
    try {
      const parsedSubDivs = divisionForm.subDivisionsText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const res = await fetch('/api/divisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: divisionForm.name,
          description: divisionForm.description,
          subDivisions: parsedSubDivs.length > 0 ? parsedSubDivs : ['ฝ่ายบริหารงานทั่วไป'],
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('เพิ่มกอง / สำนัก / ศูนย์ เรียบร้อยแล้ว');
        setShowAddModal(false);
        setDivisionForm({ name: '', description: '', subDivisionsText: '' });
        fetchDivisions();
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDivision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDivision || !editingDivision.name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/divisions/${editingDivision._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingDivision.name,
          description: editingDivision.description,
          subDivisions: editingDivision.subDivisions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('บันทึกการแก้ไขเรียบร้อยแล้ว');
        setEditingDivision(null);
        fetchDivisions();
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDivision = async (id: string, name: string) => {
    if (!confirm(`ยืนยันลบกอง / สำนัก / ศูนย์ "${name}" หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/divisions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('ลบข้อมูลเรียบร้อยแล้ว');
        setDivisions((prev) => prev.filter((d) => d._id !== id));
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleAddSubDivision = async (div: DivisionType) => {
    const text = (newSubDivInput[div._id] || '').trim();
    if (!text) return;

    if (div.subDivisions.includes(text)) {
      alert('มีชื่อส่วนราชการนี้อยู่แล้วในกองนี้');
      return;
    }

    const updatedSubDivs = [...div.subDivisions, text];
    try {
      const res = await fetch(`/api/divisions/${div._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subDivisions: updatedSubDivs }),
      });
      const data = await res.json();
      if (data.success) {
        setDivisions((prev) =>
          prev.map((d) => (d._id === div._id ? { ...d, subDivisions: updatedSubDivs } : d))
        );
        setNewSubDivInput((prev) => ({ ...prev, [div._id]: '' }));
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleRemoveSubDivision = async (div: DivisionType, subName: string) => {
    if (!confirm(`ยืนยันลบส่วนราชการ "${subName}" จาก ${div.name} หรือไม่?`)) return;

    const updatedSubDivs = div.subDivisions.filter((s) => s !== subName);
    try {
      const res = await fetch(`/api/divisions/${div._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subDivisions: updatedSubDivs }),
      });
      const data = await res.json();
      if (data.success) {
        setDivisions((prev) =>
          prev.map((d) => (d._id === div._id ? { ...d, subDivisions: updatedSubDivs } : d))
        );
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-indigo-600" />
            จัดการโครงสร้างหน่วยงาน (กอง และ ส่วนราชการ)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            กำหนดชื่อกอง / สำนัก / ศูนย์ และ รายชื่อส่วนราชการ / ฝ่าย / ส่วน / กลุ่ม ในสังกัดกรมอุตุนิยมวิทยา
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
          เพิ่มกอง / สำนัก / ศูนย์ ใหม่
        </button>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : divisions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {divisions.map((div) => (
            <div
              key={div._id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition"
            >
              <div>
                {/* Card Title & Actions */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-indigo-600 shrink-0" />
                      {div.name}
                    </h3>
                    {div.description && (
                      <p className="text-xs text-slate-500 mt-1">{div.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingDivision(div)}
                      title="แก้ไขกอง"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDivision(div._id, div.name)}
                      title="ลบกอง"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub-divisions List */}
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      ส่วนราชการ / ฝ่าย / กลุ่ม ({div.subDivisions.length})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {div.subDivisions.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200/80 group hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition"
                      >
                        {sub}
                        <button
                          onClick={() => handleRemoveSubDivision(div, sub)}
                          title="ลบส่วนราชการนี้"
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Add Sub-division Input */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="+ เพิ่มส่วนราชการ/ฝ่าย..."
                  value={newSubDivInput[div._id] || ''}
                  onChange={(e) =>
                    setNewSubDivInput({ ...newSubDivInput, [div._id]: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubDivision(div);
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => handleAddSubDivision(div)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่ม
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-400">
          ยังไม่มีข้อมูลกอง / สำนัก / ศูนย์ในระบบ
        </div>
      )}

      {/* Modal Add Division */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-indigo-600" />
              เพิ่มกอง / สำนัก / ศูนย์ ใหม่
            </h3>

            <form onSubmit={handleCreateDivision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  ชื่อกอง / สำนัก / ศูนย์ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น กองพยากรณ์อากาศ"
                  value={divisionForm.name}
                  onChange={(e) => setDivisionForm({ ...divisionForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">คำอธิบาย</label>
                <input
                  type="text"
                  placeholder="เช่น กำกับดูแลงานพยากรณ์และเตือนภัยอากาศ"
                  value={divisionForm.description}
                  onChange={(e) =>
                    setDivisionForm({ ...divisionForm, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  ส่วนราชการ / ฝ่าย ในสังกัดเริ่มต้น (บรรทัดละ 1 ชื่อ)
                </label>
                <textarea
                  rows={4}
                  placeholder="ฝ่ายบริหารงานทั่วไป&#10;ส่วนพยากรณ์อากาศทั่วไป&#10;ส่วนเตือนภัยอุตุนิยมวิทยา"
                  value={divisionForm.subDivisionsText}
                  onChange={(e) =>
                    setDivisionForm({ ...divisionForm, subDivisionsText: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกกองใหม่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Division */}
      {editingDivision && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-indigo-600" />
              แก้ไขข้อมูลกอง / สำนัก / ศูนย์
            </h3>

            <form onSubmit={handleUpdateDivision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  ชื่อกอง / สำนัก / ศูนย์ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingDivision.name}
                  onChange={(e) =>
                    setEditingDivision({ ...editingDivision, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">คำอธิบาย</label>
                <input
                  type="text"
                  value={editingDivision.description || ''}
                  onChange={(e) =>
                    setEditingDivision({ ...editingDivision, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDivision(null)}
                  className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
