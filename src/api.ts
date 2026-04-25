// ============================================================
// DIGITAL GRADEBOOK — API Layer
//
// Backend always returns valid JSON:
//   { posts, replies, total, warning? }
//
// Frontend never gets null from fetchAnalytics.
// Errors are surfaced via the `warning` field.
// ============================================================

export interface AnalyticsData {
  posts: number;
  replies: number;
  total: number;
  warning?: string;
}

export interface ProfileData {
  displayName: string;
  avatarUrl: string;
  followers: number;
}

// Resolve backend URL: env var > localhost fallback
const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

console.log('[API] Backend URL:', API_BASE);

// ============================================================
// GET /api/analyze/:username → AnalyticsData (never null)
// ============================================================

const EMPTY: AnalyticsData = { posts: 0, replies: 0, total: 0 };

export async function fetchAnalytics(username: string): Promise<AnalyticsData> {
  const url = `${API_BASE}/api/analyze/${encodeURIComponent(username)}`;
  console.log('[API] GET', url);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000); // 15s client timeout

    const r = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    const data = await r.json();

    if (
      typeof data.posts === 'number' &&
      typeof data.replies === 'number' &&
      typeof data.total === 'number'
    ) {
      console.log('[API] Response:', data);
      return data as AnalyticsData;
    }

    // Malformed response
    return {
      ...EMPTY,
      warning: 'Invalid response from server.',
    };
  } catch (e: any) {
    const msg = e?.message || String(e);
    console.error('[API] fetchAnalytics failed:', msg);

    if (e?.name === 'AbortError') {
      return {
        ...EMPTY,
        warning: 'Request timed out (15s). The server may be waking up — try again in 30 seconds.',
      };
    }

    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('net::ERR')) {
      return {
        ...EMPTY,
        warning: 'Backend is not reachable. Make sure the server is running.',
      };
    }

    return {
      ...EMPTY,
      warning: `Request failed: ${msg}`,
    };
  }
}

// ============================================================
// FXTwitter: profile + avatar (CORS-friendly, no backend)
// ============================================================

export async function fetchProfile(username: string): Promise<ProfileData | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);

    const r = await fetch(
      `https://api.fxtwitter.com/${encodeURIComponent(username)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!r.ok) return null;
    const d = await r.json();
    if (!d?.user) return null;
    return {
      displayName: d.user.name || username,
      avatarUrl: d.user.avatar_url || '',
      followers: d.user.followers ?? 0,
    };
  } catch {
    return null;
  }
}
