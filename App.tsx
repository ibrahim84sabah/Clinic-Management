
import React, { useState, useEffect } from 'react';
import { User, UserRole, Notification } from './types';
import { ICONS } from './constants';
import { supabase, checkDbConnection } from './services/supabase';
import Dashboard from './components/Dashboard';
import PatientCRM from './components/PatientCRM';
import Inventory from './components/Inventory';
import Accounting from './components/Accounting';
import ClinicAI from './components/ClinicAI';
import Login from './components/Login';
import AccountManagement from './components/AccountManagement';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications] = useState<Notification[]>([]);

  // Initialize application and handle authentication state
  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. Check if we can reach Supabase
        const isConnected = await checkDbConnection();
        if (!isConnected) {
          setConnectionError(true);
        }

        // 2. Refresh session if exists
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser({
            id: session.user.id,
            username: session.user.email || '',
            name: session.user.user_metadata?.name || 'مستخدم العيادة',
            role: (session.user.user_metadata?.role as UserRole) || UserRole.RECEPTIONIST
          });
        }
      } catch (err) {
        console.error("App startup failed:", err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          username: session.user.email || '',
          name: session.user.user_metadata?.name || 'مستخدم العيادة',
          role: (session.user.user_metadata?.role as UserRole) || UserRole.RECEPTIONIST
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
          <div className="absolute top-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-slate-800 font-bold text-lg">DentaGlow Pro</p>
          <p className="text-slate-400 text-sm animate-pulse">جاري التحقق من الاتصال بالسحاب...</p>
        </div>
      </div>
    );
  }

  // Handle case where Supabase is unreachable (wrong keys or CORS)
  if (connectionError && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800">خطأ في الاتصال بالسحاب</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            تعذر الاتصال بقاعدة بيانات Supabase. يرجى التأكد من أن رابط المشروع والمفاتيح صحيحة في إعدادات Vercel، وتأكد من إضافة رابط هذا الموقع إلى قائمة الـ CORS في Supabase.
          </p>
          <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">إعادة المحاولة</button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={(user) => setCurrentUser(user)} />;
  }

  const userRole = currentUser.role;

  const tabs = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: ICONS.Dashboard, roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST] },
    { id: 'patients', label: 'إدارة المرضى', icon: ICONS.Users, roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST] },
    { id: 'inventory', label: 'المخزون', icon: ICONS.Inventory, roles: [UserRole.ADMIN, UserRole.RECEPTIONIST] },
    { id: 'accounting', label: 'المحاسبة', icon: ICONS.Accounting, roles: [UserRole.ADMIN] },
    { id: 'ai', label: 'الذكاء الاصطناعي', icon: ICONS.AI, roles: [UserRole.ADMIN, UserRole.DOCTOR] },
    { id: 'accounts', label: 'الموظفين', icon: ICONS.Shield, roles: [UserRole.ADMIN] },
  ];

  const filteredTabs = tabs.filter(tab => tab.roles.includes(userRole));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans" dir="rtl">
      {/* Sidebar */}
      <aside className={`bg-white border-l border-slate-200 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} hidden lg:flex flex-col`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white font-black text-xl">D</span>
          </div>
          {isSidebarOpen && <span className="font-black text-slate-800 text-xl tracking-tight">DentaGlow</span>}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {filteredTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <tab.icon className="w-6 h-6 shrink-0" />
              {isSidebarOpen && <span className="font-bold text-sm">{tab.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-3 p-3 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
           >
             <ICONS.Logout className="w-6 h-6 shrink-0" />
             {isSidebarOpen && <span className="font-bold text-sm">تسجيل الخروج</span>}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 shrink-0">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden lg:block text-slate-400 hover:text-slate-600">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">{currentUser.role === UserRole.ADMIN ? 'مدير' : currentUser.role === UserRole.DOCTOR ? 'طبيب' : 'استقبال'}</p>
              <p className="text-sm font-black text-slate-800 leading-none">{currentUser.name}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center font-bold text-indigo-600 shrink-0">
              {currentUser.name.charAt(0)}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} userRole={userRole} />}
          {activeTab === 'patients' && <PatientCRM />}
          {activeTab === 'inventory' && <Inventory />}
          {activeTab === 'accounting' && <Accounting />}
          {activeTab === 'ai' && <ClinicAI />}
          {activeTab === 'accounts' && <AccountManagement />}
        </div>
      </main>
    </div>
  );
};

// Fix for: Module '"file:///App"' has no default export
export default App;
