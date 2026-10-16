export interface BannerNotification {
  id: string;
  type: 'sports' | 'movie';
  title: string;
  subtitle?: string;
  // Sports details
  team1Name?: string;
  team1Logo?: string;
  team2Name?: string;
  team2Logo?: string;
  // Movie details
  posterUrl?: string;
  description?: string;
  // Timing & channel
  eventDate: string; // ISO format e.g. "2026-10-10T19:00:00+03:00"
  targetChannelId: string;
  targetChannelName?: string;
  isActive: boolean;
  createdAt?: string;
}

// Preset Kariakoo Derby for October 10, 2026 at 7:00 PM (19:00 EAT)
export const DEFAULT_NOTIFICATIONS: BannerNotification[] = [
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

const STORAGE_KEY = 'nelistream_banner_notifications';

export async function fetchBannerNotifications(): Promise<BannerNotification[]> {
  try {
    const res = await fetch('/api/admin/notifications');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch (err) {
    console.warn('Could not fetch remote banner notifications, using cached/default', err);
  }

  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  return DEFAULT_NOTIFICATIONS;
}

export async function saveBannerNotifications(notifications: BannerNotification[]): Promise<boolean> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    const res = await fetch('/api/admin/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notifications),
    });
    return res.ok;
  } catch (err) {
    console.error('Error saving banner notifications', err);
    return false;
  }
}
