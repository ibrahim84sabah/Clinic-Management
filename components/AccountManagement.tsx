
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ICONS } from '../constants';

const AccountManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    { id: '1', username: 'admin', name: 'مدير النظام', role: UserRole.ADMIN },
    { id: '2', username: 'doctor', name: 'د. سارة جونسون', role: UserRole.DOCTOR },
    { id: '3', username: 'recep', name: 'أحمد محمود', role: UserRole.RECEPTIONIST },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', role: UserRole.DOCTOR, password: '' });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const id = (users.length + 1).toString();
    setUsers([...users, { ...newUser, id }]);
    setShowAddModal(false);
    setNewUser({ name: '', username: '', role: UserRole.DOCTOR, password: '' });
  };

  const deleteUser = (id: string) => {
    if (id === '1') return alert('لا يمكن حذف حساب المدير الرئيسي');
    setUsers(users.filter(u => u.id !== id));
  };

  return (
    <div className="space-y-6 text-right animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">إدارة حسابات الموظفين</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          إضافة حساب جديد
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الاسم الكامل</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">اسم المستخدم</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الدور الوظيفي</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الحالة</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      {user.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-800">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 font-medium">{user.username}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    user.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-600' : 
                    user.role === UserRole.DOCTOR ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {user.role === UserRole.ADMIN ? 'مدير' : user.role === UserRole.DOCTOR ? 'طبيب' : 'استقبال'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    نشط
                  </div>
                </td>
                <td className="px-6 py-4 text-left">
                  <button 
                    onClick={() => deleteUser(user.id)}
                    className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl font-bold mb-6 text-slate-800">إضافة حساب موظف جديد</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">الاسم الكامل</label>
                <input 
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">اسم المستخدم</label>
                <input 
                  type="text"
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">الدور الوظيفي</label>
                <select 
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={UserRole.DOCTOR}>طبيب</option>
                  <option value={UserRole.RECEPTIONIST}>استقبال</option>
                  <option value={UserRole.ADMIN}>مدير</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">كلمة المرور</label>
                <input 
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                >
                  حفظ الحساب
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
