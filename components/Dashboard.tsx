
import React, { useEffect, useState } from 'react';
import { UserRole } from '../types';
import { supabase } from '../services/supabase';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  userRole: UserRole;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, userRole }) => {
  const [stats, setStats] = useState([
    { label: 'إجمالي المرضى', value: '0', trend: 'تحديث سحابي', color: 'indigo', target: 'patients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { label: 'نواقص المخزون', value: '0', trend: 'مستلزمات حرجة', color: 'rose', target: 'inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { label: 'صافي ربح اليوم', value: '$0', trend: 'أرباح صافية', color: 'emerald', target: 'accounting', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'جلسات اليوم', value: '0', trend: 'مواعيد مكتملة', color: 'blue', target: 'patients', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLiveStats = async () => {
      setIsLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];

        const { count: patientCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });
        
        const { count: lowStockCount } = await supabase.from('materials')
          .select('*', { count: 'exact', head: true })
          .filter('stock_quantity', 'lte', 'order_limit')
          .eq('type', 'CONSUMABLE');

        const { data: profitData } = await supabase.from('session_profit_analysis')
          .select('net_profit')
          .gte('created_at', today);
        
        const todayNet = profitData?.reduce((sum, item) => sum + Number(item.net_profit), 0) || 0;

        const { count: sessionsToday } = await supabase.from('invoices')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today);

        setStats([
          { ...stats[0], value: (patientCount || 0).toString() },
          { ...stats[1], value: (lowStockCount || 0).toString() },
          { ...stats[2], value: `$${todayNet.toLocaleString()}` },
          { ...stats[3], value: (sessionsToday || 0).toString() },
        ]);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveStats();
  }, []);

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 text-right">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">نظرة عامة على العيادة</h1>
          <p className="text-slate-500 font-bold text-sm italic">بيانات حية مباشرة من محرك السحابة.</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl flex items-center gap-2.5 shadow-sm self-start">
           <span className="relative flex h-2.5 w-2.5">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
           </span>
           <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">تزامن السحاب نشط</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        {stats.map((stat, i) => (
          <button 
            key={i} 
            onClick={() => onNavigate(stat.target)}
            className="group relative bg-white p-5 md:p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 hover:border-indigo-500 hover:shadow-indigo-100 transition-all transform hover:-translate-y-1 text-right overflow-hidden"
          >
            <div className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
              stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
              stat.color === 'rose' ? 'bg-rose-50 text-rose-600' :
              stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
            }`}>
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={stat.icon} /></svg>
            </div>
            <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                {isLoading ? '...' : stat.value}
              </h3>
              <span className="text-[9px] md:text-[10px] font-black text-slate-300">{stat.trend}</span>
            </div>
            
            <div className="absolute top-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
               <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:gap-8">
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/20">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-black text-slate-800">تحليل الأداء المالي</h3>
            <span className="px-3 py-1 bg-slate-50 text-[9px] font-black text-slate-400 rounded-lg uppercase tracking-widest">تحديث يومي</span>
          </div>
          <div className="h-64 md:h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-50 rounded-[2rem] bg-slate-50/30">
             <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mb-4 shadow-sm">
                <svg className="w-7 h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
             </div>
             <p className="text-slate-400 text-xs md:text-sm font-black italic">تحليلات الأداء ستظهر بمجرد اكتمال البيانات الجلسات.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
