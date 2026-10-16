import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Enable CORS for all origins, web views, and mobile clients
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const HARAKAPAY_API_KEY = process.env.HARAKAPAY_API_KEY || 'hpk_93b63ba05db51f1963b174570c71762a73541195bdbc5538';
const HARAKAPAY_BASE_URL = 'https://harakapay.net/api/v1';

// In-memory payment orders tracking (not saved to web disk per user preference)
const orderStore = new Map<string, {
  order_id: string;
  phone: string;
  amount: number;
  planId: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}>();

// In-memory user trial store (kept in memory, not written to disk per user preference)
const userTrialStore = new Map<string, {
  phone: string;
  trialSecondsLeft: number;
  isExpired: boolean;
  updatedAt: string;
}>();

function saveOrdersToDisk() {
  // Intentionally no-op: user requested not to store logs/files on web server
}

function saveTrialsToDisk() {
  // Intentionally no-op: user requested not to store logs/files on web server
}

async function syncSubscriptionToSupabaseServer(phone: string, planId: string) {
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
  if (!sbUrl || !sbKey || !phone) return;

  let days = 2;
  if (planId === 'standard') days = 7;
  if (planId === 'premium') days = 30;

  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const res = await fetch(`${sbUrl.replace(/\/$/, '')}/rest/v1/nelitv_subscriptions?on_conflict=phone_number`, {
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
    if (!res.ok) {
      const errText = await res.text();
      console.warn('[Server Supabase Sync API Response]:', res.status, errText);
    } else {
      console.log(`[Server Supabase Sync] Successfully persisted subscription for ${phone}`);
    }
  } catch (err) {
    console.warn('[Server Supabase Sync Warning]:', err);
  }
}

// 1. HarakaPay Collect Payment (USSD Push)
app.post('/api/payment/collect', async (req, res) => {
  try {
    const { phone, amount, description, planId } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ success: false, message: 'Namba ya simu na kiasi vinahitajika' });
    }

    // Standardize Tanzania phone: convert to 07xxxxxxxx or 06xxxxxxxx
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

    console.log(`[HarakaPay] Submitting collect request for phone: ${formattedPhone}, amount: ${payAmount}`);

    let apiResponse: any = null;
    try {
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
        signal: AbortSignal.timeout(12000),
      });

      apiResponse = await response.json();
      console.log('[HarakaPay Response]', apiResponse);
    } catch (networkErr: any) {
      console.error('[HarakaPay Network Error]', networkErr);
      return res.status(502).json({
        success: false,
        message: 'Hitilafu ya mtandao kuwasiliana na mfumo wa malipo. Tafadhali jaribu tena baada ya muda mfupi.',
      });
    }

    // Check if HarakaPay rejected the request
    if (apiResponse && apiResponse.success === false) {
      return res.status(400).json({
        success: false,
        message: apiResponse.error || apiResponse.message || 'Ombi la malipo halikufanikiwa. Hakikisha namba yako ni sahihi.',
      });
    }

    const order_id = apiResponse?.order_id || `HP${Date.now()}`;

    orderStore.set(order_id, {
      order_id,
      phone: formattedPhone,
      amount: payAmount,
      planId: planId || 'freemium',
      status: 'pending',
      created_at: new Date().toISOString(),
    });
    saveOrdersToDisk();

    return res.json({
      success: true,
      order_id,
      message: apiResponse?.message || 'Ombi la malipo (USSD push) limetumwa kwenye simu yako. Tafadhali weka PIN.',
      amount: payAmount,
      phone: formattedPhone,
      harakapay_raw: apiResponse || null
    });
  } catch (error) {
    console.error('Error in collect payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Hitilafu imetokea wakati wa kuanzisha malipo. Tafadhali jaribu tena.',
    });
  }
});

