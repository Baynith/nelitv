// Stream Token & CDN Resolution Service for NeliTv web
import { Channel } from '../data/channels';

// Active live token from Azam CDN / streamzone.fun (verified 200 OK)
let cachedToken = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOiIxNzkyMTYyNjE2Iiwic2lwIjoiIiwicGF0aCI6IiIsInNlc3Npb25fY2RuX2lkIjoiNmVkYTlmNTZlMmE5YzU5MSIsInNlc3Npb25faWQiOiIiLCJjbGllbnRfaWQiOiI0ODQwODMyIiwiZGV2aWNlX2lkIjoiIiwibWF4X3Nlc3Npb25zIjowLCJzZXNzaW9uX2R1cmF0aW9uIjowLCJ1cmwiOiJodHRwczovLzEwMi4yMDguMjQ0LjkiLCJzZXNzaW9uX3RpbWVvdXQiOjAsImF1ZCI6IjciLCJzb3VyY2VzIjpbM119.6OD9tFE-CBnuqKrGEV6VAUTFZza2qzYTR16VpOaqtIfXzZ7hC9bjy0mZi-lLya8DiQHYohB2fF3IInSiLIPbEg==";
let isRefreshingToken = false;

// Background token updater: keeps the token perpetually fresh without any expiration blocking
async function refreshCdnTokenInBackground() {
  if (isRefreshingToken) return;
  isRefreshingToken = true;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('https://streamzone.fun/api/cdn-token', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.token) {
        cachedToken = data.token;
        try {
          localStorage.setItem('nelistream_cdn_token', cachedToken);
        } catch {}
      }
    }
  } catch {
    // Non-blocking fallback to local server endpoint
    try {
      const localRes = await fetch('/api/stream/cdn-token');
      if (localRes.ok) {
        const localData = await localRes.json();
        if (localData && localData.token) {
          cachedToken = localData.token;
          try {
            localStorage.setItem('nelistream_cdn_token', cachedToken);
          } catch {}
        }
      }
    } catch {}
  } finally {
    isRefreshingToken = false;
  }
}

// Initial background refresh on module load
if (typeof window !== 'undefined') {
  refreshCdnTokenInBackground().catch(() => {});
  // Periodically refresh in background every 15 minutes
  setInterval(refreshCdnTokenInBackground, 15 * 60 * 1000);
}

// INSTANT TOKEN: Returns token in 0ms without any expire date check
export function getInstantToken(): string {
  try {
    const saved = localStorage.getItem('nelistream_cdn_token');
    if (saved && saved.length > 50) return saved;
  } catch {}
  return cachedToken;
}

export async function getFreshToken(): Promise<string> {
  return getInstantToken();
}

// Fallback mirror URLs for channels if primary stream is offline or blocked
export const channelFallbackStreams: Record<string, string[]> = {
  'ze-cenema': [
    'https://d1g8wgjurz8via.cloudfront.net/bpk-tv/NGCHD/default/NGCHD.m3u8',
    'https://nowhls.wns.live/hls/stream.m3u8',
    'https://cdn4.skygo.mn/live/disk1/Moviebox/HLSv3-FTA/Moviebox.m3u8',
  ],
  'crown-tv': [
    'https://cdnedgch2.azamtvltd.co.tz/live/eds/CrownTv/DASH/CrownTv.mpd',
    'https://amg01131-tracetv-tracelatina-glewed-vtnk7.amagi.tv/playlist1080P.m3u8',
  ],
  'kix': [
    'https://cdnedgch2.azamtvltd.co.tz/live/eds/KIXMovies/DASH/KIXMovies.mpd',
    'https://rpn.bozztv.com/gusa/gusa-tvsclassicmovies/index.m3u8',
  ],
};

