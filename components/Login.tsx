
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../services/supabase';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dbStatus, setDbStatus] = useState<'CHECKING' | 'READY' | 'EMPTY' | 'ERROR'>('CHECKING');

  // تشخيص حالة قاعدة البيانات عند فتح الشاشة
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const { data, count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error("DB Diagnostic Error:", error);
          setDbStatus('ERROR');
          return;
        }

        if (count === 0) {
          setDbStatus('EMPTY');
        } else {
          setDbStatus('READY');
        }
      } catch (err) {
        setDbStatus('ERROR');
      }
    };
    checkDatabase();
  }, []);

  const createEmergencyAdmin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { error: insertError } = await supabase.from('profiles').insert([
        {
          username: 'admin',
          name: 'المدير العام (افتراضي)',
          role: UserRole.ADMIN,
          password_plain: 'admin123'
        }
      ]);

      if (insertError) throw insertError;
      
      setDbStatus('READY');
      setError('تم إنشاء حساب المدير بنجاح! يمكنك الدخول الآن.');
    } catch (err: any) {
      setError('فشل الإنشاء التلقائي: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanUsername = username.trim().toLowerCase();

    try {
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', cleanUsername)
        .eq('password_plain', password)
        .maybeSingle();

      if (profileErr) throw profileErr;

      if (!profile) {
        throw new Error('بيانات الدخول غير صحيحة. تأكد من المعرف وكلمة المرور.');
      }

      onLogin({
        id: profile.id,
        username: profile.username,
        name: profile.name,
        role: profile.role as UserRole
      });

    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء محاولة الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-500">
        <div className="p-10 bg-indigo-600 text-white text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/30 shadow-2xl">
              <span className="text-4xl font-black tracking-tighter">I</span>
            </div>
            <h1 className="text-3xl font-black mb-2 tracking-tight">مستشفى ابراهيم</h1>
            <p className="text-indigo-100 text-sm font-bold italic opacity-80">نظام الإدارة السحابي الموحد</p>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl opacity-50"></div>
        </div>
        
        <div className="p-10 space-y-6 text-right">
          {dbStatus === 'EMPTY' && (
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-[1.5rem] mb-4 animate-bounce">
              <p className="text-amber-800 text-xs font-black text-center mb-3 leading-relaxed">
                قاعدة البيانات فارغة حالياً. هل ترغب في تفعيل حساب المدير الافتراضي؟
              </p>
              <button 
                onClick={createEmergencyAdmin}
                className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-black text-[11px] hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
              >
                تفعيل حساب Admin / admin123
              </button>
            </div>
          )}

          <div className="text-center mb-4">
            <h2 className="text-slate-800 font-black text-xl">تسجيل الدخول</h2>
            <p className="text-slate-400 text-[10px] font-black mt-1 uppercase tracking-widest">ادخل بيانات الموظف</p>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-[11px] font-black border border-rose-100 animate-shake flex items-center gap-3">
              <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span className="leading-tight">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">المعرف الوظيفي (ID)</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="admin" 
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-black text-right transition-all placeholder:text-slate-300" 
                  required 
                  dir="ltr" 
                />
                <span className="absolute left-4 top-4 text-slate-300 font-black">@</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">كلمة المرور</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="admin123" 
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-black text-right transition-all placeholder:text-slate-300" 
                required 
                dir="ltr" 
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98] mt-4"
            >
              {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'دخول النظام'}
            </button>
          </form>
          
          <div className="text-center pt-4 border-t border-slate-50">
             <p className="text-[10px] text-slate-300 font-bold leading-relaxed">
               نظام Ibrahim Hospital v3.0 • حالة السحابة: {dbStatus === 'READY' ? 'متصلة وجاهزة' : dbStatus === 'EMPTY' ? 'بانتظار التهيئة' : 'خطأ في الربط'}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
