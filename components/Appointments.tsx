
import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, AppointmentStatus, Patient, User } from '../types';
import { supabase } from '../services/supabase';

interface AppointmentsProps {
  currentUser?: User | null;
}

const Appointments: React.FC<AppointmentsProps> = ({ currentUser }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllFuture, setShowAllFuture] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '10:00',
    notes: '',
    status: AppointmentStatus.PENDING
  });

  const [selectedPatientName, setSelectedPatientName] = useState<string | null>(null);
  const [searchPatientQuery, setSearchPatientQuery] = useState('');

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, [dateFilter, showAllFuture]);

  const fetchPatients = async () => {
    const { data } = await supabase.from('patients').select('id, name').order('name');
    if (data) setPatients(data);
  };

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patients ( name )
        `);

      if (showAllFuture) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        query = query.gte('appointment_date', todayStart.toISOString());
      } else {
        query = query
          .gte('appointment_date', `${dateFilter}T00:00:00`)
          .lte('appointment_date', `${dateFilter}T23:59:59`);
      }

      const { data, error } = await query.order('appointment_date', { ascending: true });

      if (error) throw error;
      
      const mapped = data?.map(app => ({
        ...app,
        patient_name: app.patients?.name || 'مريض غير معروف'
      })) || [];

      setAppointments(mapped);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
      const patientName = app.patient_name || '';
      const appTime = new Date(app.appointment_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      
      const matchesSearch = 
        patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appTime.includes(searchQuery) ||
        (app.notes && app.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesStatus && matchesSearch;
    });
  }, [appointments, statusFilter, searchQuery]);

  const handleSelectPatient = (id: string, name: string) => {
    setFormData(prev => ({ ...prev, patient_id: id }));
    setSelectedPatientName(name);
    setSearchPatientQuery(''); // Clear search after selection
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id) {
      alert("يرجى اختيار مريض من القائمة للتمكن من الحجز.");
      return;
    }

    setIsSubmitting(true);

    try {
      const fullDateTime = `${formData.appointment_date}T${formData.appointment_time}:00`;
      
      const { error } = await supabase
        .from('appointments')
        .insert([{
          patient_id: formData.patient_id,
          doctor_id: currentUser?.id,
          appointment_date: fullDateTime,
          status: formData.status,
          notes: formData.notes.trim()
        }]);

      if (error) throw error;

      await fetchAppointments();
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      alert("خطأ في حفظ الموعد: " + (err.message || "حدث خطأ غير معروف"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '10:00',
      notes: '',
      status: AppointmentStatus.PENDING
    });
    setSelectedPatientName(null);
    setSearchPatientQuery('');
  };

  const updateStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      fetchAppointments();
    } catch (err: any) {
      alert("خطأ في تحديث الحالة: " + err.message);
    }
  };

  const filteredPatientList = useMemo(() => {
    if (!searchPatientQuery) return [];
    return patients.filter(p => 
      p.name.toLowerCase().includes(searchPatientQuery.toLowerCase())
    ).slice(0, 5); // Limit for better UI
  }, [patients, searchPatientQuery]);

  return (
    <div className="space-y-6 text-right animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">إدارة مواعيد العيادة</h1>
          <p className="text-slate-500 text-sm font-medium">جدولة الجلسات والمتابعة المتقدمة لجدول العيادة.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          حجز موعد جديد
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/30 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[250px] relative">
            <input 
              type="text" 
              placeholder="ابحث باسم المريض أو الوقت..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <svg className="w-5 h-5 absolute right-4 top-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center gap-3">
             <button 
               onClick={() => setShowAllFuture(!showAllFuture)}
               className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 border ${
                 showAllFuture ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-500'
               }`}
             >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               {showAllFuture ? 'عرض كافة القادم' : 'تحديد يوم معين'}
             </button>

             {!showAllFuture && (
               <input 
                 type="date" 
                 value={dateFilter}
                 onChange={(e) => setDateFilter(e.target.value)}
                 className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
               />
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
             <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-400 font-black">جاري مزامنة المواعيد...</p>
          </div>
        ) : filteredAppointments.length > 0 ? (
          filteredAppointments.map((app) => (
            <div key={app.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex flex-col items-center justify-center border border-indigo-100 shrink-0 shadow-inner group-hover:bg-indigo-600 transition-colors">
                  <span className="text-indigo-600 font-black text-xs group-hover:text-white">{new Date(app.appointment_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                  {showAllFuture && (
                    <span className="text-[8px] font-bold text-indigo-400 uppercase mt-1 group-hover:text-indigo-200">
                      {new Date(app.appointment_date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{app.patient_name}</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">{app.notes || 'لا توجد ملاحظات'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <select 
                  value={app.status}
                  onChange={(e) => updateStatus(app.id, e.target.value as AppointmentStatus)}
                  className={`text-[10px] font-black px-4 py-2 rounded-xl border-2 outline-none cursor-pointer ${
                    app.status === AppointmentStatus.PENDING ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    app.status === AppointmentStatus.CONFIRMED ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                    app.status === AppointmentStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    'bg-rose-50 text-rose-600 border-rose-100'
                  }`}
                >
                  <option value={AppointmentStatus.PENDING}>قيد الانتظار</option>
                  <option value={AppointmentStatus.CONFIRMED}>مؤكد</option>
                  <option value={AppointmentStatus.COMPLETED}>مكتمل</option>
                  <option value={AppointmentStatus.CANCELLED}>ملغى</option>
                </select>
              </div>
            </div>
          ))
        ) : (
          <div className="p-24 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-bold">لا توجد مواعيد حالية.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 max-w-lg w-full shadow-2xl animate-in zoom-in-95 text-right overflow-y-auto max-h-[90vh]">
            <h2 className="text-3xl font-black text-slate-800 mb-6">حجز موعد جديد</h2>
            <form onSubmit={handleAddAppointment} className="space-y-6">
              
              <div>
                <label className="block text-xs font-black text-slate-400 mb-2.5 uppercase tracking-widest">المريض المختار</label>
                
                {selectedPatientName ? (
                  <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 px-5 py-4 rounded-2xl mb-2 animate-in fade-in slide-in-from-top-2">
                    <span className="text-indigo-700 font-black">{selectedPatientName}</span>
                    <button 
                      type="button" 
                      onClick={() => { setFormData({...formData, patient_id: ''}); setSelectedPatientName(null); }}
                      className="text-indigo-400 hover:text-indigo-600"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input 
                      placeholder="ابحث عن اسم المريض للاختيار..."
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold bg-slate-50"
                      value={searchPatientQuery}
                      onChange={(e) => setSearchPatientQuery(e.target.value)}
                    />
                    {searchPatientQuery && filteredPatientList.length > 0 && (
                      <div className="absolute top-full right-0 left-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-50">
                        {filteredPatientList.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectPatient(p.id, p.name)}
                            className="w-full text-right px-6 py-4 hover:bg-indigo-50 transition-colors font-bold text-slate-700 flex items-center justify-between"
                          >
                            <span>{p.name}</span>
                            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchPatientQuery && filteredPatientList.length === 0 && (
                      <div className="absolute top-full right-0 left-0 mt-2 bg-white border border-slate-100 rounded-2xl p-4 text-center text-slate-400 text-xs font-bold">
                        لا يوجد مريض بهذا الاسم
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-2.5 uppercase tracking-widest">تاريخ الموعد</label>
                  <input 
                    type="date" 
                    required
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-2.5 uppercase tracking-widest">توقيت الجلسة</label>
                  <input 
                    type="time" 
                    required
                    value={formData.appointment_time}
                    onChange={(e) => setFormData({...formData, appointment_time: e.target.value})}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-2.5 uppercase tracking-widest">ملاحظات طبية</label>
                <textarea 
                  rows={2}
                  value={formData.notes}
                  placeholder="مثال: فحص دوري، تنظيف..."
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold resize-none"
                />
              </div>

              <div className="pt-4 flex flex-col gap-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !formData.patient_id}
                  className={`w-full py-5 rounded-[1.5rem] font-black text-base transition-all shadow-xl flex items-center justify-center gap-3 ${
                    !formData.patient_id ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : 'إتمام حجز الجلسة'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-full text-slate-400 font-black py-2 hover:text-slate-600 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
