
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../services/supabase';

const AccountManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', role: UserRole.DOCTOR, password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    // ملاحظة: جلب قائمة المستخدمين الفعلية من Supabase Auth يتطلب Edge Function
    // هنا سنعرض قائمة تجريبية أو نعتمد على جدول مخصص إذا توفر
    setUsers([
      { id: '1', username: 'admin', name: 'مدير النظام الرئيسي', role: UserRole.ADMIN },
      { id: '2', username: 'dr_sara', name: 'د. سارة جونسون', role: UserRole.DOCTOR },
      { id: '3', username: 'ahmed_recep', name: 'أحمد محمود', role: UserRole.RECEPTIONIST },
    ]);
    setIsLoading(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newUser.username.includes(' ')) {
      setError('المعرف (ID) يجب ألا يحتوي على مسافات');
      return;
    }

    try {
      // عملية إنشاء الحساب تتم عادةً عبر شاشة الدخول (Signup) أو عبر Admin API
      // في النسخة الحالية سنقوم بمحاكاة الإضافة
      const id = Math.random().toString(36).substr(2, 9);
      setUsers([...users, { ...newUser, id }]);
      setShowAddModal(false);
      setNewUser({ name: '', username: '', role: UserRole.DOCTOR, password: '' });
      alert("تمت محاكاة إضافة المستخدم. في النظام الحقيقي، اطلب من الموظف إنشاء حسابه من شاشة 'إنشاء حساب' بالـ ID المعتمد.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteUser = (id: string) => {
    if (id === '1') return alert('لا يمكن حذف حساب المدير الرئيسي المضمن');
    if (confirm('هل أنت متأكد من تعطيل هذا الحساب؟')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-8 text-right animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة الكادر الوظيفي</h1>
          <p className="text-slate-500 font-medium italic">إدارة معرفات الموظفين وصلاحيات الدخول.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2 justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          تسجيل موظف جديد
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[700px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">الموظف</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">المعرف (ID)</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">الصلاحية</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">حالة الدخول</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-lg border-2 border-white shadow-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-800">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">كادر العيادة</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <code className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-black text-indigo-600" dir="ltr">
                      @{user.username}
                    </code>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-xl border ${
                      user.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                      user.role === UserRole.DOCTOR ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                    }`}>
                      {user.role === UserRole.ADMIN ? 'مدير عام' : user.role === UserRole.DOCTOR ? 'طبيب' : 'موظف استقبال'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      مفعل
                    </div>
                  </td>
                  <td className="px-8 py-6 text-left">
                    <button 
                      onClick={() => deleteUser(user.id)}
                      className="text-slate-300 hover:text-rose-500 p-2 rounded-xl hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 text-right">
            <h2 className="text-2xl font-black text-slate-800 mb-6">إعداد حساب موظف</h2>
            {error && <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100">{error}</div>}
            
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">الاسم الكامل</label>
                <input 
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">المعرف المعتمد (ID)</label>
                <input 
                  type="text"
                  required
                  dir="ltr"
                  placeholder="مثال: dr_ahmed"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                  className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-black tracking-tight"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">الصلاحية</label>
                <select 
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                  className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold bg-white"
                >
                  <option value={UserRole.DOCTOR}>طبيب</option>
                  <option value={UserRole.RECEPTIONIST}>استقبال</option>
                  <option value={UserRole.ADMIN}>مدير عام</option>
                </select>
              </div>
              <div className="pt-6 flex flex-col gap-3">
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-xl transition-all"
                >
                  تجهيز الحساب
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-full text-slate-400 font-bold py-2 hover:text-slate-600 transition-colors"
                >
                  إلغاء العملية
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
