
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

  // Form State
  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_date: dateFilter,
    appointment_time: '10:00',
    notes: '',
    status: AppointmentStatus.PENDING
  });

  const [searchPatientQuery, setSearchPatientQuery] = useState('');

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, [dateFilter]);

  // Update form date when filter changes to keep consistency
  useEffect(() => {
    setFormData(prev => ({ ...prev, appointment_date: dateFilter }));
  }, [dateFilter]);

  const fetchPatients = async () => {
    const { data } = await supabase.from('patients').select('id, name').order('name');
    if (data) setPatients(data);
  };

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients ( name )
        `)
        .gte('appointment_date', `${dateFilter}T00:00:00`)
        .lte('appointment_date', `${dateFilter}T23:59:59`)
        .order('appointment_date', { ascending: true });

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
    if (statusFilter === 'ALL') return appointments;
    return appointments.filter(app => app.status === statusFilter);
  }, [appointments, statusFilter]);

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id) {
      alert("يرجى اختيار مريض من القائمة أولاً.");
      return;
    }

    setIsSubmitting(true);

    try {
      const fullDateTime = `${formData.appointment_date}T${formData.appointment_time}:00`;
      
      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          patient_id: formData.patient_id,
          doctor_id: currentUser?.id, // تأكد من إرسال معرف الطبيب
          appointment_date: fullDateTime,
          status: formData.status,
          notes: formData.notes.trim()
        }])
        .select();

      if (error) throw error;

      await fetchAppointments();
      setIsModalOpen(false);
      setFormData({
        patient_id: '',
        appointment_date: dateFilter,
        appointment_time: '10:00',
        notes: '',
        status: AppointmentStatus.PENDING
      });
      setSearchPatientQuery('');
    } catch (err: any) {
      console.error("Save Error:", err);
      alert("خطأ في حفظ الموعد: " + (err.message || "حدث خطأ غير معروف"));
    } finally {
      setIsSubmitting(false);
    }
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

  const filteredPatientList = patients.filter(p => 
    p.name.toLowerCase().includes(searchPatientQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-right animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">إدارة مواعيد العيادة</h1>
          <p className="text-slate-500 text-sm font-medium">جدولة الجلسات والمتابعة اليومية.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          حجز موعد جديد
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
           <span className="text-xs font-bold text-slate-400">التاريخ:</span>
           <input 
             type="date" 
             value={dateFilter}
             onChange={(e) => setDateFilter(e.target.value)}
             className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
           />
        </div>
        <div className="flex items-center gap-2">
           <span className="text-xs font-bold text-slate-400">الحالة:</span>
           <select 
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
           >
             <option value="ALL">الكل</option>
             <option value={AppointmentStatus.PENDING}>قيد الانتظار</option>
             <option value={AppointmentStatus.CONFIRMED}>مؤكد</option>
             <option value={AppointmentStatus.COMPLETED}>مكتمل</option>
             <option value={AppointmentStatus.CANCELLED}>ملغى</option>
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
             <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-400 font-bold">جاري تحميل المواعيد...</p>
          </div>
        ) : filteredAppointments.length > 0 ? (
          filteredAppointments.map((app) => (
            <div key={app.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 shrink-0">
                  <span className="text-indigo-600 font-black text-sm">{new Date(app.appointment_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div>
                  <h3 className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{app.patient_name}</h3>
                  <p className="text-xs text-slate-400 font-medium">{app.notes || 'بدون ملاحظات إضافية'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select 
                  value={app.status}
                  onChange={(e) => updateStatus(app.id, e.target.value as AppointmentStatus)}
                  className={`text-[10px] font-black px-3 py-1.5 rounded-xl border outline-none transition-all ${
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
          <div className="p-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-medium italic">لا توجد مواعيد مسجلة لهذا اليوم.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 text-right overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black text-slate-800 mb-6">حجز موعد جديد</h2>
            <form onSubmit={handleAddAppointment} className="space-y-5">
              
              <div>
                <label className="block text-xs font-black text-slate-400 mb-1.5 uppercase tracking-widest">اختر المريض (يجب النقر على الاسم)</label>
                <div className="relative">
                  <input 
                    placeholder="ابحث عن اسم المريض..."
                    autoFocus
                    className="w-full px-5 py-3.5 rounded-t-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    value={searchPatientQuery}
                    onChange={(e) => setSearchPatientQuery(e.target.value)}
                  />
                  <select 
                    required
                    size={4}
                    value={formData.patient_id}
                    onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                    className="w-full px-5 py-2 rounded-b-2xl border border-t-0 border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold bg-white"
                  >
                    {filteredPatientList.length > 0 ? filteredPatientList.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    )) : (
                      <option disabled>لا يوجد نتائج لمريض بهذا الاسم</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-1.5 uppercase tracking-widest">التاريخ</label>
                  <input 
                    type="date" 
                    required
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
                    className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-1.5 uppercase tracking-widest">الوقت</label>
                  <input 
                    type="time" 
                    required
                    value={formData.appointment_time}
                    onChange={(e) => setFormData({...formData, appointment_time: e.target.value})}
                    className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-1.5 uppercase tracking-widest">ملاحظات (اختياري)</label>
                <textarea 
                  rows={3}
                  value={formData.notes}
                  placeholder="مثال: خلع ضرس، تنظيف..."
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !formData.patient_id}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : 'تأكيد حجز الموعد'}
                </button>
                <button 
                  type="button" 
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)} 
                  className="w-full text-slate-400 font-bold py-2 hover:text-slate-600 transition-colors"
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
