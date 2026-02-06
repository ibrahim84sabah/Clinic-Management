
import { GoogleGenAI } from "@google/genai";

/**
 * Analyzes clinic data using Gemini 3 Pro.
 * Adheres to strict SDK guidelines: Use process.env.API_KEY directly.
 */
export const analyzeClinicData = async (prompt: string, dataContext: any) => {
  // Safely check for API_KEY in process.env
  // @ts-ignore
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;
  
  if (!apiKey) {
    throw new Error(
      "DentaGlow: API_KEY is missing. " +
      "Please ensure 'API_KEY' is set in your Vercel Environment Variables."
    );
  }

  // Strictly follow: new GoogleGenAI({ apiKey: process.env.API_KEY })
  // @ts-ignore
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