// 2. HarakaPay Check Payment Status (Strict - verifies with HarakaPay)
app.get(['/api/payment/status/:order_id', '/api/payment/status'], async (req, res) => {
  try {
    const order_id = req.params.order_id || (req.query.order_id as string) || (req.query.orderId as string);

    if (!order_id) {
      return res.status(400).json({ success: false, message: 'order_id inahitajika' });
    }

    // Check HarakaPay remote API
    let remoteStatus: any = null;
    try {
      const response = await fetch(`${HARAKAPAY_BASE_URL}/status/${order_id}`, {
        method: 'GET',
        headers: {
          'X-API-Key': HARAKAPAY_API_KEY,
        },
        signal: AbortSignal.timeout(4500),
      });
      remoteStatus = await response.json();
    } catch (e) {
      // Network timeout or transient issue
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

    const localOrder = orderStore.get(order_id);
    const remoteStatusStr = (remoteStatus?.payment?.status || remoteStatus?.status || '').toLowerCase().trim();

    // If HarakaPay verified payment is completed or confirmed
    const isRemoteCompleted =
      remoteStatus?.success &&
      (['completed', 'confirmed', 'success', 'successful', 'paid', 'complete'].includes(remoteStatusStr) ||
        Boolean(remoteStatus?.payment?.completed_at));

    if (isRemoteCompleted) {
      if (localOrder) {
        localOrder.status = 'completed';
        localOrder.completed_at = remoteStatus?.payment?.completed_at || new Date().toISOString();
        orderStore.set(order_id, localOrder);
      }
      const confirmedPhone = remoteStatus?.payment?.phone || localOrder?.phone;
      const confirmedPlan = localOrder?.planId || 'freemium';
      if (confirmedPhone) {
        syncSubscriptionToSupabaseServer(confirmedPhone, confirmedPlan).catch(() => {});
      }
      return res.json({
        success: true,
        status: 'completed',
        payment: remoteStatus?.payment || localOrder,
      });
    }

    // If local webhook has already recorded completed
    if (localOrder && localOrder.status === 'completed') {
      return res.json({
        success: true,
        status: 'completed',
        payment: localOrder,
      });
    }

    // If HarakaPay verified payment failed or was cancelled
    if (['failed', 'cancelled', 'expired'].includes(remoteStatusStr)) {
      if (localOrder) {
        localOrder.status = 'failed';
        orderStore.set(order_id, localOrder);
      }
      return res.json({
        success: false,
        status: remoteStatusStr,
        message: remoteStatus?.message || remoteStatus?.error || 'Muamala haukufanikiwa au umekatishwa na mtandao wa simu. Tafadhali jaribu tena.',
        order_id,
      });
    }

    // Payment is NOT completed yet
    return res.json({
      success: false,
      status: remoteStatusStr || 'pending',
      message: 'Tafadhali kamilisha muamala kwenye simu yako kwanza (weka PIN). Malipo bado hayajathibitishwa.',
      order_id,
    });
  } catch (error) {
    console.error('Error checking status:', error);
    return res.status(500).json({
      success: false,
      status: 'pending',
      message: 'Hitilafu wakati wa kuangalia hali ya malipo. Tafadhali jaribu tena.',
    });
  }
});

// 3. Verify payment by phone number cache catch (Fast & checks pending orders with HarakaPay)
app.get('/api/payment/verify-phone/:phone', async (req, res) => {
  const rawPhone = req.params.phone || '';
  let cleanPhone = rawPhone.trim().replace(/\s+/g, '').replace('+', '');
  if (cleanPhone.startsWith('255')) cleanPhone = '0' + cleanPhone.substring(3);

  // 1. Check if any completed order matches this phone in memory
  for (const order of orderStore.values()) {
    if (order.phone === cleanPhone && order.status === 'completed') {
      return res.json({
        success: true,
        status: 'completed',
        order,
      });
    }
  }

  // 2. Actively check HarakaPay for any pending orders created for this phone
  const matchingPendingOrders = Array.from(orderStore.values()).filter(
    (o) => o.phone === cleanPhone && o.status === 'pending'
  );

  for (const pendingOrder of matchingPendingOrders) {
    try {
      const response = await fetch(`${HARAKAPAY_BASE_URL}/status/${pendingOrder.order_id}`, {
        method: 'GET',
        headers: { 'X-API-Key': HARAKAPAY_API_KEY },
        signal: AbortSignal.timeout(3500),
      });
      const remote = await response.json();
      const statusStr = (remote?.payment?.status || remote?.status || '').toLowerCase().trim();
      const isRemoteSuccess =
        remote?.success &&
        (['completed', 'confirmed', 'success', 'successful', 'paid', 'complete'].includes(statusStr) ||
          Boolean(remote?.payment?.completed_at));

      if (isRemoteSuccess) {
        pendingOrder.status = 'completed';
        pendingOrder.completed_at = remote?.payment?.completed_at || new Date().toISOString();
        orderStore.set(pendingOrder.order_id, pendingOrder);
        return res.json({
          success: true,
          status: 'completed',
          order: pendingOrder,
        });
      }
    } catch {
      // Continue check
    }
  }

  return res.json({
    success: false,
    status: 'none',
  });
});

// 2.9 Persistent Trial Endpoints (bila kujali catches/device)
app.get('/api/user/trial-status', (req, res) => {
  const rawPhone = (req.query.phone as string || '').trim().replace(/\s+/g, '').replace('+', '');
  if (!rawPhone) {
    return res.status(400).json({ success: false, message: 'Phone number required' });
  }

  let formatted = rawPhone;
  if (formatted.startsWith('255')) formatted = '0' + formatted.substring(3);
  else if (formatted.length === 9 && (formatted.startsWith('7') || formatted.startsWith('6'))) formatted = '0' + formatted;

  let record = userTrialStore.get(formatted);
  if (!record) {
    // New registered account gets the full 1-minute (60 seconds) offer!
    record = {
      phone: formatted,
      trialSecondsLeft: 60,
      isExpired: false,
      updatedAt: new Date().toISOString(),
    };
    userTrialStore.set(formatted, record);
    saveTrialsToDisk();
  }

  return res.json({
    success: true,
    phone: formatted,
    trialSecondsLeft: record.trialSecondsLeft,
    isExpired: record.isExpired || record.trialSecondsLeft <= 0,
  });
});

app.post('/api/user/trial-consume', (req, res) => {
  const { phone, seconds } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number required' });
  }

  let formatted = String(phone).trim().replace(/\s+/g, '').replace('+', '');
  if (formatted.startsWith('255')) formatted = '0' + formatted.substring(3);
  else if (formatted.length === 9 && (formatted.startsWith('7') || formatted.startsWith('6'))) formatted = '0' + formatted;

  let record = userTrialStore.get(formatted);
  if (!record) {
    record = {
      phone: formatted,
      trialSecondsLeft: 60,
      isExpired: false,
      updatedAt: new Date().toISOString(),
    };
  }

  const deduct = Math.max(1, Number(seconds) || 1);
  record.trialSecondsLeft = Math.max(0, record.trialSecondsLeft - deduct);
  if (record.trialSecondsLeft <= 0) {
    record.trialSecondsLeft = 0;
    record.isExpired = true;
  }
  record.updatedAt = new Date().toISOString();
  userTrialStore.set(formatted, record);
  saveTrialsToDisk();

  return res.json({
    success: true,
    phone: formatted,
    trialSecondsLeft: record.trialSecondsLeft,
    isExpired: record.isExpired,
  });
});

