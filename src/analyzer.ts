// ============================================================
// DIGITAL GRADEBOOK — Grading Engine
// Uses ONLY real data. Zero simulation.
// If data is missing → the subject gets no score.
// ============================================================

export interface AnalyticsData {
  posts: number;
  replies: number;
  total: number;
  warning?: string;
}

export interface SubjectGrade {
  id: string;
  name: string;
  icon: string;
  score: number;
  grade: number;
  letter: string;
  teacher: string;
  comment: string;
  details: string;
}

export interface Report {
  username: string;
  displayName: string;
  period: string;
  generatedAt: string;
  subjects: SubjectGrade[];
  averageScore: number;
  averageGrade: number;
  verdict: string;
  verdictEmoji: string;
  verdictComment: string;
  totalPosts: number;
  totalReplies: number;
  totalActivity: number;
  analytics: AnalyticsData;
  warning?: string;
}

// ============================================================
// Scoring helpers
// ============================================================

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, v));
}

function pw(value: number, bp: [number, number][]): number {
  if (value <= bp[0][0]) return bp[0][1];
  for (let i = 0; i < bp.length - 1; i++) {
    if (value <= bp[i + 1][0]) {
      const t = (value - bp[i][0]) / (bp[i + 1][0] - bp[i][0]);
      return bp[i][1] + t * (bp[i + 1][1] - bp[i][1]);
    }
  }
  return bp[bp.length - 1][1];
}

function toGrade(score: number) {
  if (score >= 87) return { grade: 5, letter: 'A' };
  if (score >= 70) return { grade: 4, letter: 'B' };
  if (score >= 50) return { grade: 3, letter: 'C' };
  if (score >= 30) return { grade: 2, letter: 'D' };
  return { grade: 1, letter: 'F' };
}

function pick(g: number, p: Record<number, string[]>) {
  const a = p[g] ?? p[3] ?? ['—'];
  return a[g % a.length];
}

// ============================================================
// Subjects — graded purely from real post/reply counts
// ============================================================

// Twitology: posts in 30 days
// 0=dead, 10=low, 30=ok, 60=good, 90+=strong, 200+=spam
function gradeTwitology(posts: number): SubjectGrade {
  const daily = posts / 30;
  let score = pw(daily, [
    [0, 3], [0.3, 15], [0.8, 35], [1.5, 50], [2.5, 65],
    [4, 80], [6, 92], [8, 88], [12, 70], [20, 40],
  ]);
  score = clamp(Math.round(score));
  const { grade, letter } = toGrade(score);

  return {
    id: 'twitology', name: 'Twitology', icon: '📝',
    score, grade, letter,
    teacher: 'Prof. Tweetov A.B.',
    comment: pick(grade, {
      5: ['Posting machine. The algorithm bows to you.', 'Consistent, frequent, always on-point.'],
      4: ['Solid posting rhythm. Reliable pipeline.', 'Almost automatic — just needs more spark.'],
      3: ['Posts when the mood strikes.', 'Occasional bursts between radio silence.'],
      2: ['Barely registers on the timeline.', 'Less frequent than dentist visits.'],
      1: ['Digital tumbleweed.', 'Does this user even know Twitter exists?'],
    }),
    details: `${posts} posts in 30 days (${daily.toFixed(1)}/day)`,
  };
}

// Replyology: replies in 30 days, balanced against posts
function gradeReplyology(replies: number, posts: number): SubjectGrade {
  const daily = replies / 30;
  const ratio = posts > 0 ? replies / posts : (replies > 0 ? 99 : 0);

  let vol = pw(daily, [
    [0, 8], [0.5, 30], [2, 60], [4, 78], [7, 85], [12, 70], [20, 45], [40, 15],
  ]);

  // Penalise if reply-heavy without creating content
  let factor = 1;
  if (ratio > 8) factor = 0.4;
  else if (ratio > 5) factor = 0.6;
  else if (ratio > 3) factor = 0.85;
  else if (ratio === 0 && replies === 0) factor = 0.3;

  const score = clamp(Math.round(vol * factor));
  const { grade, letter } = toGrade(score);

  return {
    id: 'replyology', name: 'Replyology', icon: '💬',
    score, grade, letter,
    teacher: 'Assoc. Prof. Replyova V.G.',
    comment: pick(grade, {
      5: ['Master of conversation. On-point, never excessive.', 'Perfect create/engage balance.'],
      4: ['Good engagement. You listen and respond.', 'Active without being spammy.'],
      3: ['Replies when convenient. Not the life of the party.', 'Could engage more. Or less.'],
      2: ['Either spamming every thread or ghosting.', 'Balance is key.'],
      1: ['Zero meaningful engagement.', 'It\'s called a SOCIAL network.'],
    }),
    details: `${replies} replies in 30 days (${daily.toFixed(1)}/day) · ratio: ${ratio.toFixed(1)}x`,
  };
}

