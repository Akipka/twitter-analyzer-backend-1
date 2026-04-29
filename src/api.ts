// Backend client for the Twitter Report Card API.
//
// Backend lives in the `twitter-analyzer-backend` repo and exposes:
//   GET /api/analyze/:username → { profile, stats, elapsed }

export interface Profile {
  id: string;
  userName: string;
  displayName: string;
  avatarUrl: string;
  coverUrl: string;
  description: string;
  location: string;
  followers: number;
  following: number;
  statusesCount: number;
  isBlueVerified: boolean;
  createdAt: string | null;
  url: string;
}

export interface Stats {
  // Observed span of the 30-tweet sample (days, rounded). Not a configured
  // window — kept named this way for backward compatibility with older UI.
  window_days: number;
  in_window: boolean;
  tweets_analyzed: number;
  posts: number;
  replies: number;
  total: number;
  avg_likes: number;
  avg_retweets: number;
  avg_views: number;
  avg_quotes: number;
  avg_replies_received: number;
  engagement_score: number;
  avg_chars: number;
  avg_words: number;
  unique_word_ratio: number;
  activity_per_day: number;
  // Per-day rates derived from days_span. Optional so older cached responses
  // still render — grading falls back to activity_per_day breakdowns.
  posts_per_day?: number;
  replies_per_day?: number;
  days_span: number;
  earliest: string | null;
  latest: string | null;
}

export interface ClassBreakdownEntry {
  id: string;
  label: string;
  emoji: string;
  share: number; // 0..1, % of identifiable tweets that hit this class
  hits: number;
}

export interface Classification {
  // Stable id, e.g. "defi", "perps", "nft", "trading", "shitposting",
  // "prediction", or "general" when no class crossed the recognition threshold.
  primary: string;
  label: string;
  emoji: string;
  blurb: string;
  confidence: number; // share of the primary class within total hits
  breakdown: ClassBreakdownEntry[];
  tweets_classified: number;
  tweets_total: number;
}

export interface AnalyzeResponse {
  profile: Profile;
  stats: Stats;
  // Crypto-class assignment + percentage breakdown across all classes.
  // Optional so the frontend doesn't crash if the backend hasn't been
  // updated yet (older responses just won't show the class card).
  classification?: Classification;
  elapsed: number;
  // True when the backend served deterministic synthetic data (e.g. when
  // upstream credits are exhausted but DEMO_FALLBACK is on).
  demo?: boolean;
  // True when this response was served from the backend's 24h cache (saves
  // twitterapi.io credits on popular profiles). Frontend treats it identically.
  cached?: boolean;
  cached_age_seconds?: number;
}

export interface ClassmateMember {
  username: string;
  displayName: string;
  avatarUrl?: string;
  seeded: boolean;
  addedAt: number;
}

export interface ClassmatesResponse {
  class: string;
  label: string;
  emoji: string;
  members: ClassmateMember[];
  size_cap: number;
}

export interface AnalyzeError {
  error:
    | "not_found"
    | "invalid_username"
    | "missing_key"
    | "unavailable"
    | "network"
    | "out_of_credits"
    | "upstream_auth"
    | "upstream_error"
    | "rate_limited";
  message: string;
  profile?: Profile;
}

const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:5000";

// Backend-proxied avatar URL. The proxy serves the real X profile image with
// `Access-Control-Allow-Origin: *`, which is what html2canvas needs to render
// it into the share-as-image canvas without tainting it.
export function avatarProxyUrl(username: string): string {
  const clean = username.trim().replace(/^@/, "");
  if (!clean) return "";
  return `${API_BASE}/api/avatar/${encodeURIComponent(clean)}`;
}

export async function fetchClassmates(
  classId: string,
): Promise<ClassmatesResponse | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/classmates/${encodeURIComponent(classId)}`,
    );
    if (!res.ok) return null;
    return (await res.json()) as ClassmatesResponse;
  } catch {
    return null;
  }
}

export async function analyze(
  username: string,
): Promise<AnalyzeResponse | AnalyzeError> {
  const clean = username.trim().replace(/^@/, "");
  try {
    const res = await fetch(`${API_BASE}/api/analyze/${encodeURIComponent(clean)}`);
    const data = (await res.json()) as AnalyzeResponse | AnalyzeError;
    if (!res.ok && "error" in data) return data;
    return data;
  } catch (err) {
    return {
      error: "network",
      message: err instanceof Error ? err.message : "Network error",
    };
  }
}
