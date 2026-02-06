
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
    // Fetching from the VIEW we defined in schema.sql
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
    <div className="space-y-8 text-right animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">تحليلات الأرباح السحابية</h1>
        <button onClick={fetchFinancials} className="text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-lg">تحديث البيانات</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-r-4 border-r-indigo-500">
          <p className="text-slate-500 text-sm font-medium mb-1">إجمالي الإيرادات (Gross)</p>
          <h3 className="text-3xl font-bold text-slate-800">${totals.gross.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-r-4 border-r-red-500">
          <p className="text-slate-500 text-sm font-medium mb-1">إجمالي التكاليف (العمولات + المواد)</p>
          <h3 className="text-3xl font-bold text-red-600">${totals.cost.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-r-4 border-r-emerald-500">
          <p className="text-slate-500 text-sm font-medium mb-1">صافي الربح المكتسب (Net)</p>
          <h3 className="text-3xl font-bold text-emerald-600">${totals.net.toLocaleString()}</h3>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <h3 className="font-bold text-slate-800 mb-6">تفاصيل أرباح الجلسات (بناءً على التكلفة الحقيقية)</h3>
        {isLoading ? (
          <div className="py-20 flex justify-center"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : profitData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold">
                <tr>
                  <th className="px-4 py-3">المريض</th>
                  <th className="px-4 py-3 text-left">الإيراد</th>
                  <th className="px-4 py-3 text-left">تكلفة المواد</th>
                  <th className="px-4 py-3 text-left">عمولة الطبيب</th>
                  <th className="px-4 py-3 text-left">صافي الربح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profitData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-bold text-slate-700">{row.patient_name}</td>
                    <td className="px-4 py-4 text-left font-medium">${row.total_gross_amount}</td>
                    <td className="px-4 py-4 text-left text-slate-400">-${row.total_consumable_cost}</td>
                    <td className="px-4 py-4 text-left text-slate-400">-${row.doctor_commission_amount}</td>
                    <td className="px-4 py-4 text-left font-bold text-emerald-600">+${row.net_profit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400 italic font-medium">لا توجد بيانات مالية مسجلة بعد.</div>
        )}
      </div>
    </div>
  );
};

export default Accounting;
