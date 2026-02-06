
/**
 * n8n Integration Service
 * 
 * هذا الملف مسؤول عن الربط المباشر بين التطبيق و n8n.
 * لضمان أفضل أداء، يفضل ضبط Webhooks من داخل لوحة تحكم Supabase 
 * (Database -> Webhooks) لتعمل بشكل تلقائي عند تغيير البيانات.
 */

// استبدل هذا الرابط برابط الـ Production Webhook من n8n
const N8N_WEBHOOK_URL = 'https://n8n.yourdomain.com/webhook/clinic-automation';

export type ClinicEventType = 'LOW_STOCK' | 'NEW_PATIENT' | 'APPOINTMENT_REMINDER' | 'DAILY_REPORT';

export const triggerN8nWorkflow = async (eventType: ClinicEventType, data: any) => {
  console.log(`[n8n] Triggering workflow for: ${eventType}`);
  
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Clinic-Event': eventType 
      },
      body: JSON.stringify({
        event: eventType,
        source: 'CLINIC_APP_FRONTEND',
        payload: data,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`n8n responded with status: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, result };
  } catch (error) {
    console.error('[n8n] Integration Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown integration error' 
    };
  }
};

/**
 * نصيحة للمهندس:
 * لإرسال تنبيهات تلقائية عند نقص المخزون دون تدخل المستخدم:
 * 1. اذهب إلى Supabase Dashboard.
 * 2. اختر Database ثم Webhooks.
 * 3. فعل خيار Enable Webhooks.
 * 4. أنشئ Webhook جديد على جدول 'materials'.
 * 5. اختر حدث 'UPDATE'.
 * 6. ضع رابط n8n أعلاه كـ Destination.
 */