// Map channel to its real playable URL with live token and ClearKeys
export function getLivePlayableConfig(channel: Channel, token: string): {
  url: string;
  clearKeys?: Record<string, string>;
} {
  const cdnHost = "https://cdnedgch2.azamtvltd.co.tz";

  // Channel ClearKeys (validated against Nagra / CENC manifest headers)
  // Each key ID and key value MUST be a valid 32-character hexadecimal string.
  const channelClearKeys: Record<string, Record<string, string>> = {
    'azam-sport-1': { "c31df1600afc33799ecac543331803f2": "dd2101530e222f545997d4c553787f85" },
    'azam-sport-2': { "739e7499125b31cc9948da8057b84cf9": "1b7d44d798c351acc02f33ddfbb7682a" },
    'azam-sport-3': { "2f12d7b889de381a9fb5326ca3aa166d": "51c2d733a54306fdf89acd4c9d4f6005" },
    'azam-sport-4': { "fbcac74e355b3b5d9b6cbc56c7597dbf": "5f980e872b378d88b46f656a806205c3" },
    'sinema-zetu':  { "d628ae37a8f0336b970f250d9699461e": "1194c3d60bb494aabe9114ca46c2738e" },
    'azam-one':     { "b5cbe1bb5acf3c7f9995be428245cfcd": "89f1188a11e5e000d4443eb27ca378e1" },
    'azam-two':     { "18f515fd536b3e728e9844e77d9f0fa8": "c96dfd9b65560f87a1a95b8aeda0432d" },
    'utv':          { "31b8fc6289fe3ca698588a59d845160c": "f8c4e73f419cb80db3bdf4a974e31894" },
    'zbc-2':        { "f38b03549d023f3a883997328537bf4d": "90f9d2d9cc26009c437905692ad70730" },
    'zbc':          { "e91fec140bc5316f919b4dc9c16287d7": "79884fad0dbfcdc43d3e33c82a1f1cfa" },
    'kix':          { "a7e155b282f33335ae8d553f169f443c": "c3fdcfd5d509f1ed8550d76a525e34e5" },
    'crown-tv':     { "e3eb6e0656ec3c22aa308aaa3f82c565": "a7634d6defd2c255135095c45bc442fb" },
    'wasafi-tv':    { "8714fe102679348e9c76cfd315dacaa0": "a8b86ceda831061c13c7c4c67bd77f8e" },
  };

  // Helper to validate clearkey format strictly (must be 32 hex chars: 16 bytes)
  const rawKeys = channelClearKeys[channel.id];
  let safeClearKeys: Record<string, string> | undefined = undefined;
  if (rawKeys) {
    const validMap: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawKeys)) {
      const cleanK = k.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
      const cleanV = v.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
      if (cleanK.length === 32 && cleanV.length === 32) {
        validMap[cleanK] = cleanV;
      }
    }
    if (Object.keys(validMap).length > 0) {
      safeClearKeys = validMap;
    }
  }

  // Channel Paths
  const channelPaths: Record<string, string> = {
    'azam-sport-1': 'AzamSport1',
    'azam-sport-2': 'AzamSport2',
    'azam-sport-3': 'AzamSport3',
    'azam-sport-4': 'AzamSport4',
    'azam-sport-5': 'AzamSport5',
    'sinema-zetu':  'SinemaZetu',
    'azam-one':     'AzamOne',
    'azam-two':     'AzamTwo',
    'utv':          'UTV',
    'zbc-2':        'ZBC2',
    'zbc':          'ZBC',
    'kix':          'KIXMovies',
    'crown-tv':     'CrownTv',
    'wasafi-tv':    'WasafiTV',
  };

  const pathName = channelPaths[channel.id];

  if (pathName) {
    // Path-based /tok_${token}/ ensures ALL initialization and media segments automatically inherit the token!
    const url = `${cdnHost}/tok_${token}/live/eds/${pathName}/DASH/${pathName}.mpd`;
    return {
      url,
      clearKeys: safeClearKeys,
    };
  }

  // Direct HLS streams (sk-moments, sport-tv-1, now-global, movie-box, etc.)
  // These support CORS and load directly, falling back to proxy if needed
  return {
    url: channel.streamUrl,
    clearKeys: safeClearKeys,
  };
}
