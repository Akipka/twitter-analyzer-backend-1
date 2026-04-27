// Grading logic for the Twitter Report Card.
//
// Each subject takes raw stats from the backend and maps them to a letter
// grade (F → A+) plus a short, slightly mocking teacher's comment. GPA is
// the average across all six subjects (0..5 internally, displayed on a
// 0..10 scale).

import type { Profile, Stats } from "./api";

export type Grade = "F" | "D" | "C" | "B" | "A" | "A+";

export interface SubjectGrade {
  id: string;
  name: string;
  emoji: string;
  description: string;
  grade: Grade;
  numeric: number; // 0..5 (F..A+)
  comment: string; // short ironic teacher's note
  metric: { label: string; value: string };
}

export interface ReportCard {
  subjects: SubjectGrade[];
  gpa: number; // 0..5
  verdict: Verdict;
}

export interface Verdict {
  kind: "expelled" | "d_student" | "c_student" | "b_student" | "a_student";
  title: string;
  subtitle: string;
}

// ── Grade utilities ────────────────────────────────────────────────────────

const GRADE_ORDER: Grade[] = ["F", "D", "C", "B", "A", "A+"];

function bucket(value: number, thresholds: [number, number, number, number, number]): Grade {
  // thresholds = minimums for D, C, B, A, A+ (ascending).
  if (value < thresholds[0]) return "F";
  if (value < thresholds[1]) return "D";
  if (value < thresholds[2]) return "C";
  if (value < thresholds[3]) return "B";
  if (value < thresholds[4]) return "A";
  return "A+";
}

function gradeNumeric(g: Grade): number {
  return GRADE_ORDER.indexOf(g);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(Math.floor(seed)) % arr.length];
}

// ── Comments (ironic, mocking, in English) ─────────────────────────────────

const TWEETOLOGY_COMMENTS: Record<Grade, string[]> = {
  "F": [
    "Doesn't post. Timeline is a graveyard.",
    "Silent as a fish. Not even crickets.",
  ],
  "D": [
    "A couple of posts a month. Stage fright?",
    "Posts less often than the IRS sends good news.",
  ],
  "C": [
    "Posts, but without spark.",
    "Average user energy. Neither bad nor good.",
  ],
  "B": [
    "Regular author. The timeline is alive.",
    "Steady content supplier.",
  ],
  "A": [
    "Content machine. The feed breathes.",
    "Pro level. The algorithm remembers.",
  ],
  "A+": [
    "Nonstop hot-take factory. X exists for people like this.",
    "Posting maniac. Borderline LLM.",
  ],
};

const REPLYOLOGY_COMMENTS: Record<Grade, string[]> = {
  "F": [
    "Replies to no one. Pure introvert.",
    "The replies are a desert.",
  ],
  "D": [
    "Occasionally nods in the comments.",
    "Treats replies like cold water.",
  ],
  "C": [
    "Replies, but without enthusiasm.",
    "Average conversationalist.",
  ],
  "B": [
    "Active in conversations. Solid.",
    "Likes to talk, and it shows.",
  ],
  "A": [
    "Soul of the replies. Knows everyone.",
    "Internet arguments are home.",
  ],
  "A+": [
    "Lives in the replies. Possibly never sleeps.",
    "Replies before they finish reading.",
  ],
};

const VIRALITY_COMMENTS: Record<Grade, string[]> = {
  "F": [
    "No likes. Posting into the void.",
    "The audience pretends they don't exist.",
  ],
  "D": [
    "Weak engagement. The algorithm is not impressed.",
    "Likes arrive like a paycheck — once a week.",
  ],
  "C": [
    "Mid engagement. Below the line.",
    "Doesn't anger anyone, doesn't excite anyone.",
  ],
  "B": [
    "Solid engagement. Followers actually read.",
    "Hot takes land, just not on the FYP.",
  ],
  "A": [
    "Going viral is the norm.",
    "The algorithm respects this account.",
  ],
  "A+": [
    "Every post is an event. Likes and reposts fly in.",
    "X micro-celebrity, basically.",
  ],
};

const SMARTOLOGY_COMMENTS: Record<Grade, string[]> = {
  "F": [
    "Writes 'lol' and 'lmao'. Enough said.",
    "Vocabulary: emoji and one word.",
  ],
  "D": [
    "Limited lexicon. Limited thoughts.",
    "Boilerplate phrases. AI is more diverse.",
  ],
  "C": [
    "Average intellectual level.",
    "Occasionally produces something meaningful.",
  ],
  "B": [
    "Writes thoughtfully. Clearly thinks.",
    "Good style, real takes.",
  ],
  "A": [
    "Tweets read like mini-essays. Respect.",
    "Visible erudition and craft.",
  ],
  "A+": [
    "Quotable in textbooks.",
    "Every word in place. Twitter literature.",
  ],
};

