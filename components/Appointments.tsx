
import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, AppointmentStatus, Patient, User, UserRole } from '../types';
import { supabase } from '../services/supabase';

interface AppointmentsProps {
  currentUser?: User | null;
}

const Appointments: React.FC<AppointmentsProps> = ({ currentUser }) => {
  const [appointments, setAppointments] = useState<(Appointment & { doctor_name?: string, patient_name?: string })[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<{ id: string, name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'TODAY' | 'FUTURE' | 'ALL'>('TODAY');

  // إعدادات الوقت الافتراضية
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: new Date().toISOString().split('T')[0],
    hour: '10',
    minute: '00',
    period: 'AM',
    notes: '',
    status: AppointmentStatus.PENDING
  });

  const [selectedPatientName, setSelectedPatientName] = useState<string | null>(null);
  const [searchPatientQuery, setSearchPatientQuery] = useState('');

  useEffect(() => {
    const initData = async () => {
      await Promise.all([fetchPatients(), fetchDoctors()]);
      await fetchAppointments();
    };
    initData();
  }, [dateFilter, viewMode]);

  useEffect(() => {
    if (currentUser?.role === UserRole.DOCTOR && !formData.doctor_id) {
      setFormData(prev => ({ ...prev, doctor_id: currentUser.id }));
    }
  }, [currentUser, isModalOpen]);

  const fetchDoctors = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('role', UserRole.DOCTOR);
    if (!error && data) setDoctors(data);
    return data || [];
  };

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase.from('patients').select('id, name').order('name');
      if (!error && data) setPatients(data);
      return data || [];
    } catch (err) {
      console.error("Error fetching patients:", err);
      return [];
    }
  };

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('appointments').select('*');

      if (viewMode === 'FUTURE') {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        query = query.gte('appointment_date', todayStart.toISOString());
      } else if (viewMode === 'TODAY') {
        query = query
          .gte('appointment_date', `${dateFilter}T00:00:00.000Z`)
          .lte('appointment_date', `${dateFilter}T23:59:59.999Z`);
      }

      const { data: appData, error: appError } = await query.order('appointment_date', { ascending: false });
      if (appError) throw appError;

      const { data: pData } = await supabase.from('patients').select('id, name');
      const { data: dData } = await supabase.from('profiles').select('id, name');

      const pMap = new Map(pData?.map(p => [p.id, p.name]));
      const dMap = new Map(dData?.map(d => [d.id, d.name]));

      const mapped = appData?.map(app => ({
        ...app,
        patient_name: pMap.get(app.patient_id) || 'مريض غير مسجل',
        doctor_name: dMap.get(app.doctor_id) || 'طبيب غير محدد'
      })) || [];

      setAppointments(mapped);
    } catch (err: any) {
      console.error("Fetch Error:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const pName = app.patient_name || '';
      const dName = app.doctor_name || '';
      const s = searchQuery.toLowerCase();
      return pName.toLowerCase().includes(s) || dName.toLowerCase().includes(s);
    });
  }, [appointments, searchQuery]);

  const handleSelectPatient = (id: string, name: string) => {
    setFormData(prev => ({ ...prev, patient_id: id }));
    setSelectedPatientName(name);
    setSearchPatientQuery('');
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.doctor_id) return alert("يرجى اختيار المريض والطبيب.");

    setIsSubmitting(true);
    try {
      // تحويل الوقت من نظام 12 ساعة إلى 24 ساعة
      let h = parseInt(formData.hour);
      if (formData.period === 'PM' && h < 12) h += 12;
      if (formData.period === 'AM' && h === 12) h = 0;
      
      const timeStr = `${h.toString().padStart(2, '0')}:${formData.minute}:00`;
      const combinedDate = new Date(`${formData.appointment_date}T${timeStr}`);
      
      const { error } = await supabase
        .from('appointments')
        .insert([{
          patient_id: formData.patient_id,
          doctor_id: formData.doctor_id,
          appointment_date: combinedDate.toISOString(),
          status: formData.status,
          notes: formData.notes.trim()
        }]);

      if (error) throw error;
      await fetchAppointments();
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      alert("خطأ: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      doctor_id: currentUser?.role === UserRole.DOCTOR ? currentUser.id : '',
      appointment_date: new Date().toISOString().split('T')[0],
      hour: '10',
      minute: '00',
      period: 'AM',
      notes: '',
      status: AppointmentStatus.PENDING
    });
    setSelectedPatientName(null);
    setSearchPatientQuery('');
  };

  const updateStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
      if (!error) fetchAppointments();
    } catch (err: any) {
      console.error(err);
    }
  };

  const filteredPatientList = useMemo(() => {
    if (!searchPatientQuery) return [];
    return patients.filter(p => p.name.toLowerCase().includes(searchPatientQuery.toLowerCase())).slice(0, 5);
  }, [patients, searchPatientQuery]);

  return (
    <div className="space-y-6 text-right animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">جدول المواعيد</h1>
          <p className="text-slate-500 text-xs font-bold">إدارة المواعيد السحابية</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 justify-center"
        >
          حجز موعد جديد
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
           <button onClick={() => setViewMode('TODAY')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${viewMode === 'TODAY' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>اليوم</button>
           <button onClick={() => setViewMode('FUTURE')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${viewMode === 'FUTURE' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>القادمة</button>
           <button onClick={() => setViewMode('ALL')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${viewMode === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>السجل الكامل</button>
           
           <div className="flex-1 min-w-[200px] relative">
            <input 
              type="text" 
              placeholder="بحث في المواعيد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-10 py-2.5 text-xs font-black outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {isLoading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-black text-sm">جاري تحديث المواعيد...</p>
          </div>
        ) : filteredAppointments.length > 0 ? (
          filteredAppointments.map((app) => (
            <div key={app.id} className="bg-white p-5 rounded-[2rem] border border-slate-50 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 transition-colors text-center p-1">
                  <span className="text-indigo-600 font-black text-[9px] group-hover:text-white leading-tight">
                    {new Date(app.appointment_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                  <span className="text-indigo-300 font-bold text-[8px] group-hover:text-indigo-100">
                    {new Date(app.appointment_date).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-base">{app.patient_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold">الطبيب: {app.doctor_name}</span>
                    <span className="text-[10px] text-slate-400 font-medium italic">{app.notes}</span>
                  </div>
                </div>
              </div>
              <select 
                value={app.status}
                onChange={(e) => updateStatus(app.id, e.target.value as AppointmentStatus)}
                className={`text-[10px] font-black px-4 py-2 rounded-xl border-none outline-none cursor-pointer ${
                  app.status === AppointmentStatus.PENDING ? 'bg-amber-50 text-amber-600' :
                  app.status === AppointmentStatus.CONFIRMED ? 'bg-indigo-50 text-indigo-600' :
                  app.status === AppointmentStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}
              >
                <option value={AppointmentStatus.PENDING}>انتظار</option>
                <option value={AppointmentStatus.CONFIRMED}>مؤكد</option>
                <option value={AppointmentStatus.COMPLETED}>مكتمل</option>
                <option value={AppointmentStatus.CANCELLED}>ملغى</option>
              </select>
            </div>
          ))
        ) : (
          <div className="p-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 text-slate-300 italic font-bold">لا توجد مواعيد حالية.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 text-right overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black text-slate-800 mb-6 border-b border-slate-50 pb-4">حجز موعد جديد</h2>
            <form onSubmit={handleAddAppointment} className="space-y-6">
              
              {/* المريض */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest mr-1">المريض</label>
                {selectedPatientName ? (
                  <div className="bg-indigo-50 p-4 rounded-2xl flex items-center justify-between border border-indigo-100">
                    <span className="font-black text-indigo-700">{selectedPatientName}</span>
                    <button type="button" onClick={() => { setSelectedPatientName(null); setFormData({...formData, patient_id: ''}); }} className="text-indigo-400 hover:text-indigo-600 font-black">✕</button>
                  </div>
                ) : (
                  <div className="relative">
                    <input 
                      placeholder="ابحث عن مريض..."
                      value={searchPatientQuery}
                      onChange={(e) => setSearchPatientQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    {searchPatientQuery && filteredPatientList.length > 0 && (
                      <div className="absolute top-full right-0 left-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden">
                        {filteredPatientList.map(p => (
                          <button key={p.id} type="button" onClick={() => handleSelectPatient(p.id, p.name)} className="w-full p-4 text-right hover:bg-indigo-50 font-black text-sm">
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* الطبيب */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest mr-1">الطبيب المسؤول</label>
                <select 
                  required
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({...formData, doctor_id: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">-- اختر الطبيب --</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.name}</option>
                  ))}
                </select>
              </div>

              {/* التاريخ مع أيقونة تقويم */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase mr-1 tracking-widest">تاريخ الموعد (التقويم)</label>
                <div className="relative group">
                  <input 
                    type="date" 
                    required 
                    value={formData.appointment_date} 
                    onChange={(e) => setFormData({...formData, appointment_date: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* الوقت الجديد المقسم */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase mr-1 tracking-widest">توقيت الجلسة</label>
                <div className="grid grid-cols-3 gap-2">
                  <select 
                    value={formData.hour} 
                    onChange={(e) => setFormData({...formData, hour: e.target.value})}
                    className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center text-sm font-black outline-none"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={(i + 1).toString().padStart(2, '0')}>{i + 1}</option>
                    ))}
                  </select>
                  <select 
                    value={formData.minute} 
                    onChange={(e) => setFormData({...formData, minute: e.target.value})}
                    className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center text-sm font-black outline-none"
                  >
                    {['00', '15', '30', '45'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select 
                    value={formData.period} 
                    onChange={(e) => setFormData({...formData, period: e.target.value})}
                    className="bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-2xl p-3 text-center text-sm font-black outline-none"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              {/* ملاحظات */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase mr-1 tracking-widest">ملاحظات إضافية</label>
                <textarea 
                  placeholder="سبب الزيارة أو ملاحظة خاصة..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold h-24 resize-none outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 space-y-3">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !formData.patient_id || !formData.doctor_id}
                  className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-sm shadow-xl hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري المزامنة...' : 'تأكيد وحجز الموعد'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-400 font-black py-2 text-xs">إلغاء العملية</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
