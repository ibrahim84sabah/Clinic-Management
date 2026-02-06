
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../services/supabase';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.ADMIN);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || 'مستخدم جديد',
              role: role,
            },
          },
        });

        if (authError) throw authError;

        if (data.user && data.session === null) {
          setSuccess('تم إنشاء الحساب! إذا لم تستطع الدخول، تأكد من تعطيل (Confirm Email) في إعدادات Supabase أو تفقد بريدك.');
          setIsSignUp(false);
        } else if (data.user && data.session) {
          onLogin({
            id: data.user.id,
            username: data.user.email || '',
            name: data.user.user_metadata?.name || 'مستخدم جديد',
            role: (data.user.user_metadata?.role as UserRole) || UserRole.RECEPTIONIST
          });
        }
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          if (authError.message.includes('Email not confirmed')) {
            throw new Error('البريد الإلكتروني لم يتم تفعيله بعد. يرجى تعطيل خاصية "Confirm Email" من لوحة تحكم Supabase في قسم Auth -> Providers.');
          }
          if (authError.message === 'Invalid login credentials') {
            throw new Error('بيانات الاعتماد غير صالحة. تأكد من البريد وكلمة المرور.');
          }
          throw authError;
        }

        if (data.user) {
          onLogin({
            id: data.user.id,
            username: data.user.email || '',
            name: data.user.user_metadata?.name || 'مستخدم العيادة',
            role: (data.user.user_metadata?.role as UserRole) || UserRole.RECEPTIONIST
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ ما');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-500">
        <div className="p-8 bg-indigo-600 text-white text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <span className="text-3xl font-black">D</span>
            </div>
            <h1 className="text-2xl font-black">عيادة دينتا جلو</h1>
            <p className="text-indigo-100 text-sm mt-1 font-medium">نظام الإدارة السحابي المتكامل</p>
          </div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-indigo-400/20 rounded-full blur-xl"></div>
        </div>
        
        <form onSubmit={handleAuth} className="p-8 space-y-5 text-right">
          <div className="flex bg-slate-100 p-1 rounded-xl mb-2">
            <button 
              type="button"
              onClick={() => { setIsSignUp(false); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isSignUp ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              تسجيل الدخول
            </button>
            <button 
              type="button"
              onClick={() => { setIsSignUp(true); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isSignUp ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              إنشاء حساب جديد
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-xs font-bold border border-rose-100 animate-shake">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-xs font-bold border border-emerald-100">
              {success}
            </div>
          )}

          {isSignUp && (
            <div className="space-y-4 animate-in slide-in-from-top-2">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5 mr-1">الاسم الكامل</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً: د. أحمد خالد"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-right text-sm"
                  required={isSignUp}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5 mr-1">الدور الوظيفي</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-right text-sm"
                >
                  <option value={UserRole.ADMIN}>مدير (Admin)</option>
                  <option value={UserRole.DOCTOR}>طبيب (Doctor)</option>
                  <option value={UserRole.RECEPTIONIST}>استقبال (Receptionist)</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-slate-500 mb-1.5 mr-1">البريد الإلكتروني</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@clinic.com"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-right text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 mb-1.5 mr-1">كلمة المرور</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-right text-sm"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'
            )}
          </button>
          
          {!isSignUp && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
               <p className="text-[10px] text-blue-700 font-bold leading-relaxed text-center">
                 تنبيه: إذا قمت بإنشاء حساب جديد وظهرت لك رسالة "Waiting for verification" في Supabase، يرجى تعطيل خيار "Confirm Email" من إعدادات الموقع لتتمكن من الدخول فوراً.
               </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