// 3.1 Check Merchant Balance from HarakaPay
app.get('/api/payment/balance', async (_req, res) => {
  try {
    const response = await fetch(`${HARAKAPAY_BASE_URL}/balance`, {
      method: 'GET',
      headers: {
        'X-API-Key': HARAKAPAY_API_KEY,
      },
    });
    const balanceData = await response.json();
    return res.json(balanceData);
  } catch (error: any) {
    console.error('Error fetching HarakaPay balance:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch balance' });
  }
});

// 3.2 In-memory and persistent Banner Notifications
let bannerNotificationsStore = [
  {
    id: 'derby-2026-10-10',
    type: 'sports',
    title: 'Kariakoo Derby: Yanga SC vs Simba SC',
    subtitle: 'NBC Premier League • Uwanja wa Benjamin Mkapa, Dar es Salaam',
    team1Name: 'Yanga SC',
    team1Logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fa/Young_Africans_S.C._logo.svg/300px-Young_Africans_S.C._logo.svg.png',
    team2Name: 'Simba SC',
    team2Logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6b/Simba_S.C._logo.svg/300px-Simba_S.C._logo.svg.png',
    eventDate: '2026-10-10T19:00:00+03:00',
    targetChannelId: 'azam-sport-1',
    targetChannelName: 'Azam Sport 1',
    isActive: true,
    createdAt: '2026-10-09T00:00:00Z',
  },
];

app.get('/api/admin/notifications', (_req, res) => {
  return res.json(bannerNotificationsStore);
});

app.post('/api/admin/notifications', (req, res) => {
  if (Array.isArray(req.body)) {
    bannerNotificationsStore = req.body;
    return res.json({ success: true, count: bannerNotificationsStore.length });
  }
  return res.status(400).json({ success: false, message: 'Expected array of notifications' });
});

// 3b. High-performance Image Proxy (for images and CDNs that may face ISP blocking or CORS)
app.get('/api/proxy/image', async (req, res) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const parsedUrl = new URL(imageUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': parsedUrl.origin,
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch image');
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const buffer = await response.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.warn('[Image Proxy Error]:', err?.message);
    return res.status(502).send('Error proxying image');
  }
});

