'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Trash2, KeyRound } from 'lucide-react';
import { TMD_ORGANIZATION, TMDDivision } from '@/lib/organization';

interface UserType {
  _id: string;
  username: string;
  name: string;
  role: 'admin' | 'staff';
  agency?: string;
  department?: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [divisions, setDivisions] = useState<TMDDivision[]>(TMD_ORGANIZATION);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'staff',
    agency: '',
    department: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchDivisions();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  const currentSelectedDivision = divisions.find((d) => d.name === formData.agency);
  const currentSubDivisions = currentSelectedDivision ? currentSelectedDivision.subDivisions : [];

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.name) {
      alert('กรุณากรอก Username, Password และชื่อ-นามสกุล');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        alert('สร้างผู้ใช้งานใหม่สำเร็จ!');
        setShowModal(false);
        setFormData({ username: '', password: '', name: '', role: 'staff', agency: '', department: '' });
        fetchUsers();
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (id: string, username: string) => {
    if (!confirm(`ยืนยันการรีเซ็ตรหัสผ่านสำหรับผู้ใช้ "@${username}" เป็น "tmd1234" หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', newPassword: 'tmd1234' }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`รีเซ็ตรหัสผ่านสำหรับ @${username} เป็น "tmd1234" เรียบร้อยแล้ว!`);
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`ยืนยันลบบัญชีผู้ใช้ "${username}" หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('ลบผู้ใช้งานสำเร็จ');
        setUsers(users.filter((u) => u._id !== id));
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จัดการผู้ใช้งานในระบบ</h1>
          <p className="text-sm text-slate-500 mt-1">สิทธิ์สำหรับ Admin ในการเพิ่ม ลบ รีเซ็ตรหัสผ่าน และกำหนดส่วนราชการ/บทบาทผู้ใช้งาน</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          เพิ่มผู้ใช้งานใหม่
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Username</th>
                  <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                  <th className="py-3.5 px-4">ส่วนราชการ</th>
                  <th className="py-3.5 px-4">แผนก / สังกัด</th>
                  <th className="py-3.5 px-4 text-center">บทบาท (Role)</th>
                  <th className="py-3.5 px-4">วันที่สร้าง</th>
                  <th className="py-3.5 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">@{u.username}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{u.name}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{u.agency || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{u.department || '-'}</td>
                    <td className="py-3.5 px-4 text-center">
                      {u.role === 'admin' ? (
                        <span className="px-2.5 py-1 text-xs font-black rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase">
                          ADMIN
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 uppercase">
                          STAFF
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('th-TH')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleResetPassword(u._id, u.username)}
                          title="รีเซ็ตรหัสผ่านเป็น tmd1234"
                          className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id, u.username)}
                          title="ลบผู้ใช้งาน"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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
        ) : (
          <div className="text-center py-16 text-slate-400">ยังไม่มีผู้ใช้งานในระบบ</div>
        )}
      </div>

      {/* Modal Create User */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              เพิ่มผู้ใช้งานใหม่
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น user001"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="กำหนดรหัสผ่าน"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  ชื่อ - นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นายสมชาย สายเทค"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  ส่วนราชการ (กอง / สำนัก / ศูนย์)
                </label>
                <select
                  value={formData.agency}
                  onChange={(e) => {
                    const selectedDivName = e.target.value;
                    const selectedDiv = divisions.find((d) => d.name === selectedDivName);
                    setFormData({
                      ...formData,
                      agency: selectedDivName,
                      department: selectedDiv?.subDivisions[0] || '',
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                >
                  <option value="">-- เลือกส่วนราชการ --</option>
                  {divisions.map((div) => (
                    <option key={div.name} value={div.name}>
                      {div.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  แผนก / สังกัด (ฝ่าย / กลุ่ม / ศูนย์)
                </label>
                {currentSubDivisions.length > 0 ? (
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                  >
                    <option value="">-- เลือกแผนก / สังกัด --</option>
                    {currentSubDivisions.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="เช่น ฝ่ายเทคโนโลยีสารสนเทศ"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">บทบาท (Role)</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'staff' })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="staff">Staff (เจ้าหน้าที่)</option>
                  <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกผู้ใช้'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
