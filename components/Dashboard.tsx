
import React, { useEffect, useState } from 'react';
import { UserRole } from '../types';
import { supabase } from '../services/supabase';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  userRole: UserRole;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, userRole }) => {
  const [stats, setStats] = useState([
    { label: 'إجمالي المرضى', value: '...', trend: 'جاري التحميل', color: 'indigo', target: 'patients' },
    { label: 'مرضى جدد (اليوم)', value: '...', trend: 'تحديث فوري', color: 'blue', target: 'patients' },
    { label: 'تنبيهات المخزون', value: '...', trend: 'عناصر حرجة', color: 'orange', target: 'inventory' },
    { label: 'جلسات اليوم', value: '...', trend: 'من السجل', color: 'emerald', target: 'patients' },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      // Get total patients
      const { count: patientCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });
      
      // Get today's new patients
      const today = new Date().toISOString().split('T')[0];
      const { count: newToday } = await supabase.from('patients').select('*', { count: 'exact', head: true }).gte('created_at', today);
      
      // Get low stock items
      const { count: lowStock } = await supabase.from('materials').select('*', { count: 'exact', head: true }).filter('stock_quantity', 'lte', 'order_limit');

      // Get today's invoices (sessions)
      const { count: sessionsToday } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).gte('created_at', today);

      setStats([
        { label: 'إجمالي المرضى', value: (patientCount || 0).toString(), trend: 'منذ البداية', color: 'indigo', target: 'patients' },
        { label: 'مرضى جدد (اليوم)', value: (newToday || 0).toString(), trend: 'تحديث اليوم', color: 'blue', target: 'patients' },
        { label: 'تنبيهات المخزون', value: (lowStock || 0).toString(), trend: 'تحتاج طلب', color: 'orange', target: 'inventory' },
        { label: 'جلسات اليوم', value: (sessionsToday || 0).toString(), trend: 'مكتملة/قائمة', color: 'emerald', target: 'patients' },
      ]);
    };

    fetchStats();
  }, []);

  const visibleStats = stats.filter(stat => {
    if (stat.target === 'inventory' && userRole === UserRole.RECEPTIONIST) return false;
    return true;
  });

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500 text-right">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800">مرحباً بك مجدداً في عيادة دينتا جلو</h1>
          <p className="text-sm lg:text-base text-slate-500">نظرة عامة على البيانات الحية المسترجعة من السحابة.</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl inline-flex items-center gap-2 shadow-sm shadow-indigo-50">
           <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
           <span className="text-xs font-bold text-indigo-700">اتصال Supabase نشط</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {visibleStats.map((stat, i) => (
          <button 
            key={i} 
            onClick={() => onNavigate(stat.target)}
            className="group text-right bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all transform hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-2">
               <p className="text-sm font-medium text-slate-500 group-hover:text-indigo-600 transition-colors">{stat.label}</p>
               <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
               </svg>
            </div>
            <div className="flex items-end gap-2">
              <h3 className="text-xl lg:text-2xl font-bold text-slate-800">{stat.value}</h3>
              <span className={`text-[10px] mb-1 font-medium px-2 py-0.5 rounded-full ${
                stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                stat.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                'bg-slate-50 text-slate-600'
              }`}>
                {stat.trend}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">أحدث الإجراءات الطبية</h3>
            <button onClick={() => onNavigate('patients')} className="text-xs font-bold text-indigo-600 hover:underline">سجل المرضى</button>
          </div>
          <div className="py-10 text-center text-slate-400 italic text-sm">
            يتم جلب البيانات من جدول الفواتير والجلسات...
          </div>
        </div>

        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">تنبيهات ذكية</h3>
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <p className="text-xs font-medium text-amber-800">تحقق من نواقص المخزون في تبويب المستلزمات.</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-3">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <p className="text-xs font-medium text-indigo-800">تأكد من مزامنة بيانات اليوم مع ن8ن للأتمتة.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