// Virology: engagement score from total activity
// Higher total = more engagement potential
function gradeVirology(total: number): SubjectGrade {
  // Total activity over 30 days as proxy for engagement
  // This is weak without likes/retweets but it's what we have
  const daily = total / 30;
  let score = pw(daily, [
    [0, 3], [1, 20], [3, 40], [5, 55], [10, 70], [20, 82], [40, 90], [80, 95],
  ]);
  score = clamp(Math.round(score));
  const { grade, letter } = toGrade(score);

  return {
    id: 'virology', name: 'Virology', icon: '🔥',
    score, grade, letter,
    teacher: 'Prof. Virusov S.D.',
    comment: pick(grade, {
      5: ['Massive activity footprint. Engagement machine.', 'Your presence is felt everywhere.'],
      4: ['Strong engagement footprint.', 'Above-average impact.'],
      3: ['Mid-tier activity. Party where guests check phones.', 'Some resonance, mostly quiet.'],
      2: ['Barely a blip on the radar.', 'Sub-noise levels.'],
      1: ['The void stares back.', 'Zero impact detected.'],
    }),
    details: `${total} total interactions in 30 days (${daily.toFixed(1)}/day)`,
  };
}

// Smartology: from posts/day ratio (no text analysis without backend)
function gradeSmartology(posts: number): SubjectGrade {
  const daily = posts / 30;

  // We can't analyze text without backend, but we can rate effort
  // Higher post count = more effort = smarter approach to content
  let score = pw(daily, [
    [0, 5], [0.5, 25], [1, 45], [2, 60], [3, 72], [5, 82], [8, 88], [15, 78],
  ]);
  score = clamp(Math.round(score));
  const { grade, letter } = toGrade(score);

  return {
    id: 'smartology', name: 'Smartology', icon: '🧠',
    score, grade, letter,
    teacher: 'Prof. Umnova E.K.',
    comment: pick(grade, {
      5: ['Consistent content output suggests strategic thinking.', 'Disciplined approach to content.'],
      4: ['Thoughtful posting cadence.', 'Quality over quantity approach visible.'],
      3: ['Some thought behind posts, but inconsistent.', 'Could be more strategic.'],
      2: ['Posting appears random. No clear strategy.', 'Effort is minimal.'],
      1: ['No evidence of content strategy.', 'Content IQ: room temperature.'],
    }),
    details: `${posts} posts (${daily.toFixed(1)}/day) — text analysis requires backend`,
  };
}

// Creativology: ratio of original posts vs replies
// More original posts = more creative output
function gradeCreativology(posts: number, replies: number): SubjectGrade {
  const total = posts + replies;
  if (total === 0) {
    return {
      id: 'creativology', name: 'Creativology', icon: '🎨',
      score: 3, grade: 1, letter: 'F',
      teacher: 'Assoc. Prof. Kreativova L.M.',
      comment: 'No content to evaluate. Blank canvas.',
      details: '0 posts + 0 replies',
    };
  }

  const originalRatio = posts / total; // 0 = all replies, 1 = all posts
  let score = pw(originalRatio, [
    [0, 10], [0.2, 30], [0.35, 50], [0.5, 65], [0.65, 80], [0.8, 90], [1, 85],
  ]);
  score = clamp(Math.round(score));
  const { grade, letter } = toGrade(score);

  return {
    id: 'creativology', name: 'Creativology', icon: '🎨',
    score, grade, letter,
    teacher: 'Assoc. Prof. Kreativova L.M.',
    comment: pick(grade, {
      5: ['Mostly original content. True creator, not a commentator.', 'Originality off the charts.'],
      4: ['Good balance of original vs. replies.', 'Creative voice is strong.'],
      3: ['Mix of original and replies. Leaning commentator.', 'Could create more.'],
      2: ['Mostly replies. Barely any original thoughts.', 'Reply guy energy.'],
      1: ['Zero original content. Professional reply guy.', 'Creativity of a parrot.'],
    }),
    details: `${(originalRatio * 100).toFixed(0)}% original content (${posts} posts / ${total} total)`,
  };
}

