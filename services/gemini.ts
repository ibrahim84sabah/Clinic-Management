
import { GoogleGenAI } from "@google/genai";

/**
 * Analyzes clinic data using Gemini AI.
 * The API key is obtained exclusively from process.env.API_KEY.
 */
export const analyzeClinicData = async (prompt: string, dataContext: any) => {
  // Accessing API_KEY directly from process.env as per GenAI guidelines
  // @ts-ignore
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
  
  if (!apiKey) {
    throw new Error("DentaGlow: Gemini API_KEY is missing in the environment.");
  }

  // Initialize inside the function to ensure the latest environment variables are used.
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

    // Access .text property directly (it is a getter, not a method)
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
