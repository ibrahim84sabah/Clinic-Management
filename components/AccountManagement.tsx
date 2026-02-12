
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../services/supabase';

const AccountManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', role: UserRole.DOCTOR, password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setUsers(data);
    } catch (err: any) {
      console.error("Error fetching users:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cleanUsername = newUser.username.trim().toLowerCase().replace(/\s/g, '');

    if (!cleanUsername) {
      setError('يرجى إدخال معرف الموظف');
      return;
    }

    if (newUser.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 خانات على الأقل');
      return;
    }

    setIsSubmitting(true);
    try {
      // حفظ الموظف في جدول البروفايلات
      const { data, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          username: cleanUsername,
          name: newUser.name.trim(),
          role: newUser.role,
          password_plain: newUser.password
        }])
        .select();

      if (profileError) {
        if (profileError.message.includes('unique_violation')) {
          throw new Error('هذا المعرف (ID) مستخدم بالفعل لموظف آخر.');
        }
        throw profileError;
      }

      // تحديث الواجهة فوراً بجلب البيانات من السحابة
      await fetchUsers();
      
      setShowAddModal(false);
      setNewUser({ name: '', username: '', role: UserRole.DOCTOR, password: '' });
      alert(`تم تسجيل الموظف ${newUser.name} بنجاح في قاعدة البيانات.`);
    } catch (err: any) {
      setError(err.message || 'فشل في حفظ البيانات السحابية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteUser = async (id: string, username: string) => {
    if (username === 'admin') return alert('لا يمكن حذف حساب المدير الرئيسي');
    if (confirm(`هل أنت متأكد من حذف حساب @${username} نهائياً؟`)) {
      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        setUsers(users.filter(u => u.id !== id));
      } catch (err: any) {
        alert("خطأ في الحذف: " + err.message);
      }
    }
  };

  return (
    <div className="space-y-8 text-right animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">إدارة الكادر الوظيفي</h1>
          <p className="text-slate-500 font-medium italic text-sm">إدارة المعرفات وكلمات المرور المربوطة بسحابة العيادة.</p>
        </div>
        <button 
          onClick={() => { setError(''); setShowAddModal(true); }}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center gap-2 justify-center transition-all active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          تسجيل موظف جديد
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 overflow-hidden">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
             <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-400 font-black text-sm">جاري جلب بيانات الكادر...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[850px]">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">الموظف</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">المعرف (ID)</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">كلمة المرور</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">الصلاحية</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-lg border-2 border-white shadow-sm shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-800 truncate">{user.name}</p>
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
                      <span className="text-xs font-mono text-slate-400">
                        {(user as any).password_plain || '••••••••'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-xl border ${
                        user.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                        user.role === UserRole.DOCTOR ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                      }`}>
                        {user.role === UserRole.ADMIN ? 'مدير عام' : user.role === UserRole.DOCTOR ? 'طبيب' : 'موظف استقبال'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-left">
                      <button 
                        onClick={() => deleteUser(user.id, user.username)}
                        className="text-slate-300 hover:text-rose-500 p-2 rounded-xl hover:bg-rose-50 transition-all md:opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 text-right my-8">
            <h2 className="text-2xl lg:text-3xl font-black text-slate-800 mb-2">إعداد حساب موظف</h2>
            <p className="text-slate-400 text-xs font-bold mb-8">سيتم الحفظ مباشرة في قاعدة بيانات Supabase.</p>
            
            {error && (
              <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-[11px] font-black border border-rose-100 flex items-center gap-2 animate-shake">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}
            
            <form onSubmit={handleAddUser} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 mr-1 uppercase tracking-widest">الاسم الكامل للموظف</label>
                <input 
                  type="text"
                  required
                  placeholder="مثال: د. ياسين علي"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold bg-slate-50 transition-all placeholder:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 mr-1 uppercase tracking-widest">المعرف الفريد (ID Login)</label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    dir="ltr"
                    placeholder="yassin_dent"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-black tracking-tight bg-slate-50 transition-all placeholder:text-slate-300"
                  />
                  <span className="absolute left-4 top-4 text-slate-300 font-black text-sm">@</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 mr-1 uppercase tracking-widest">كلمة المرور الافتراضية</label>
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  dir="ltr"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-black bg-slate-50 transition-all placeholder:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 mr-1 uppercase tracking-widest">مستوى الصلاحية</label>
                <select 
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-black bg-slate-50 cursor-pointer transition-all"
                >
                  <option value={UserRole.DOCTOR}>طبيب (صلاحيات طبية)</option>
                  <option value={UserRole.RECEPTIONIST}>استقبال (صلاحيات إدارية)</option>
                  <option value={UserRole.ADMIN}>مدير عام (صلاحيات كاملة)</option>
                </select>
              </div>

              <div className="pt-6 flex flex-col gap-3">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white py-4 lg:py-5 rounded-[1.5rem] font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري المزامنة السحابية...' : 'حفظ الموظف في السحابة'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-full text-slate-400 font-black py-2 hover:text-slate-600 transition-colors text-xs"
                >
                  تراجع وإغلاق
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
