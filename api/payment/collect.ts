export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const HARAKAPAY_API_KEY = process.env.HARAKAPAY_API_KEY || 'hpk_93b63ba05db51f1963b174570c71762a73541195bdbc5538';
  const HARAKAPAY_BASE_URL = 'https://harakapay.net/api/v1';

  try {
    const { phone, amount, description, planId } = req.body || {};

    if (!phone || !amount) {
      return res.status(400).json({ success: false, message: 'Namba ya simu na kiasi vinahitajika' });
    }

    let formattedPhone = String(phone).trim().replace(/\s+/g, '').replace('+', '');
    if (formattedPhone.startsWith('255')) {
      formattedPhone = '0' + formattedPhone.substring(3);
    } else if (formattedPhone.length === 9 && (formattedPhone.startsWith('7') || formattedPhone.startsWith('6'))) {
      formattedPhone = '0' + formattedPhone;
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount < 100) {
      return res.status(400).json({ success: false, message: 'Kiasi cha chini cha malipo ni TZS 100' });
    }

    const response = await fetch(`${HARAKAPAY_BASE_URL}/collect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': HARAKAPAY_API_KEY,
      },
      body: JSON.stringify({
        phone: formattedPhone,
        amount: payAmount,
        description: description || `Malipo ya NeliTv web - Tsh ${payAmount}`,
      }),
    });

    const rawText = await response.text();
    let apiResponse: any = null;
    try {
      apiResponse = JSON.parse(rawText);
    } catch {
      console.warn('HarakaPay returned non-JSON:', rawText);
    }

    if (!response.ok || (apiResponse && apiResponse.success === false)) {
      return res.status(400).json({
        success: false,
        message: apiResponse?.error || apiResponse?.message || 'Ombi la malipo halikufanikiwa. Hakikisha namba yako ni sahihi na haina kikao kingine cha USSD kinachoendelea.',
      });
    }

    return res.json({
      success: true,
      order_id: apiResponse?.order_id || `HP${Date.now()}`,
      message: apiResponse?.message || 'Ombi la malipo (USSD push) limetumwa kwenye simu yako. Tafadhali weka PIN.',
      amount: payAmount,
      phone: formattedPhone,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'Hitilafu ya mtandao wakati wa kuanzisha malipo. Tafadhali jaribu tena.',
    });
  }
}
