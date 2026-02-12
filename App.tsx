
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { ICONS } from './constants';
import { supabase, checkDbConnection } from './services/supabase';
import Dashboard from './components/Dashboard';
import PatientCRM from './components/PatientCRM';
import Inventory from './components/Inventory';
import Accounting from './components/Accounting';
import Login from './components/Login';
import AccountManagement from './components/AccountManagement';
import Appointments from './components/Appointments';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        const isConnected = await checkDbConnection();
        if (!isConnected) {
          setConnectionError(true);
        }

        // استعادة الجلسة
        const savedUser = localStorage.getItem('denta_user_session');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          // التأكد من أن المستخدم ما زال موجوداً وبنفس البيانات
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          
          if (data) {
            setCurrentUser({
              id: data.id,
              username: data.username,
              name: data.name,
              role: data.role as UserRole
            });
          } else {
            localStorage.removeItem('denta_user_session');
          }
        }
      } catch (err) {
        console.error("Session restoration failed:", err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initApp();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('denta_user_session');
    setCurrentUser(null);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('denta_user_session', JSON.stringify(user));
  };

  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 p-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
          <div className="absolute top-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-slate-800 font-black text-xl tracking-tight">DentaGlow Pro</p>
          <p className="text-slate-400 text-sm animate-pulse font-medium">جاري المزامنة السحابية...</p>
        </div>
      </div>
    );
  }

  if (connectionError && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-right">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl text-center space-y-4 border border-slate-100">
          <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800">انقطع الاتصال بالسحاب</h2>
          <p className="text-slate-500 text-sm leading-relaxed font-bold">يرجى التأكد من اتصال الإنترنت أو إعدادات Supabase.</p>
          <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-xl transition-all">إعادة المحاولة</button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const tabs = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: ICONS.Dashboard, roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST] },
    { id: 'appointments', label: 'المواعيد', icon: ICONS.Calendar, roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST] },
    { id: 'patients', label: 'إدارة المرضى', icon: ICONS.Users, roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST] },
    { id: 'inventory', label: 'المخزون', icon: ICONS.Inventory, roles: [UserRole.ADMIN, UserRole.RECEPTIONIST] },
    { id: 'accounting', label: 'المحاسبة', icon: ICONS.Accounting, roles: [UserRole.ADMIN] },
    { id: 'accounts', label: 'الموظفين', icon: ICONS.Shield, roles: [UserRole.ADMIN] },
  ];

  const filteredTabs = tabs.filter(tab => tab.roles.includes(currentUser.role));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans" dir="rtl">
      <aside className={`bg-white border-l border-slate-200 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} hidden lg:flex flex-col shrink-0 shadow-sm`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white font-black text-xl">D</span>
          </div>
          {isSidebarOpen && <span className="font-black text-slate-800 text-xl tracking-tight">DentaGlow</span>}
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto no-scrollbar">
          {filteredTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <tab.icon className="w-6 h-6 shrink-0" />
              {isSidebarOpen && <span className="font-black text-sm">{tab.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
           <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-rose-400 hover:bg-rose-50 rounded-2xl transition-all">
             <ICONS.Logout className="w-6 h-6 shrink-0" />
             {isSidebarOpen && <span className="font-black text-sm">تسجيل الخروج</span>}
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="text-left hidden xs:block">
              <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">{currentUser.role === UserRole.ADMIN ? 'مدير' : currentUser.role === UserRole.DOCTOR ? 'طبيب' : 'استقبال'}</p>
              <p className="text-sm font-black text-slate-800 leading-none">{currentUser.name}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border-2 border-white shadow-sm flex items-center justify-center font-black text-indigo-600 text-sm">
              {currentUser.name.charAt(0)}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">
            {activeTab === 'dashboard' && <Dashboard onNavigate={navigateTo} userRole={currentUser.role} />}
            {activeTab === 'appointments' && <Appointments currentUser={currentUser} />}
            {activeTab === 'patients' && <PatientCRM />}
            {activeTab === 'inventory' && <Inventory />}
            {activeTab === 'accounting' && <Accounting />}
            {activeTab === 'accounts' && <AccountManagement />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
