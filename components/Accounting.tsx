
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const Accounting: React.FC = () => {
  const [profitData, setProfitData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totals, setTotals] = useState({ gross: 0, cost: 0, net: 0 });

  useEffect(() => {
    fetchFinancials();
  }, []);

  const fetchFinancials = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('session_profit_analysis')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProfitData(data);
      const calculated = data.reduce((acc, curr) => ({
        gross: acc.gross + Number(curr.total_gross_amount),
        cost: acc.cost + Number(curr.total_consumable_cost) + Number(curr.doctor_commission_amount),
        net: acc.net + Number(curr.net_profit)
      }), { gross: 0, cost: 0, net: 0 });
      setTotals(calculated);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 md:space-y-8 text-right animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">التقارير المالية السحابية</h1>
          <p className="text-slate-400 font-bold text-xs mt-1">تتبع الأرباح، التكاليف، وعمولات الأطباء بدقة.</p>
        </div>
        <button onClick={fetchFinancials} className="w-full md:w-auto bg-indigo-50 text-indigo-600 font-black text-xs px-6 py-3 rounded-2xl hover:bg-indigo-100 transition-all border border-indigo-100">تحديث البيانات</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm border-r-4 border-r-indigo-500">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">إجمالي الإيرادات</p>
          <h3 className="text-2xl md:text-3xl font-black text-slate-800">${totals.gross.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm border-r-4 border-r-rose-500">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">إجمالي التكاليف</p>
          <h3 className="text-2xl md:text-3xl font-black text-rose-600">${totals.cost.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm border-r-4 border-r-emerald-500">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">صافي الربح</p>
          <h3 className="text-2xl md:text-3xl font-black text-emerald-600">${totals.net.toLocaleString()}</h3>
        </div>
      </div>

      <div className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden">
        <h3 className="font-black text-slate-800 mb-6 text-lg">سجل العمليات المالية</h3>
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
             <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-400 font-black text-sm">جاري معالجة البيانات...</p>
          </div>
        ) : profitData.length > 0 ? (
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">المريض</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left whitespace-nowrap">الإيراد</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left whitespace-nowrap">المواد</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left whitespace-nowrap">العمولة</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left whitespace-nowrap">صافي الربح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {profitData.map((row, i) => (
                    <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-6 py-5 font-black text-slate-800 whitespace-nowrap">{row.patient_name}</td>
                      <td className="px-6 py-5 text-left font-bold text-slate-600 whitespace-nowrap">${row.total_gross_amount}</td>
                      <td className="px-6 py-5 text-left text-slate-400 whitespace-nowrap">${row.total_consumable_cost}</td>
                      <td className="px-6 py-5 text-left text-slate-400 whitespace-nowrap">${row.doctor_commission_amount}</td>
                      <td className="px-6 py-5 text-left font-black text-emerald-600 whitespace-nowrap">+${row.net_profit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400 italic font-black text-sm">لا توجد بيانات مالية مسجلة بعد.</div>
        )}
      </div>
    </div>
  );
};

export default Accounting;
