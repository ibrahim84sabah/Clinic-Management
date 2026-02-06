
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Patient } from '../types';
import { supabase } from '../services/supabase';

interface PatientWithPhotos extends Patient {
  photos?: { id: string; url: string; type: 'BEFORE' | 'AFTER'; date: string }[];
}

const PatientCRM: React.FC = () => {
  const [patients, setPatients] = useState<PatientWithPhotos[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithPhotos | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '', age: '', phone1: '', phone2: '', address: '', medical: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setPatients(data);
    }
    setIsLoading(false);
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phones.some(phone => phone.includes(searchQuery))
    );
  }, [patients, searchQuery]);

  const openAddModal = () => {
    setModalMode('ADD');
    setFormData({ name: '', age: '', phone1: '', phone2: '', address: '', medical: '' });
  };

  const openEditModal = (patient: PatientWithPhotos) => {
    setModalMode('EDIT');
    setFormData({
      name: patient.name,
      age: patient.age.toString(),
      phone1: patient.phones[0] || '',
      phone2: patient.phones[1] || '',
      address: patient.address || '',
      medical: (patient.medical_history || []).join(', ')
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phones = [formData.phone1, formData.phone2].filter(p => p.trim() !== '');
    const medical = formData.medical.split(',').map(s => s.trim()).filter(s => s !== '');

    if (modalMode === 'ADD') {
      const { data, error } = await supabase
        .from('patients')
        .insert([{
          name: formData.name,
          age: parseInt(formData.age) || 0,
          phones: phones,
          address: formData.address,
          medical_history: medical
        }])
        .select();

      if (!error && data) {
        setPatients([data[0], ...patients]);
        setSelectedPatient(data[0]);
      }
    } else if (modalMode === 'EDIT' && selectedPatient) {
      const { error } = await supabase
        .from('patients')
        .update({
          name: formData.name,
          age: parseInt(formData.age) || 0,
          phones: phones,
          address: formData.address,
          medical_history: medical
        })
        .eq('id', selectedPatient.id);

      if (!error) {
        fetchPatients();
        setSelectedPatient({ ...selectedPatient, name: formData.name, age: parseInt(formData.age) || 0, phones, address: formData.address, medical_history: medical });
      }
    }

    setModalMode(null);
  };

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedPatient || !e.target.files?.length) return;
    alert("هذه الميزة تتطلب إعداد Supabase Storage (Bucket) - يتم رفع الصور حالياً للمعاينة فقط في الواجهة.");
  };

  const closeDetails = () => setSelectedPatient(null);

  return (
    <div className="h-full flex flex-col gap-4 lg:gap-6 text-right">
      <div className="flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800">دليل المرضى</h1>
        <button 
          onClick={openAddModal}
          className="bg-indigo-600 text-white px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
        >
          + مريض جديد
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className={`lg:col-span-1 flex flex-col gap-4 ${selectedPatient ? 'hidden lg:flex' : 'flex'}`}>
          <div className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، رقم الهاتف..." 
              className="w-full pr-10 pl-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-right text-sm text-black shadow-sm"
            />
            <svg className="w-5 h-5 absolute right-3 top-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-y-auto divide-y divide-slate-100 shadow-sm flex-1">
            {isLoading ? (
              <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : filteredPatients.length > 0 ? (
              filteredPatients.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className={`w-full text-right p-4 hover:bg-slate-50 transition-colors ${selectedPatient?.id === p.id ? 'bg-indigo-50 border-r-4 border-indigo-600' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-indigo-600 shrink-0 border border-slate-200 text-lg">
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0 text-right">
                      <p className="font-semibold text-slate-800 truncate">{p.name}</p>
                      <p className="text-xs text-slate-500 truncate" dir="ltr">{p.phones[0]}</p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm italic">لا يوجد نتائج</div>
            )}
          </div>
        </div>

        <div className={`lg:col-span-2 space-y-6 ${selectedPatient ? 'block' : 'hidden lg:block'}`}>
          {selectedPatient ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 lg:p-8 shadow-sm h-full overflow-y-auto animate-in fade-in slide-in-from-left-4 duration-300">
              <button onClick={closeDetails} className="lg:hidden flex items-center gap-2 text-indigo-600 mb-6 font-bold text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                العودة للقائمة
              </button>

              <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-8 border-b border-slate-100 pb-6">
                <div className="flex flex-col gap-1 text-right">
                    <h2 className="text-xl lg:text-3xl font-extrabold text-slate-800">{selectedPatient.name}</h2>
                    <p className="text-slate-500 font-medium">{selectedPatient.age} سنة</p>
                    <div className="mt-3 flex flex-wrap gap-2 justify-end">
                      {selectedPatient.medical_history && selectedPatient.medical_history.length > 0 ? selectedPatient.medical_history.map((m, i) => (
                        <span key={i} className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">{m}</span>
                      )) : <span className="text-xs text-slate-400 italic">لا يوجد سجل مرضي</span>}
                    </div>
                </div>
                <button onClick={() => openEditModal(selectedPatient)} className="bg-white text-indigo-600 px-5 py-2.5 rounded-xl text-sm font-bold border-2 border-indigo-50 hover:bg-indigo-50 transition-all flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  تعديل الملف
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 text-right">
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 text-sm">بيانات الاتصال</h3>
                  <div className="space-y-2">
                    {selectedPatient.phones.map((p, i) => (
                      <p key={i} className="text-sm"><span dir="ltr" className="text-slate-700 font-semibold">{p}</span></p>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 text-sm">العنوان</h3>
                  <p className="text-sm text-slate-600 font-medium">{selectedPatient.address || 'غير متوفر'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-2xl h-full flex flex-col items-center justify-center text-slate-400 text-center px-4">
              <p className="text-sm font-medium">اختر مريضاً لعرض الملف</p>
            </div>
          )}
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 text-right">
          <div className="bg-white rounded-3xl p-6 lg:p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95">
            <h2 className="text-xl font-bold mb-6 text-slate-800">{modalMode === 'ADD' ? 'تسجيل مريض جديد' : 'تعديل البيانات'}</h2>
            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">الاسم الكامل</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
              </div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">العمر</label><input type="number" required value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">الهاتف</label><input type="text" required dir="ltr" value={formData.phone1} onChange={(e) => setFormData({...formData, phone1: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" /></div>
              <div className="sm:col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">العنوان</label><input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" /></div>
              <div className="sm:col-span-2">
                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg">حفظ</button>
                <button type="button" onClick={() => setModalMode(null)} className="w-full mt-2 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientCRM;