const CREATIVITY_COMMENTS: Record<Grade, string[]> = {
  "F": [
    "Repeats endlessly. Same post on loop.",
    "Every tweet a copy of the last.",
  ],
  "D": [
    "Same topics week after week.",
    "Creativity on minimum effort.",
  ],
  "C": [
    "Sometimes surprises. More often, doesn't.",
    "Standard topic set.",
  ],
  "B": [
    "Diverse content.",
    "Different angles, different forms.",
  ],
  "A": [
    "Creativity, breadth, variety.",
    "Each tweet finds a new angle.",
  ],
  "A+": [
    "Brilliant range. Never repeats.",
    "Content artist, not content conveyor belt.",
  ],
};

const ACTIVITY_COMMENTS: Record<Grade, string[]> = {
  "F": [
    "Logs into X once every six months.",
    "Account exists. Shows no vital signs.",
  ],
  "D": [
    "Visits rarely, posts even rarer.",
    "Activity level: dial-up.",
  ],
  "C": [
    "Active when in the mood.",
    "Depends on having something to say.",
  ],
  "B": [
    "Steady activity. Solid.",
    "Says something every day.",
  ],
  "A": [
    "X is a second home.",
    "Constant presence. The feed never empties.",
  ],
  "A+": [
    "Lives in X. Possibly eats and sleeps there.",
    "Bot-tier consistency. Just human.",
  ],
};

// ── Subject scorers ────────────────────────────────────────────────────────

function gradeTweetology(stats: Stats): SubjectGrade {
  // Original posts (non-replies) in the window (default 30 days).
  // Calibrated against real X distributions: median active user posts ~5–20/30d,
  // power users 80–300/30d, content factories 500+/30d. Thresholds scale
  // proportionally if the window is shorter/longer than 30 days.
  // F: <3/30d (lurker), D: <20 (rare), C: <60 (casual), B: <150 (regular),
  // A: <350 (creator), A+: 350+ (machine).
  const w = Math.max(stats.window_days, 1) / 30;
  const v = stats.posts;
  const grade = bucket(v, [3 * w, 20 * w, 60 * w, 150 * w, 350 * w]);
  return {
    id: "tweetology",
    name: "Tweetology",
    emoji: "📝",
    description: "Original posts produced over the period",
    grade,
    numeric: gradeNumeric(grade),
    comment: pick(TWEETOLOGY_COMMENTS[grade], v + 1),
    metric: { label: "posts", value: String(v) },
  };
}

function gradeReplyology(stats: Stats): SubjectGrade {
  // Replies in the window. Most users barely reply; conversationalists hit
  // 30–150/30d; reply-guys clear 400+/30d.
  // F: <2/30d (silent), D: <15 (rare), C: <50 (occasional), B: <150 (chatty),
  // A: <400 (reply-guy), A+: 400+ (lives in replies).
  const w = Math.max(stats.window_days, 1) / 30;
  const v = stats.replies;
  const grade = bucket(v, [2 * w, 15 * w, 50 * w, 150 * w, 400 * w]);
  return {
    id: "replyology",
    name: "Reply-ology",
    emoji: "💬",
    description: "Reply activity",
    grade,
    numeric: gradeNumeric(grade),
    comment: pick(REPLYOLOGY_COMMENTS[grade], v + 7),
    metric: { label: "replies", value: String(v) },
  };
}

function gradeVirality(stats: Stats, profile: Profile): SubjectGrade {
  // For accounts with a real audience use engagement rate (escapes follower-
  // count bias). For tiny accounts use raw avg likes.
  // Industry benchmarks: median X engagement rate is ~0.045%; 1–2% is good;
  // 5%+ is genuine virality; 10%+ is rare.
  // F: <0.1%, D: <0.5%, C: <1.5%, B: <4%, A: <10%, A+: 10%+.
  const followers = profile.followers;
  let grade: Grade;
  let metricValue: string;
  let metricLabel: string;
  if (followers >= 200) {
    const rate = stats.engagement_score / Math.max(followers, 1);
    grade = bucket(rate, [0.001, 0.005, 0.015, 0.04, 0.10]);
    metricValue = `${(rate * 100).toFixed(2)}%`;
    metricLabel = "engagement rate";
  } else {
    // Tiny accounts: judge by raw likes. Most micro-accounts get <2 ❤/tweet.
    const v = stats.avg_likes;
    grade = bucket(v, [0.3, 1.5, 5, 15, 40]);
    metricValue = `${stats.avg_likes.toFixed(1)} ❤`;
    metricLabel = "avg ❤ / tweet";
  }
  return {
    id: "virality",
    name: "Virology",
    emoji: "🔥",
    description: "How well content escapes the bubble",
    grade,
    numeric: gradeNumeric(grade),
    comment: pick(VIRALITY_COMMENTS[grade], stats.engagement_score + 13),
    metric: { label: metricLabel, value: metricValue },
  };
}

