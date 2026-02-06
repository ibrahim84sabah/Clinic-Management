import { GoogleGenAI } from "@google/genai";

// analyzeClinicData processes clinic context and user queries using Gemini 3 Pro.
export const analyzeClinicData = async (prompt: string, dataContext: any) => {
  // Use process.env.API_KEY exclusively as required by the library guidelines.
  // @ts-ignore - process.env is injected by the environment.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error(
      "DentaGlow: Gemini API_KEY is missing. " +
      "Please ensure 'API_KEY' is configured in the environment."
    );
  }

  // Always initialize the GoogleGenAI instance directly with the required named parameter.
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
    // Using ai.models.generateContent with 'gemini-3-pro-preview' for complex strategic analysis.
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: fullPrompt,
      config: {
        systemInstruction,
        // Configured for deep thinking and reasoning with a 32k token budget.
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });

    // Directly access the .text property of the GenerateContentResponse.
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};