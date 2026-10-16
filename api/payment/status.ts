export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const HARAKAPAY_API_KEY = process.env.HARAKAPAY_API_KEY || 'hpk_93b63ba05db51f1963b174570c71762a73541195bdbc5538';
  const HARAKAPAY_BASE_URL = 'https://harakapay.net/api/v1';

  const order_id = req.query.order_id || req.query.orderId || req.url.split('/').pop()?.split('?')[0];

  if (!order_id) {
    return res.status(400).json({ success: false, message: 'order_id inahitajika' });
  }

  try {
    const response = await fetch(`${HARAKAPAY_BASE_URL}/status/${order_id}`, {
      method: 'GET',
      headers: {
        'X-API-Key': HARAKAPAY_API_KEY,
      },
    });

    const rawText = await response.text();
    let remoteStatus: any = null;
    try {
      remoteStatus = JSON.parse(rawText);
    } catch {
      console.warn('HarakaPay status returned non-JSON:', rawText);
    }
    const remoteStatusStr = (remoteStatus?.payment?.status || remoteStatus?.status || '').toLowerCase().trim();

    // STRICT CHECK: ONLY verified completed orders
    const isCompleted =
      remoteStatus?.success &&
      (['completed', 'confirmed', 'success', 'successful', 'paid', 'complete'].includes(remoteStatusStr) ||
        Boolean(remoteStatus?.payment?.completed_at));

    if (isCompleted) {
      const phone = remoteStatus?.payment?.phone || req.query.phone;
      const sbUrl = (
        process.env.VITE_SUPABASE_URL ||
        process.env.SUPABASE_URL ||
        'https://qqwlekumeltrdfvutmmt.supabase.co'
      ).trim();
      const sbKey = (
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxd2xla3VtZWx0cmRmdnV0bW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5OTU3ODYsImV4cCI6MjEwNzU3MTc4Nn0.6FDAcRqDLJ90g3CnskVxHZZm_F9t883nSGAhmCK1Ht8'
      ).trim();
      if (phone && sbUrl && sbKey) {
        try {
          const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
          await fetch(`${sbUrl.replace(/\/$/, '')}/rest/v1/nelitv_subscriptions?on_conflict=phone_number`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': sbKey,
              'Authorization': `Bearer ${sbKey}`,
              'Prefer': 'resolution=merge-duplicates',
            },
            body: JSON.stringify({
              phone_number: phone,
              premium_status: 'active',
              expires_at: expiresAt,
            }),
          });
        } catch {}
      }
      return res.json({
        success: true,
        status: 'completed',
        payment: remoteStatus.payment || remoteStatus,
      });
    }

    // If HarakaPay returned error or order does not exist
    if (remoteStatus && remoteStatus.success === false) {
      const errMsg = remoteStatus.error || remoteStatus.message || '';
      if (errMsg.toLowerCase().includes('not found')) {
        return res.status(200).json({
          success: false,
          status: 'not_found',
          message: 'Oda ya malipo haijapatikana au imekwisha muda wake. Tafadhali anzisha malipo mapya.',
          order_id,
        });
      }
    }

    return res.json({
      success: false,
      status: remoteStatusStr || 'processing',
      message: 'Malipo bado hayajathibitishwa. Weka PIN kwenye simu yako kwanza.',
      order_id,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      status: 'pending',
      message: 'Hitilafu ya mtandao kuangalia hali ya malipo.',
    });
  }
}
