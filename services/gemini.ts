
import { GoogleGenAI } from "@google/genai";

/**
 * جلب مفتاح API الخاص بـ Gemini.
 * يبحث عن API_KEY أو NEXT_PUBLIC_API_KEY.
 */
const getApiKey = (): string => {
  // @ts-ignore
  const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
  return env.API_KEY || env.NEXT_PUBLIC_API_KEY || env.VITE_API_KEY || '';
};

export const analyzeClinicData = async (prompt: string, dataContext: any) => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error(
      "DentaGlow Error: Gemini API_KEY is missing. " +
      "Please add NEXT_PUBLIC_API_KEY to Vercel."
    );
  }

  // إنشاء المثيل مباشرة باستخدام المفتاح المكتشف
  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `
    أنت مستشار استراتيجي أول لعيادة طبية وتجميلية.
    لديك إمكانية الوصول إلى بيانات المرضى ومستويات المخزون والتقارير المالية.
    مهمتك هي تقديم ذكاء أعمال عالي المستوى، واكتشاف الاتجاهات، واقتراح التحسينات.
    
    التعليمات:
    - يجب أن تكون جميع الردود باللغة العربية الفصحى والمهنية.
    - استخدم Markdown للعناوين والنقاط العريضة والنص الغامق.
    - ركز على منطق الربح الصافي (الإيرادات - المستهلكات - العمولات).
  `;

  const contextStr = JSON.stringify(dataContext);
  const fullPrompt = `سياق البيانات الحالي: ${contextStr}\n\nسؤال المستخدم: ${prompt}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: fullPrompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
