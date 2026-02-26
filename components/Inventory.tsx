
import React, { useState, useMemo, useEffect } from 'react';
import { Material, MaterialType } from '../types';
import { supabase } from '../services/supabase';

const Inventory: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'ALL' | MaterialType>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: MaterialType.SERVICE,
    selling_price: '',
    cost_price: '',
    stock_quantity: '0',
    order_limit: '10',
    unit: 'قطعة'
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      if (data) setMaterials(data);
    } catch (err: any) {
      console.error("Fetch error:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return filter === 'ALL' 
      ? materials 
      : materials.filter(item => item.type === filter);
  }, [materials, filter]);

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const costPriceNum = parseFloat(formData.cost_price);
      const sellingPriceNum = parseFloat(formData.selling_price);
      const stockQtyNum = parseInt(formData.stock_quantity);
      const orderLimitNum = parseInt(formData.order_limit);

      const payload: any = {
        name: formData.name.trim(),
        type: formData.type,
        cost_price: isNaN(costPriceNum) ? 0 : costPriceNum,
        unit: formData.type === MaterialType.CONSUMABLE ? formData.unit : 'جلسة',
        stock_quantity: formData.type === MaterialType.CONSUMABLE ? (isNaN(stockQtyNum) ? 0 : stockQtyNum) : 0,
        order_limit: formData.type === MaterialType.CONSUMABLE ? (isNaN(orderLimitNum) ? 10 : orderLimitNum) : 0,
      };

      if (formData.type === MaterialType.SERVICE) {
        payload.selling_price = isNaN(sellingPriceNum) ? 0 : sellingPriceNum;
      } else {
        payload.selling_price = null;
      }

      const { error } = await supabase
        .from('materials')
        .insert([payload]);

      if (error) {
        // إذا كان الخطأ متعلق بـ RLS
        if (error.message.includes('row-level security policy')) {
          throw new Error("خطأ أمان: قاعدة البيانات ترفض الإضافة. يرجى التأكد من تفعيل سياسات الـ RLS لجدول materials في لوحة تحكم Supabase.");
        }
        throw error;
      }

      await fetchInventory();
      setIsAddModalOpen(false);
      setFormData({
        name: '', type: MaterialType.SERVICE, selling_price: '', cost_price: '',
        stock_quantity: '0', order_limit: '10', unit: 'قطعة'
      });
      alert("تمت الإضافة بنجاح");
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">المخزون والخدمات</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setIsAddModalOpen(true); setErrorMessage(null); }}
            className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            إضافة عنصر جديد
          </button>
        </div>
      </div>

      <div className="flex gap-6 border-b border-slate-100 overflow-x-auto no-scrollbar">
        {(['ALL', MaterialType.SERVICE, MaterialType.CONSUMABLE] as const).map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-4 text-sm font-black transition-all border-b-4 -mb-1 whitespace-nowrap ${
              filter === f ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {f === 'ALL' ? 'الكل' : f === MaterialType.SERVICE ? 'الخدمات' : 'المستلزمات المستهلكة'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
             <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-400 font-bold">جاري جلب بيانات المخزون...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[800px]">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">العنصر</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">التصنيف</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-left">سعر البيع</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-left">التكلفة</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">المتوفر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-8 py-6 font-black text-slate-800">{item.name}</td>
                    <td className="px-8 py-6">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-lg border ${
                        item.type === MaterialType.SERVICE ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {item.type === MaterialType.SERVICE ? 'خدمة' : 'مادة مستهلكة'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-left font-black text-slate-700">
                      {item.selling_price !== null ? `$${item.selling_price}` : '—'}
                    </td>
                    <td className="px-8 py-6 text-left font-black text-slate-400">${item.cost_price}</td>
                    <td className="px-8 py-6 text-center font-black">
                      {item.type === MaterialType.SERVICE ? '—' : `${item.stock_quantity} ${item.unit}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center text-slate-400 font-medium italic">
            لا توجد عناصر لعرضها.
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 text-right overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black text-slate-800 mb-6">إضافة عنصر جديد</h2>
            
            {errorMessage && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-2xl leading-relaxed">
                <p className="mb-2">⚠️ {errorMessage}</p>
                <p className="text-[10px] text-rose-400">تأكد من تطبيق كود SQL المحدث في لوحة تحكم Supabase.</p>
              </div>
            )}

            <form onSubmit={handleAddMaterial} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-400 mb-1.5 uppercase tracking-widest">الاسم</label>
                <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-1.5 uppercase tracking-widest">التصنيف</label>
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as MaterialType})} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold bg-white">
                  <option value={MaterialType.SERVICE}>جلسة / خدمة</option>
                  <option value={MaterialType.CONSUMABLE}>مادة مستهلكة</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input placeholder="التكلفة" type="number" step="0.01" required value={formData.cost_price} onChange={(e) => setFormData({...formData, cost_price: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 font-bold outline-none" />
                <input placeholder="سعر البيع" type="number" step="0.01" disabled={formData.type === MaterialType.CONSUMABLE} required={formData.type === MaterialType.SERVICE} value={formData.selling_price} onChange={(e) => setFormData({...formData, selling_price: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 font-bold outline-none disabled:bg-slate-50" />
              </div>

              {formData.type === MaterialType.CONSUMABLE && (
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="الكمية" type="number" value={formData.stock_quantity} onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 font-bold outline-none" />
                  <input placeholder="الوحدة (قطعة..)" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 font-bold outline-none" />
                </div>
              )}

              <div className="pt-4 flex flex-col gap-3">
                <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-xl disabled:opacity-50">
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ في السحابة'}
                </button>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="w-full text-slate-400 font-bold py-2">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