// TMDB Cast and Information Proxy
app.get('/api/tmdb/movie-cast', async (req, res) => {
  const title = (req.query.title as string) || '';
  const year = req.query.year as string;
  const tmdbApiKey = process.env.TMDB_API_KEY || 'f0907df18f2195dfb4a4577da53714e1';

  if (!title) {
    return res.json({ success: false, cast: [] });
  }

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}${year ? `&year=${year}` : ''}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const firstResult = searchData.results?.[0];

    if (!firstResult) {
      return res.json({ success: false, cast: [] });
    }

    const mediaType = firstResult.media_type === 'tv' ? 'tv' : 'movie';
    const creditsUrl = `https://api.themoviedb.org/3/${mediaType}/${firstResult.id}/credits?api_key=${tmdbApiKey}`;
    const creditsRes = await fetch(creditsUrl);
    const creditsData = await creditsRes.json();

    const cast = (creditsData.cast || []).slice(0, 10).map((c: any) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : undefined,
    }));

    return res.json({ success: true, cast, tmdbId: firstResult.id });
  } catch (err) {
    return res.json({ success: false, cast: [] });
  }
});

// 4. Webhook Notification from HarakaPay
app.post('/api/payment/webhook', (req, res) => {
  const { order_id, status, amount, completed_at } = req.body;
  console.log('[HarakaPay Webhook Received]:', req.body);
  if (order_id) {
    const existing = orderStore.get(order_id) || {
      order_id,
      phone: '',
      amount: amount || 0,
      planId: 'standard',
      status: (status || 'completed') as 'pending' | 'completed' | 'failed',
      created_at: new Date().toISOString(),
      completed_at: completed_at || new Date().toISOString(),
    };
    existing.status = status || 'completed';
    existing.completed_at = completed_at || new Date().toISOString();
    orderStore.set(order_id, existing);
  }
  return res.status(200).json({ received: true });
});

// 5. Proxy Dynamic Token Endpoint (streamzone.fun/api/cdn-token)
app.get('/api/stream/cdn-token', async (_req, res) => {
  try {
    const response = await fetch('https://streamzone.fun/api/cdn-token');
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error('Failed to fetch streamzone token:', err);
    return res.json({
      token: "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOiIxNzkyMTYyNjE2Iiwic2lwIjoiIiwicGF0aCI6IiIsInNlc3Npb25fY2RuX2lkIjoiNmVkYTlmNTZlMmE5YzU5MSIsInNlc3Npb25faWQiOiIiLCJjbGllbnRfaWQiOiI0ODQwODMyIiwiZGV2aWNlX2lkIjoiIiwibWF4X3Nlc3Npb25zIjowLCJzZXNzaW9uX2R1cmF0aW9uIjowLCJ1cmwiOiJodHRwczovLzEwMi4yMDguMjQ0LjkiLCJzZXNzaW9uX3RpbWVvdXQiOjAsImF1ZCI6IjciLCJzb3VyY2VzIjpbM119.6OD9tFE-CBnuqKrGEV6VAUTFZza2qzYTR16VpOaqtIfXzZ7hC9bjy0mZi-lLya8DiQHYohB2fF3IInSiLIPbEg==",
      cdnHost: "https://cdnedgch2.azamtvltd.co.tz",
      source: "live"
    });
  }
});

