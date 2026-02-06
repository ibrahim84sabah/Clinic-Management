
import { GoogleGenAI } from "@google/genai";

/**
 * تحليل بيانات العيادة باستخدام Gemini 3 Pro.
 * يلتزم بالقاعدة: استخدام process.env.API_KEY مباشرة.
 */
export const analyzeClinicData = async (prompt: string, dataContext: any) => {
  // @ts-ignore
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;

  if (!apiKey) {
    throw new Error("DentaGlow AI: مفتاح API_KEY مفقود في البيئة.");
  }

  // استخدام التهيئة المطلوبة تماماً
  // @ts-ignore
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    أنت المستشار الاستراتيجي الرئيسي لعيادة (دينتا جلو).
    لديك إمكانية الوصول المباشر إلى قاعدة بيانات Supabase.
    مهمتك: تقديم تحليل بيانات عميق، كشف نقاط الخلل المالي، وتحسين إدارة المخزون.
    
    القواعد:
    1. الرد باللغة العربية المهنية فقط.
    2. استخدم Markdown للجداول والعناوين.
    3. ركز على "صافي الربح الحقيقي" (الإيرادات - التكاليف - العمولات).
    4. إذا كان هناك نقص في المخزون، قدم خطة شراء فورية.
  `;

  const contextStr = JSON.stringify(dataContext);
  const fullPrompt = `سياق البيانات الفعلي في العيادة:\n${contextStr}\n\nطلب المدير:\n${prompt}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: fullPrompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });

    // الرد هو خاصية .text وليس دالة .text()
    return response.text;
  } catch (error) {
    console.error("Gemini Critical Error:", error);
    throw error;
  }
};
