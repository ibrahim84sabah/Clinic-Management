
import { GoogleGenAI } from "@google/genai";

/**
 * تحليل بيانات العيادة باستخدام Gemini 3 Pro.
 * يلتزم بالقاعدة: new GoogleGenAI({ apiKey: process.env.API_KEY })
 */
export const analyzeClinicData = async (prompt: string, dataContext: any) => {
  // Fix: Initialize GoogleGenAI strictly using process.env.API_KEY as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    أنت مستشار استراتيجي أول لعيادة طبية وتجميلية (دينتا جلو).
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

    // Fix: Access response.text directly (property, not a method).
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
