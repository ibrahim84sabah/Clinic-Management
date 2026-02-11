
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../services/supabase';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState(''); // تم التغيير من email إلى username
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.ADMIN);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // وظيفة داخلية لتحويل اسم المستخدم إلى بريد إلكتروني وهمي متوافق مع Supabase
  const formatAsInternalEmail = (id: string) => {
    return `${id.trim().toLowerCase()}@clinic.id`;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const internalEmail = formatAsInternalEmail(username);

    try {
      if (isSignUp) {
        // التحقق من صحة اسم المستخدم (لا يسمح بالمسافات)
        if (username.includes(' ')) {
          throw new Error('اسم المستخدم لا يجب أن يحتوي على مسافات');
        }

        const { data, error: authError } = await supabase.auth.signUp({
          email: internalEmail,
          password,
          options: {
            data: {
              name: name || 'مستخدم جديد',
              role: role,
              username: username.trim().toLowerCase()
            },
          },
        });

        if (authError) throw authError;

        if (data.user && data.session === null) {
          setSuccess('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول باستخدام الـ ID الخاص بك.');
          setIsSignUp(false);
        } else if (data.user && data.session) {
          onLogin({
            id: data.user.id,
            username: username.trim().toLowerCase(),
            name: data.user.user_metadata?.name || 'مستخدم جديد',
            role: (data.user.user_metadata?.role as UserRole) || UserRole.RECEPTIONIST
          });
        }
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: internalEmail,
          password,
        });

        if (authError) {
          if (authError.message === 'Invalid login credentials') {
            throw new Error('اسم المستخدم (ID) أو كلمة المرور غير صحيحة.');
          }
          throw authError;
        }

        if (data.user) {
          onLogin({
            id: data.user.id,
            username: username.trim().toLowerCase(),
            name: data.user.user_metadata?.name || 'مستخدم العيادة',
            role: (data.user.user_metadata?.role as UserRole) || UserRole.RECEPTIONIST
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ ما أثناء المصادقة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-500">
        <div className="p-8 bg-indigo-600 text-white text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30 shadow-xl">
              <span className="text-3xl font-black tracking-tighter">D</span>
            </div>
            <h1 className="text-2xl font-black">بوابة عيادة دنتـا</h1>
            <p className="text-indigo-100 text-sm mt-1 font-medium italic">نظام الدخول الموحد (ID Login)</p>
          </div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-indigo-400/20 rounded-full blur-xl"></div>
        </div>
        
        <form onSubmit={handleAuth} className="p-8 space-y-5 text-right">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-2">
            <button 
              type="button"
              onClick={() => { setIsSignUp(false); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 text-[11px] font-black rounded-xl transition-all uppercase tracking-wider ${!isSignUp ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              تسجيل الدخول
            </button>
            <button 
              type="button"
              onClick={() => { setIsSignUp(true); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 text-[11px] font-black rounded-xl transition-all uppercase tracking-wider ${isSignUp ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              إنشاء حساب موظف
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-[11px] font-black border border-rose-100 animate-shake flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-[11px] font-black border border-emerald-100 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {success}
            </div>
          )}

          {isSignUp && (
            <div className="space-y-4 animate-in slide-in-from-top-2">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-1.5 mr-1 uppercase tracking-widest">الاسم الوظيفي</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="د. سارة جونسون"
                  className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-right text-sm font-bold"
                  required={isSignUp}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-1.5 mr-1 uppercase tracking-widest">المستوى الإداري</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-right text-sm font-bold appearance-none"
                >
                  <option value={UserRole.ADMIN}>مدير النظام (Full Access)</option>
                  <option value={UserRole.DOCTOR}>طبيب (Clinical Access)</option>
                  <option value={UserRole.RECEPTIONIST}>استقبال (Reception Access)</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-1.5 mr-1 uppercase tracking-widest">اسم المستخدم (ID)</label>
            <div className="relative">
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثال: dr_ahmed"
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-right text-sm font-black tracking-tight"
                required
                dir="ltr"
              />
              <svg className="w-5 h-5 absolute left-4 top-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-1.5 mr-1 uppercase tracking-widest">كلمة المرور</label>
            <div className="relative">
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-right text-sm font-black"
                required
                dir="ltr"
              />
              <svg className="w-5 h-5 absolute left-4 top-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              isSignUp ? 'تفعيل حساب الموظف' : 'دخول النظام'
            )}
          </button>
          
          <p className="text-[10px] text-slate-400 text-center font-bold">
            نظام DentaGlow Pro v2.1.0 • مشفر سحابياً
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
