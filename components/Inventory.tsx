
import React, { useState, useMemo, useEffect } from 'react';
import { Material, MaterialType } from '../types';
import { supabase } from '../services/supabase';

const Inventory: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | MaterialType>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: MaterialType.SERVICE,
    selling_price: '',
    cost_price: '',
    stock_quantity: '',
    order_limit: '',
    unit: 'جلسة'
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name', { ascending: true });
    
    if (!error && data) {
      setMaterials(data);
    }
    setIsLoading(false);
  };

  const filteredItems = useMemo(() => {
    return filter === 'ALL' 
      ? materials 
      : materials.filter(item => item.type === filter);
  }, [materials, filter]);

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      type: formData.type,
      selling_price: formData.type === MaterialType.SERVICE ? parseFloat(formData.selling_price) : null,
      cost_price: parseFloat(formData.cost_price) || 0,
      stock_quantity: formData.type === MaterialType.CONSUMABLE ? parseInt(formData.stock_quantity) : 0,
      order_limit: formData.type === MaterialType.CONSUMABLE ? parseInt(formData.order_limit) : 0,
      unit: formData.unit
    };

    const { error } = await supabase.from('materials').insert([payload]);

    if (!error) {
      fetchInventory();
      setIsAddModalOpen(false);
      setFormData({
        name: '', type: MaterialType.SERVICE, selling_price: '', cost_price: '',
        stock_quantity: '', order_limit: '', unit: 'جلسة'
      });
    } else {
      alert("خطأ في الإضافة: " + error.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">المخزون والخدمات</h1>
          <p className="text-slate-500 font-medium italic">إدارة سحابية موحدة لعيادة دنتـا جلـو.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
          >
            + إضافة عنصر جديد
          </button>
        </div>
      </div>

      <div className="flex gap-6 border-b border-slate-100 overflow-x-auto no-scrollbar">
        {(['ALL', MaterialType.SERVICE, MaterialType.CONSUMABLE] as const).map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-4 text-sm font-black transition-all border-b-4 -mb-1 ${
              filter === f ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {f === 'ALL' ? 'الكل' : f === MaterialType.SERVICE ? 'الخدمات' : 'المستلزمات'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
             <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-400 font-bold">جاري جلب بيانات المخزون...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[800px]">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">العنصر</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">التصنيف</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-left">سعر البيع</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-left">التكلفة</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">المتوفر</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">الحالة</th>
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
                        {item.type === MaterialType.SERVICE ? 'خدمة' : 'مادة'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-left font-black text-slate-700">
                      {item.selling_price ? `$${item.selling_price}` : '—'}
                    </td>
                    <td className="px-8 py-6 text-left font-black text-slate-400">${item.cost_price}</td>
                    <td className="px-8 py-6 text-center font-black">
                      {item.type === MaterialType.SERVICE ? '—' : `${item.stock_quantity} ${item.unit}`}
                    </td>
                    <td className="px-8 py-6">
                      {item.type === MaterialType.CONSUMABLE && item.stock_quantity <= item.order_limit ? (
                        <span className="text-rose-600 text-[10px] font-black bg-rose-50 px-2 py-1 rounded-full">نقص!</span>
                      ) : (
                        <span className="text-emerald-600 text-[10px] font-black bg-emerald-50 px-2 py-1 rounded-full">مستقر</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 text-right">
            <h2 className="text-xl font-bold mb-6">إضافة عنصر جديد للسحابة</h2>
            <form onSubmit={handleAddMaterial} className="space-y-4">
              <input 
                placeholder="اسم العنصر" required value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200"
              />
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as MaterialType})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200"
              >
                <option value={MaterialType.SERVICE}>جلسة / خدمة</option>
                <option value={MaterialType.CONSUMABLE}>مادة مستهلكة</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="التكلفة" type="number" step="0.01" value={formData.cost_price} onChange={(e) => setFormData({...formData, cost_price: e.target.value})} className="px-4 py-3 rounded-xl border border-slate-200" />
                <input placeholder="سعر البيع" type="number" step="0.01" value={formData.selling_price} onChange={(e) => setFormData({...formData, selling_price: e.target.value})} className="px-4 py-3 rounded-xl border border-slate-200" disabled={formData.type === MaterialType.CONSUMABLE} />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold">حفظ البيانات</button>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="w-full text-slate-400 font-bold">إلغاء</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