function gradeSmartology(stats: Stats): SubjectGrade {
  // Composite of substance: avg words per tweet (depth of expression) plus
  // lexical diversity (vocabulary breadth). 280-char limit caps tweets at
  // ~50 words. Median X tweet ≈ 12–15 words; 30+ words is thoughtful;
  // 40+ is essay-tier.
  const lengthScore = Math.min(stats.avg_words / 40, 1);
  const diversity = stats.unique_word_ratio;
  const score = lengthScore * 0.55 + diversity * 0.45;
  // Tightened: median user (12 words, 0.55 div) scores ~0.41 → C.
  const grade = bucket(score, [0.22, 0.36, 0.50, 0.64, 0.80]);
  return {
    id: "smartology",
    name: "Smart-ology",
    emoji: "🧠",
    description: "Depth and substance of the content",
    grade,
    numeric: gradeNumeric(grade),
    comment: pick(SMARTOLOGY_COMMENTS[grade], stats.avg_words * 3 + 2),
    metric: {
      label: "avg words / tweet",
      value: stats.avg_words.toFixed(1),
    },
  };
}

function gradeCreativity(stats: Stats): SubjectGrade {
  // Lexical diversity = unique non-trivial words / total. Clean LLM-free proxy
  // for "how much new vocabulary the author actually uses".
  // Real range: 0.35 (repetitive) – 0.85 (very varied). Spammers/bots cluster
  // in 0.20–0.40. Median creator sits at ~0.55.
  const v = stats.unique_word_ratio;
  const grade = bucket(v, [0.32, 0.44, 0.55, 0.68, 0.80]);
  return {
    id: "creativity",
    name: "Creatology",
    emoji: "🎨",
    description: "Variety of topics and phrasing",
    grade,
    numeric: gradeNumeric(grade),
    comment: pick(CREATIVITY_COMMENTS[grade], v * 100 + 5),
    metric: { label: "lexical diversity", value: v.toFixed(2) },
  };
}

function gradeActivity(stats: Stats): SubjectGrade {
  // Tweets+replies per day across the observed range. Real distribution:
  // most users <0.5/day; active 1–3/day; power users 5–10/day; bots/maniacs 20+.
  // F: <0.15, D: <0.7, C: <2.5, B: <6, A: <15, A+: 15+.
  const v = stats.activity_per_day;
  const grade = bucket(v, [0.15, 0.7, 2.5, 6.0, 15.0]);
  return {
    id: "activity",
    name: "Activology",
    emoji: "⚡",
    description: "Day-to-day presence on X",
    grade,
    numeric: gradeNumeric(grade),
    comment: pick(ACTIVITY_COMMENTS[grade], v * 11 + 1),
    metric: { label: "tweets / day", value: v.toFixed(1) },
  };
}

// ── Main: build the report card ────────────────────────────────────────────

export function buildReportCard(profile: Profile, stats: Stats): ReportCard {
  if (stats.total === 0) {
    const subjects: SubjectGrade[] = [
      gradeTweetology(stats),
      gradeReplyology(stats),
      gradeVirality(stats, profile),
      gradeSmartology(stats),
      gradeCreativity(stats),
      gradeActivity(stats),
    ];
    return {
      subjects,
      gpa: 0,
      verdict: {
        kind: "expelled",
        title: "Expelled",
        subtitle: "Account is silent. Zero posts in the analysis window.",
      },
    };
  }

  const subjects: SubjectGrade[] = [
    gradeTweetology(stats),
    gradeReplyology(stats),
    gradeVirality(stats, profile),
    gradeSmartology(stats),
    gradeCreativity(stats),
    gradeActivity(stats),
  ];

  const gpa = subjects.reduce((acc, s) => acc + s.numeric, 0) / subjects.length;

  const verdict: Verdict = (() => {
    if (gpa < 0.6) {
      return {
        kind: "expelled",
        title: "Expelled",
        subtitle: "Skips class. Feed is comatose.",
      };
    }
    if (gpa < 1.6) {
      return {
        kind: "d_student",
        title: "D-Student",
        subtitle: "Sits in the back, looks out the window. There's hope.",
      };
    }
    if (gpa < 2.6) {
      return {
        kind: "c_student",
        title: "C-Student",
        subtitle: "Confident average. Not failing — that's something.",
      };
    }
    if (gpa < 3.6) {
      return {
        kind: "b_student",
        title: "B-Student",
        subtitle: "Won't make valedictorian, but the school respects them.",
      };
    }
    return {
      kind: "a_student",
      title: "Top of the Class",
      subtitle: "Class president. First in the teacher's ledger.",
    };
  })();

  return { subjects, gpa, verdict };
}
