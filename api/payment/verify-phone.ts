export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawPhone = req.query.phone || req.url.split('/').pop()?.split('?')[0];

  if (!rawPhone) {
    return res.status(400).json({ success: false, message: 'Namba ya simu inahitajika' });
  }

  let cleanPhone = String(rawPhone).trim().replace(/\s+/g, '').replace('+', '');
  if (cleanPhone.startsWith('255')) cleanPhone = '0' + cleanPhone.substring(3);

  // Checks can be supplemented by database
  return res.json({
    success: false,
    status: 'none',
    phone: cleanPhone,
  });
}
