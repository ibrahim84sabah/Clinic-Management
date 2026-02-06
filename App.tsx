
import React, { useState, useEffect, useRef } from 'react';
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConfigMissing, setIsConfigMissing] = useState(false);
  const [notifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const initApp = async () => {
      // 1. فحص الاتصال بقاعدة البيانات بالبيانات الجديدة
      const isConnected = await checkDbConnection();
      
      if (!isConnected) {
        // إذا فشل الاتصال رغم وجود المفاتيح، فقد تكون المشكلة في الـ CORS أو المفتاح نفسه
        console.error("Could not verify Supabase connection.");
        // سنسمح للتطبيق بالاستمرار لعرض صفحة الدخول، حيث سيفشل الدخول هناك أيضاً إذا كان المفتاح خطأ
      }

      // 2. التحقق من وجود جلسة نشطة
      try {
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
        console.warn("Session check skipped.");
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

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
          <div className="absolute top-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-slate-800 font-bold text-lg">DentaGlow Pro</p>
          <p className="text-slate-400 text-sm animate-pulse">جاري الاتصال بالسحاب...</p>
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
    { id: 'inventory', label: 'المخزون والخدمات', icon: ICONS.Inventory, roles: [UserRole.ADMIN, UserRole.DOCTOR] },
    { id: 'accounting', label: 'الحسابات والتقارير', icon: ICONS.Accounting, roles: [UserRole.ADMIN] },
    { id: 'ai', label: 'ذكاء العيادة (AI)', icon: ICONS.AI, roles: [UserRole.ADMIN, UserRole.DOCTOR] },
    { id: 'accounts', label: 'إدارة الموظفين', icon: ICONS.Shield, roles: [UserRole.ADMIN] },
  ];

  const filteredTabs = tabs.filter(tab => tab.roles.includes(userRole));

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={handleTabChange} userRole={userRole} />;
      case 'patients': return <PatientCRM />;
      case 'inventory': return <Inventory />;
      case 'accounting': return <Accounting />;
      case 'ai': return <ClinicAI />;
      case 'accounts': return <AccountManagement />;
      default: return <Dashboard onNavigate={handleTabChange} userRole={userRole} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans" dir="rtl">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 right-0 z-50 bg-white border-l border-slate-200 transition-all duration-300 transform
        lg:translate-x-0 lg:static
        ${isMobileMenuOpen ? 'translate-x-0 w-72' : 'translate-x-full lg:translate-x-0'}
        ${isSidebarOpen ? 'lg:w-64' : 'lg:w-20'}
        flex flex-col shrink-0
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">D</div>
            {(isSidebarOpen || isMobileMenuOpen) && <span className="font-black text-xl text-slate-800 whitespace-nowrap">دينتا جلو</span>}
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {filteredTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-lg font-bold' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              <tab.icon className={`w-6 h-6 shrink-0 ${activeTab === tab.id ? 'text-white' : ''}`} />
              {(isSidebarOpen || isMobileMenuOpen) && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
           <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl">
             <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 border border-indigo-200 shrink-0 text-sm">
               {currentUser?.name.charAt(0)}
             </div>
             {(isSidebarOpen || isMobileMenuOpen) && (
               <div className="flex flex-col text-right overflow-hidden">
                 <span className="text-xs font-bold text-slate-800 truncate">{currentUser?.name}</span>
                 <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{userRole}</span>
               </div>
             )}
           </div>
           
           <button 
             onClick={async () => { await supabase.auth.signOut(); setCurrentUser(null); }}
             className="w-full mt-4 flex items-center gap-3 px-3 py-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors font-bold text-xs"
           >
             <ICONS.Logout className="w-4 h-4 shrink-0" />
             {(isSidebarOpen || isMobileMenuOpen) && <span>تسجيل الخروج</span>}
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.innerWidth < 1024 ? setIsMobileMenuOpen(true) : setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-500"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h2 className="font-bold text-slate-800 text-base">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">مباشر</span>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
