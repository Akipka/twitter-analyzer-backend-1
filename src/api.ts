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
  days_span: number;
  earliest: string | null;
  latest: string | null;
}

export interface AnalyzeResponse {
  profile: Profile;
  stats: Stats;
  elapsed: number;
}

export interface AnalyzeError {
  error: "not_found" | "invalid_username" | "missing_key" | "unavailable" | "network";
  message: string;
  profile?: Profile;
}

const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:5000";

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