// Activology: total activity regularity
function gradeActivology(total: number): SubjectGrade {
  const daily = total / 30;
  let score = pw(daily, [
    [0, 0], [0.5, 20], [1, 40], [3, 55], [5, 68], [10, 80], [20, 90], [40, 95],
  ]);
  score = clamp(Math.round(score));
  const { grade, letter } = toGrade(score);

  return {
    id: 'activology', name: 'Activology', icon: '⚡',
    score, grade, letter,
    teacher: 'Prof. Aktivov N.E.',
    comment: pick(grade, {
      5: ['Everywhere, always. Relentless presence.', 'Fitness-tracker levels of activity.'],
      4: ['Reliable presence on the timeline.', 'Consistent with occasional off days.'],
      3: ['Hit-or-miss. Some weeks fire, others silence.', 'Activity comes in waves.'],
      2: ['Sporadic comet. Appears, vanishes.', 'Binge then hibernate.'],
      1: ['Digital flatline.', 'Presumed MIA.'],
    }),
    details: `${total} total actions in 30 days (${daily.toFixed(1)}/day)`,
  };
}

// ============================================================
// Build report from REAL analytics data only
// ============================================================

export function buildReport(
  username: string,
  displayName: string,
  analytics: AnalyticsData,
): Report {
  const { posts, replies, total } = analytics;

  const subjects = [
    gradeTwitology(posts),
    gradeReplyology(replies, posts),
    gradeVirology(total),
    gradeSmartology(posts),
    gradeCreativology(posts, replies),
    gradeActivology(total),
  ];

  const avgScore = subjects.reduce((s, sub) => s + sub.score, 0) / subjects.length;
  const avgGrade = subjects.reduce((s, sub) => s + sub.grade, 0) / subjects.length;

  let verdict: string, emoji: string, comment: string;
  if (avgGrade >= 4.5) { verdict = "STRAIGHT A's"; emoji = '🏅'; comment = 'Exemplary content creator. Faculty standing ovation!'; }
  else if (avgGrade >= 3.5) { verdict = 'HONOR ROLL'; emoji = '👍'; comment = 'Solid performer with room to grow.'; }
  else if (avgGrade >= 2.5) { verdict = 'PASSING'; emoji = '😐'; comment = 'Work accepted. Barely.'; }
  else if (avgGrade >= 1.5) { verdict = 'FAILING'; emoji = '😬'; comment = 'Parents summoned to principal\'s office.'; }
  else { verdict = 'EXPELLED'; emoji = '💀'; comment = 'Scholarship revoked.'; }

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 30);

  return {
    username,
    displayName,
    period: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    generatedAt: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    subjects,
    averageScore: Math.round(avgScore * 10) / 10,
    averageGrade: Math.round(avgGrade * 100) / 100,
    verdict, verdictEmoji: emoji, verdictComment: comment,
    totalPosts: posts,
    totalReplies: replies,
    totalActivity: total,
    analytics,
    warning: analytics.warning,
  };
}

// ============================================================
// Share text
// ============================================================

export function generateShareText(report: Report): string {
  const lines = [
    `📋 DIGITAL GRADEBOOK @${report.username}`,
    '━━━━━━━━━━━━━━━━━━━━━',
  ];
  for (const s of report.subjects) lines.push(`${s.icon} ${s.name}: ${s.grade} (${s.score}/100)`);
  lines.push('━━━━━━━━━━━━━━━━━━━━━');
  lines.push(`📊 Average: ${report.averageGrade.toFixed(2)}`);
  lines.push(`${report.verdictEmoji} Verdict: ${report.verdict}`);
  return lines.join('\n');
}
