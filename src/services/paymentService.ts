// Secure HarakaPay Payment Client Service for NeliTV Web
// Calls server-side proxy routes (/api/payment/*) to protect API keys.

export interface CollectPaymentParams {
  phone: string;
  amount: number;
  planId: string;
  description?: string;
}

export interface CollectPaymentResult {
  success: boolean;
  message: string;
  order_id?: string;
  amount?: number;
  net_amount?: number;
  fee?: number;
}

export interface PaymentStatusResult {
  success: boolean;
  order_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'confirmed' | 'success' | 'failed' | 'cancelled' | 'expired' | 'not_found';
  message?: string;
  payment?: {
    order_id: string;
    status: string;
    amount: number;
    net_amount?: number;
    fee_amount?: number;
    created_at?: string;
    completed_at?: string;
  };
}

// HarakaPay API Key & Gateway endpoints
export const HARAKAPAY_KEY = 'hpk_93b63ba05db51f1963b174570c71762a73541195bdbc5538';
const HARAKAPAY_DIRECT_BASE = 'https://harakapay.net/api/v1';

// Optional backend API base URL for decoupled frontend (e.g. Firebase Hosting frontend + Render/Cloud Run backend)
export function getApiBaseUrl(): string {
  try {
    const custom = typeof window !== 'undefined' ? localStorage.getItem('nelitv_api_base_url') : '';
    if (custom && custom.trim().startsWith('http')) {
      return custom.trim().replace(/\/$/, '');
    }
  } catch {}
  return (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
}

export function setApiBaseUrl(url: string) {
  try {
    if (!url) {
      localStorage.removeItem('nelitv_api_base_url');
    } else {
      localStorage.setItem('nelitv_api_base_url', url.trim().replace(/\/$/, ''));
    }
  } catch {}
}

// Clean Tanzania phone numbers: 07xxxxxxxx or 06xxxxxxxx
export function formatTanzaniaPhone(raw: string): string {
  if (!raw) return '';
  try {
    let clean = String(raw).trim().replace(/\s+/g, '').replace('+', '');
    if (clean.startsWith('255')) {
      clean = '0' + clean.substring(3);
    } else if (clean.length === 9 && (clean.startsWith('7') || clean.startsWith('6'))) {
      clean = '0' + clean;
    }
    return clean;
  } catch {
    return '';
  }
}

/**
 * 1. Collect Payment (POST /api/payment/collect or Direct HarakaPay)
 * Sends USSD push to customer phone.
 */
export async function collectPayment(params: CollectPaymentParams): Promise<CollectPaymentResult> {
  const cleanPhone = formatTanzaniaPhone(params.phone);
  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error('Weka namba sahihi ya simu ya Tanzania (mfano: 0712345678).');
  }

  const amount = Number(params.amount);
  if (isNaN(amount) || amount < 100) {
    throw new Error('Kiasi cha chini cha malipo ni TZS 100.');
  }

  const payload = {
    phone: cleanPhone,
    amount,
    description: params.description || `Malipo ya NeliTV Live - Tsh ${amount}`,
    planId: params.planId,
  };

  // Step A: Attempt backend route first (/api/payment/collect)
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/api/payment/collect`;
  let backendFailed = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data && data.success && data.order_id) {
        return {
          success: true,
          message: data.message || 'Ombi la malipo (USSD push) limetumwa kwenye simu yako. Tafadhali weka PIN.',
          order_id: data.order_id,
          amount: data.amount || amount,
          net_amount: data.net_amount,
          fee: data.fee,
        };
      }
      if (data && data.message) {
        throw new Error(data.message);
      }
    } else {
      backendFailed = true;
    }
  } catch (backendErr: any) {
    backendFailed = true;
  }

  // Step B: Direct browser request fallback using HarakaPay API key
  if (backendFailed) {
    try {
      const directRes = await fetch(`${HARAKAPAY_DIRECT_BASE}/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': HARAKAPAY_KEY,
        },
        body: JSON.stringify({
          phone: cleanPhone,
          amount,
          description: payload.description,
        }),
      });

      const directData = await directRes.json();
      if (directData && directData.success && directData.order_id) {
        return {
          success: true,
          message: directData.message || 'Ombi la malipo (USSD push) limetumwa kwenye simu yako. Tafadhali weka PIN.',
          order_id: directData.order_id,
          amount: directData.amount || amount,
          net_amount: directData.net_amount,
          fee: directData.fee,
        };
      }

      throw new Error(
        directData?.message ||
        directData?.error ||
        'Ombi la USSD halikufanikiwa. Hakikisha namba yako haina kikao cha USSD kinachoendelea na ina salio.'
      );
    } catch (directErr: any) {
      const isCorsOrFetchErr =
        directErr?.message?.includes('Failed to fetch') ||
        directErr?.name === 'TypeError';

      if (isCorsOrFetchErr) {
        throw new Error(
          'Imeshindwa kutuma ombi la malipo. Tafadhali hakikisha namba yako ina salio kisha jaribu tena baadae.'
        );
      }

      throw new Error(
        directErr.message ||
        'Imeshindwa kutuma ombi la USSD. Hakikisha mtandao wako uko imara kisha jaribu tena.'
      );
    }
  }

  throw new Error('Hitilafu ya kuanzisha malipo. Tafadhali jaribu tena.');
}

/**
 * 2. Check Payment Status (GET /api/payment/status/:order_id or Direct HarakaPay)
 * Status verification through server route with client fallback.
 */
export async function checkPaymentStatus(orderId: string): Promise<PaymentStatusResult> {
  if (!orderId) {
    return { success: false, status: 'not_found', message: 'Order ID haipo' };
  }

  // 1. Try Backend Endpoint
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/api/payment/status/${encodeURIComponent(orderId)}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        const rawStatus = (data.status || data.payment?.status || '').toLowerCase().trim();
        return {
          success: data.success ?? (rawStatus === 'completed' || rawStatus === 'confirmed' || rawStatus === 'paid'),
          status: (rawStatus as any) || 'pending',
          message: data.message,
          payment: data.payment,
          order_id: orderId,
        };
      }
    }
  } catch {}

  // 2. Direct HarakaPay status check fallback
  try {
    const directRes = await fetch(`${HARAKAPAY_DIRECT_BASE}/status/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: {
        'X-API-Key': HARAKAPAY_KEY,
      },
    });

    const directData = await directRes.json();
    if (directData && typeof directData === 'object') {
      const rawStatus = (directData.status || directData.payment?.status || '').toLowerCase().trim();
      const isComplete =
        directData.success &&
        (rawStatus === 'completed' || rawStatus === 'confirmed' || rawStatus === 'paid' || Boolean(directData.payment?.completed_at));

      return {
        success: isComplete,
        status: (rawStatus as any) || (isComplete ? 'completed' : 'pending'),
        message: directData.message,
        payment: directData.payment,
        order_id: orderId,
      };
    }
  } catch (err: any) {
    console.warn('[Direct HarakaPay Status Warning]:', err?.message || err);
  }

  return {
    success: false,
    status: 'pending',
    order_id: orderId,
  };
}
