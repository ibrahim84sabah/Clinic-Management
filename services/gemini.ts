
import { GoogleGenAI } from "@google/genai";

export const analyzeClinicData = async (prompt: string, dataContext: any) => {
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
  const fullPrompt = `Data Context: ${contextStr}\n\nUser Question: ${prompt}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: fullPrompt,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingBudget: 32768 }
    },
  });

  return response.text;
};
