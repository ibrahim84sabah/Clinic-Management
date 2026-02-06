
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, Notification } from './types';
import { ICONS } from './constants';
import { supabase } from './services/supabase';
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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'تنبيه مخزون', message: 'وصل رصيد "إبر 1سم" إلى الحد الأدنى (15 قطعة)', time: 'منذ 5 دقائق', type: 'ALERT', read: false },
    { id: '2', title: 'موعد قادم', message: 'أليس فريمان لديها موعد فيلر بعد 30 دقيقة', time: 'منذ ساعة', type: 'INFO', read: false },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    // Check initial session
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (data.session?.user) {
          setCurrentUser({
            id: data.session.user.id,
            username: data.session.user.email || '',
            name: data.session.user.user_metadata?.name || 'مستخدم العيادة',
            role: (data.session.user.user_metadata?.role as UserRole) || UserRole.RECEPTIONIST
          });
        }
      } catch (err) {
        console.warn("Supabase auth check skipped or failed. This usually means environment variables are not yet configured.", err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse">جاري التحقق من الهوية...</p>
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
    const canAccess = filteredTabs.some(t => t.id === id);
    if (canAccess) {
      setActiveTab(id);
    }
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden" dir="rtl">
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
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
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">D</div>
            {(isSidebarOpen || isMobileMenuOpen) && <span className="font-bold text-xl tracking-tight">دينتا جلو</span>}
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {filteredTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                activeTab === tab.id 
                ? 'bg-indigo-50 text-indigo-700 font-medium' 
                : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-6 h-6 shrink-0" />
              {(isSidebarOpen || isMobileMenuOpen) && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
           <div className="flex items-center gap-3 px-3 py-2">
             <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-100">
               <img src={`https://i.pravatar.cc/100?u=${currentUser.username}`} alt="User" />
             </div>
             {(isSidebarOpen || isMobileMenuOpen) && (
               <div className="flex flex-col text-right">
                 <span className="text-sm font-semibold truncate">{currentUser.name}</span>
                 <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                   {userRole === UserRole.ADMIN ? 'مدير النظام' : userRole === UserRole.DOCTOR ? 'طبيب' : 'استقبال'}
                 </span>
               </div>
             )}
           </div>
           
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
           >
             <ICONS.Logout className="w-5 h-5 shrink-0" />
             {(isSidebarOpen || isMobileMenuOpen) && <span className="text-sm font-medium">تسجيل الخروج</span>}
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.innerWidth < 1024 ? setIsMobileMenuOpen(true) : setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <h2 className="lg:hidden font-bold text-slate-800 truncate">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors relative"
              >
                <ICONS.Bell className={`w-6 h-6 transition-colors ${unreadCount > 0 ? 'text-indigo-600' : 'text-slate-400'}`} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            
            <div className="hidden sm:block w-px h-6 bg-slate-200" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">حالة الربط السحابي:</span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
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
