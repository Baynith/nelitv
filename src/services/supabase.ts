import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables configured through system configuration with user project defaults
const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL || 'https://qqwlekumeltrdfvutmmt.supabase.co'
).trim();
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxd2xla3VtZWx0cmRmdnV0bW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5OTU3ODYsImV4cCI6MjEwNzU3MTc4Nn0.6FDAcRqDLJ90g3CnskVxHZZm_F9t883nSGAhmCK1Ht8'
).trim();

export interface NeliTVSubscription {
  id?: string | number;
  created_at?: string;
  phone_number: string;
  premium_status: 'active' | 'inactive' | 'expired';
  expires_at: string;
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '[NeliTV Supabase] VITE_SUPABASE_URL au VITE_SUPABASE_ANON_KEY haijawekwa kwenye mazingira. Tafadhali weka kwenye environment variables.'
    );
    return null;
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return supabaseInstance;
  } catch (err) {
    console.warn('[NeliTV Supabase] Hitilafu ya kuunganisha Supabase:', err);
    return null;
  }
}

/**
 * Checks if Supabase client is actively configured
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Clean phone number for consistency in Supabase: standard 07xxxxxxxx or 06xxxxxxxx
 */
export function normalizePhoneForSupabase(phone: string): string {
  let clean = String(phone).trim().replace(/\s+/g, '').replace('+', '');
  if (clean.startsWith('255')) {
    clean = '0' + clean.substring(3);
  } else if (clean.length === 9 && (clean.startsWith('7') || clean.startsWith('6'))) {
    clean = '0' + clean;
  }
  return clean;
}

/**
 * Retrieves a customer's active subscription from Supabase "nelitv_subscriptions"
 */
export async function getSubscriptionFromSupabase(phone: string): Promise<NeliTVSubscription | null> {
  const client = getSupabase();
  if (!client) return null;

  const cleanPhone = normalizePhoneForSupabase(phone);
  if (!cleanPhone || cleanPhone.length < 10) return null;

  try {
    const { data, error } = await client
      .from('nelitv_subscriptions')
      .select('id, created_at, phone_number, premium_status, expires_at')
      .eq('phone_number', cleanPhone)
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[NeliTV Supabase Query Error]:', error.message);
      return null;
    }

    if (!data) return null;

    const expiresAtMs = new Date(data.expires_at).getTime();
    const isStillActive = expiresAtMs > Date.now() && data.premium_status === 'active';

    return {
      id: data.id,
      created_at: data.created_at,
      phone_number: data.phone_number,
      premium_status: isStillActive ? 'active' : 'expired',
      expires_at: data.expires_at,
    };
  } catch (err) {
    console.warn('[NeliTV Supabase Read Exception]:', err);
    return null;
  }
}

/**
 * Retrieves a customer's active subscription by either phone, email, or user_id
 */
export async function getSubscriptionFromSupabaseByAny(
  identifier: string
): Promise<NeliTVSubscription | null> {
  const client = getSupabase();
  if (!client) return null;
  const raw = String(identifier || '').trim();
  if (!raw) return null;

  try {
    const cleanPhone = normalizePhoneForSupabase(raw);
    let query = client.from('nelitv_subscriptions').select('id, created_at, phone_number, premium_status, expires_at');

    if (cleanPhone && cleanPhone.length >= 10) {
      query = query.or(`phone_number.eq.${cleanPhone},user_email.eq.${raw.toLowerCase()},user_id.eq.${raw}`);
    } else if (raw.includes('@')) {
      query = query.eq('user_email', raw.toLowerCase());
    } else {
      query = query.eq('user_id', raw);
    }

    const { data, error } = await query
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    const expiresAtMs = new Date(data.expires_at).getTime();
    const isStillActive = expiresAtMs > Date.now() && data.premium_status === 'active';

    return {
      id: data.id,
      created_at: data.created_at,
      phone_number: data.phone_number,
      premium_status: isStillActive ? 'active' : 'expired',
      expires_at: data.expires_at,
    };
  } catch {
    return null;
  }
}

/**
 * Saves or updates a customer's subscription in "nelitv_subscriptions"
 */
export async function saveSubscriptionToSupabase(
  phone: string,
  expiresAtMs: number,
  premiumStatus: 'active' | 'inactive' | 'expired' = 'active'
): Promise<boolean> {
  const client = getSupabase();
  if (!client) {
    console.warn('[NeliTV Supabase] Supabase is not configured; skipping cloud sync.');
    return false;
  }

  const cleanPhone = normalizePhoneForSupabase(phone);
  if (!cleanPhone || cleanPhone.length < 10) return false;

  const expiresAtISO = new Date(expiresAtMs).toISOString();

  try {
    // Check if record already exists for this phone
    const { data: existing } = await client
      .from('nelitv_subscriptions')
      .select('id')
      .eq('phone_number', cleanPhone)
      .maybeSingle();

    if (existing?.id) {
      // Update existing record
      const { error: updateError } = await client
        .from('nelitv_subscriptions')
        .update({
          premium_status: premiumStatus,
          expires_at: expiresAtISO,
        })
        .eq('id', existing.id);

      if (updateError) {
        console.warn('[NeliTV Supabase Update Error]:', updateError.message);
        return false;
      }
      return true;
    } else {
      // Insert new record
      const { error: insertError } = await client
        .from('nelitv_subscriptions')
        .insert({
          phone_number: cleanPhone,
          premium_status: premiumStatus,
          expires_at: expiresAtISO,
        });

      if (insertError) {
        console.warn('[NeliTV Supabase Insert Error]:', insertError.message);
        return false;
      }
      return true;
    }
  } catch (err) {
    console.warn('[NeliTV Supabase Write Exception]:', err);
    return false;
  }
}
