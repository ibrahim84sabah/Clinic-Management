
import React, { useState } from 'react';
import { analyzeClinicData } from '../services/gemini';

const ClinicAI: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Simulated data to feed as context to the AI
  const mockContext = {
    inventory: [
      { name: 'إبر 1سم', stock: 15, limit: 20 },
      { name: 'عبوة بوتوكس', stock: 5, limit: 10 }
    ],
    last_week_profit: 4200,
    top_service: 'زراعة أسنان',
    patient_satisfaction: '4.8/5'
  };

  const handleAsk = async () => {
    if (!query) return;
    setIsLoading(true);
    setResponse('');
    try {
      const result = await analyzeClinicData(query, mockContext);
      setResponse(result || 'لم يتم توليد استجابة.');
    } catch (error) {
      setResponse(`خطأ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 text-right">
      <div className="bg-indigo-900 rounded-2xl lg:rounded-3xl p-6 lg:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-500/30 p-2 rounded-lg shrink-0">
               <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <span className="font-bold uppercase tracking-widest text-indigo-300 text-[10px] lg:text-xs">محرك ذكاء العيادة الاستراتيجي</span>
          </div>
          <h2 className="text-2xl lg:text-4xl font-bold mb-4">تطوير عيادتك باستخدام Gemini 3 Pro</h2>
          <p className="text-indigo-200 text-sm lg:text-lg mb-8">اسأل عن اتجاهات المخزون، تحسين الأرباح، أو استراتيجيات الاحتفاظ بالمرضى.</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="مثلاً: 'كيف يمكنني زيادة الأرباح؟'"
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 lg:px-6 lg:py-4 outline-none focus:ring-2 focus:ring-indigo-400 placeholder-indigo-300 text-white text-right text-sm lg:text-base"
            />
            <button 
              onClick={handleAsk}
              disabled={isLoading}
              className="bg-white text-indigo-900 px-6 py-3 lg:px-8 lg:py-4 rounded-xl font-bold hover:bg-indigo-50 transition-all disabled:opacity-50 whitespace-nowrap text-sm lg:text-base shadow-lg shadow-black/20"
            >
              {isLoading ? 'جاري التحليل...' : 'حلل البيانات'}
            </button>
          </div>
        </div>
        
        {/* Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl -ml-24 -mb-24"></div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-8 lg:p-12 space-y-4 animate-pulse">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-slate-500 font-medium italic text-sm lg:text-base">تفكير عميق جارٍ (ميزانية التفكير: 32 ألف توكن)...</p>
        </div>
      )}

      {response && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm prose prose-indigo max-w-none animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            تقرير استراتيجي تم توليده
          </div>
          <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-right text-sm lg:text-base">
            {response}
          </div>
        </div>
      )}

      {!response && !isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mt-8">
          {[
            "حلل أفضل الخدمات أداءً هذا الشهر",
            "ما هي عناصر المخزون المعرضة للنفاد؟",
            "حدد أنماط حجز المرضى الموسمية",
            "اقترح استراتيجيات لتقليل تكلفة المواد الاستهلاكية"
          ].map((suggestion, i) => (
            <button 
              key={i}
              onClick={() => setQuery(suggestion)}
              className="p-4 bg-white border border-slate-200 rounded-xl text-right hover:border-indigo-400 hover:shadow-md transition-all group"
            >
              <p className="text-xs lg:text-sm text-slate-500 group-hover:text-indigo-600 font-medium">{suggestion}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClinicAI;