// 5b. High-performance HLS & IPTV Proxy for streams requiring specific Referer/Headers/CORS
app.all('/api/stream/hls-proxy', async (req, res) => {
  const targetUrl = (req.query.url as string) || '';
  const customReferer = (req.query.referer as string) || '';

  // Enable full CORS for video player
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  if (!targetUrl) {
    return res.status(400).send('Missing target URL');
  }

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': '*/*',
    };

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
    if (clientIp) {
      headers['X-Forwarded-For'] = clientIp;
      headers['X-Real-IP'] = clientIp;
    }

    if (customReferer) {
      headers['Referer'] = customReferer;
      try {
        headers['Origin'] = new URL(customReferer).origin;
      } catch {}
    } else if (targetUrl.includes('obstreamx.click')) {
      headers['Referer'] = 'https://obplay.live/';
      headers['Origin'] = 'https://obplay.live';
    }

    const upstream = await fetch(targetUrl, { headers });
    const contentType = upstream.headers.get('content-type') || '';

    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    if (!upstream.ok) {
      return res.status(upstream.status).send(`Upstream status: ${upstream.status}`);
    }

    // Check if response is an M3U8 manifest
    const isM3U8 = targetUrl.includes('.m3u8') ||
                   contentType.includes('mpegurl') ||
                   contentType.includes('application/x-mpegURL');

    if (isM3U8) {
      const text = await upstream.text();
      const lastSlashIdx = targetUrl.lastIndexOf('/');
      const baseUrl = targetUrl.substring(0, lastSlashIdx + 1);

      // Rewrite segment and nested playlist URLs to pass through proxy
      const rewritten = text.split('\n').map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          // Check for URI inside #EXT-X-KEY or #EXT-X-MAP
          if (trimmed.includes('URI="')) {
            return line.replace(/URI="([^"]+)"/, (_match, uri) => {
              let absUri = uri;
              if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
                absUri = new URL(uri, baseUrl).toString();
              }
              const proxied = `/api/stream/hls-proxy?url=${encodeURIComponent(absUri)}${customReferer ? `&referer=${encodeURIComponent(customReferer)}` : ''}`;
              return `URI="${proxied}"`;
            });
          }
          return line;
        }

        // It is a media segment or sub-playlist URL
        let absUrl = trimmed;
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          absUrl = new URL(trimmed, baseUrl).toString();
        }
        return `/api/stream/hls-proxy?url=${encodeURIComponent(absUrl)}${customReferer ? `&referer=${encodeURIComponent(customReferer)}` : ''}`;
      }).join('\n');

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(rewritten);
    }

    // Binary media chunk (.ts, .m4s, .aac, etc.)
    const buffer = Buffer.from(await upstream.arrayBuffer());
    return res.send(buffer);
  } catch (err: any) {
    console.error(`[HLS Proxy] Error fetching ${targetUrl}:`, err.message);
    return res.status(502).send('Error proxying HLS stream');
  }
});

// 6. Live Matches for Tanzanian Football (NBC Premier League & CAF)
app.get('/api/live-matches', (_req, res) => {
  res.json({
    success: true,
    matches: [
      {
        id: 'm1',
        league: 'NBC Premier League (Tanzania)',
        homeTeam: 'Simba SC',
        awayTeam: 'Young Africans SC (Yanga)',
        homeScore: 1,
        awayScore: 1,
        minute: '68\'',
        status: 'LIVE',
        period: 'Kipindi cha Pili',
        venue: 'Benjamin Mkapa Stadium, Dar es Salaam',
        channel: 'Azam Sports 1 HD',
        events: [
          { minute: '24\'', team: 'Simba SC', player: 'Jean Baleke', type: 'goal' },
          { minute: '52\'', team: 'Young Africans SC', player: 'Stephane Aziz Ki', type: 'goal' },
          { minute: '61\'', team: 'Simba SC', player: 'Aishi Manula', type: 'save' }
        ]
      },
      {
        id: 'm2',
        league: 'NBC Premier League (Tanzania)',
        homeTeam: 'Azam FC',
        awayTeam: 'Singida Black Stars',
        homeScore: 2,
        awayScore: 0,
        minute: '74\'',
        status: 'LIVE',
        period: 'Kipindi cha Pili',
        venue: 'Azam Complex, Chamazi',
        channel: 'Azam Sports 2 HD',
        events: [
          { minute: '18\'', team: 'Azam FC', player: 'Feisal Salum (Fei Toto)', type: 'goal' },
          { minute: '41\'', team: 'Azam FC', player: 'Gibril Sillah', type: 'goal' }
        ]
      },
      {
        id: 'm3',
        league: 'CAF Champions League',
        homeTeam: 'Al Ahly SC',
        awayTeam: 'Young Africans SC',
        homeScore: 0,
        awayScore: 0,
        minute: 'Leo 20:00 EAT',
        status: 'UPCOMING',
        period: 'Kabla ya Mechi',
        venue: 'Cairo International Stadium',
        channel: 'Azam Sports 3 HD',
        events: []
      },
      {
        id: 'm4',
        league: 'Ligi Kuu Zanzibar (PBZ)',
        homeTeam: 'KMKM FC',
        awayTeam: 'JKU SC',
        homeScore: 1,
        awayScore: 0,
        minute: '82\'',
        status: 'LIVE',
        period: 'Kipindi cha Pili',
        venue: 'Amaan Stadium, Zanzibar',
        channel: 'ZBC 2',
        events: [
          { minute: '35\'', team: 'KMKM FC', player: 'Ibrahim Hamad', type: 'goal' }
        ]
      }
    ]
  });
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`NeliTv web server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
