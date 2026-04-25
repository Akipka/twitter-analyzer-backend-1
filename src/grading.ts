// Grading logic for the Twitter Report Card.
//
// Grades are based on Vercel-style empirical thresholds: each subject takes
// raw stats from the backend and maps them to a letter grade (F → A+) plus a
// short, slightly mocking comment. GPA is computed across all six subjects.

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

export type Verdict =
  | { kind: "expelled"; title: string; subtitle: string }
  | { kind: "dvoechnik"; title: string; subtitle: string }
  | { kind: "troechnik"; title: string; subtitle: string }
  | { kind: "horoshist"; title: string; subtitle: string }
  | { kind: "otlichnik"; title: string; subtitle: string };

// ── Grade utilities ────────────────────────────────────────────────────────

const GRADE_ORDER: Grade[] = ["F", "D", "C", "B", "A", "A+"];

function bucket(value: number, thresholds: [number, number, number, number, number]): Grade {
  // thresholds are minimums for D, C, B, A, A+ in ascending order.
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

// ── Comments (ironic, mocking, in Russian) ─────────────────────────────────

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(Math.floor(seed)) % arr.length];
}

const TWEETOLOGY_COMMENTS: Record<Grade, string[]> = {
  "F": ["Не пишет вообще. Лента — кладбище.", "Молчит, как партизан на допросе."],
  "D": ["Пара постов в месяц. Стесняется?", "Пишет реже, чем налоговая радует новостями."],
  "C": ["Пишет, но без огонька.", "Уровень обычного пользователя. Не плохо, не хорошо."],
  "B": ["Регулярный автор. Лента живёт.", "Стабильный поставщик контента."],
  "A": ["Контент-машина. Лента дышит.", "Профи. Пишет так, что алгоритм запоминает."],
  "A+": ["Нон-стоп фабрика тейков. X живёт благодаря таким, как он.", "Маньяк постинга. Опасно близок к ИИ."],
};

const REPLYOLOGY_COMMENTS: Record<Grade, string[]> = {
  "F": ["Не отвечает никому. Социофоб.", "В реплаях — пустыня."],
  "D": ["Изредка кивает в комменты.", "Заходит в реплаи как в холодную воду."],
  "C": ["Отвечает, но без энтузиазма.", "В диалогах — на троечку."],
  "B": ["Активный собеседник. Молодец.", "Любит поговорить, и это видно."],
  "A": ["Душа реплаев. Знает всех.", "Срачи — его стихия."],
  "A+": ["Живёт в реплаях. Возможно, не спит.", "Отвечает быстрее, чем дочитывает оригинал."],
};

const VIRALITY_COMMENTS: Record<Grade, string[]> = {
  "F": ["Лайков нет. Видимо, пишет в пустоту.", "Аудитория делает вид, что его не существует."],
  "D": ["Слабый отклик. Алгоритм не любит.", "Лайки — раз в неделю как зарплата."],
  "C": ["Средненькая вовлечённость. Ниже норма.", "Никого не бесит, никого не заводит."],
  "B": ["Хорошее вовлечение. Подписчики читают.", "Тейки залетают, но не во все рекомендации."],
  "A": ["Виральные посты — норма жизни.", "Алгоритм его уважает."],
  "A+": ["Каждый твит — событие. Лайки и репосты сами летят.", "X-знаменитость локального масштаба."],
};

const SMARTOLOGY_COMMENTS: Record<Grade, string[]> = {
  "F": ["Пишет «лол» и «изи». Достаточно сказано.", "Уровень: эмодзи и одно слово."],
  "D": ["Лексикон ограничен. Мысли — тоже.", "Шаблонные фразы. Нейросеть и то разнообразнее."],
  "C": ["Средний интеллектуальный уровень.", "Иногда выдаёт что-то осмысленное."],
  "B": ["Пишет вдумчиво. Видно, что думал.", "Хороший стиль и осмысленные тейки."],
  "A": ["Тексты — как мини-эссе. Респект.", "Видно эрудицию и работу с языком."],
  "A+": ["Можно цитировать в учебнике.", "Каждое слово на месте. Литератор от твиттера."],
};

const CREATIVITY_COMMENTS: Record<Grade, string[]> = {
  "F": ["Повторяется бесконечно. Cтавит одно и то же на репит.", "Каждый твит — копия предыдущего."],
  "D": ["Темы из недели в неделю те же.", "Креатив на минималках."],
  "C": ["Иногда удивляет. Чаще — нет.", "Стандартный набор тем."],
  "B": ["Разнообразный контент.", "Разные темы, разные формы."],
  "A": ["Креатив, эрудиция, разнообразие.", "Каждый твит — другой угол."],
  "A+": ["Гениальная разноплановость. Никогда не повторяется.", "Контент-художник, а не контент-конвейер."],
};

const ACTIVITY_COMMENTS: Record<Grade, string[]> = {
  "F": ["Заходит в X раз в полгода.", "Аккаунт жив, но не подаёт признаков."],
  "D": ["Заходит редко, постит ещё реже.", "Уровень активности: бабушка в Одноклассниках."],
  "C": ["Активен по настроению.", "Зависит от того, есть ли что сказать."],
  "B": ["Стабильная активность. Молодец.", "Каждый день что-то да напишет."],
  "A": ["X — его второй дом.", "Постоянное присутствие. Лента не пустует."],
  "A+": ["Живёт в X. Возможно, ест и спит там.", "Активность как у бота. Только живой."],
};

// ── Subject scorers ────────────────────────────────────────────────────────

function gradeTweetology(stats: Stats): SubjectGrade {
  // Original posts in window. Threshold scaled to a 30-day period (active
  // creator ≈ 5/day → 150 over 30d = A; daily presence ≈ 1/day → ~30 = B).
  const w = Math.max(stats.window_days, 1) / 30; // scale factor
  const v = stats.posts;
  const grade = bucket(v, [1 * w, 10 * w, 30 * w, 80 * w, 200 * w]);
  return {
    id: "tweetology",
    name: "Твитология",
    emoji: "📝",
    description: "Сколько оригинальных постов выдал за период",
    grade,
    numeric: gradeNumeric(grade),
    comment: pick(TWEETOLOGY_COMMENTS[grade], v + 1),
    metric: { label: "постов", value: String(v) },
  };
}

function gradeReplyology(stats: Stats): SubjectGrade {
  const w = Math.max(stats.window_days, 1) / 30;
  const v = stats.replies;
  const grade = bucket(v, [1 * w, 10 * w, 40 * w, 150 * w, 500 * w]);
  return {
    id: "replyology",
    name: "Ответология",
    emoji: "💬",
    description: "Активность в реплаях",
    grade,
    numeric: gradeNumeric(grade),
    comment: pick(REPLYOLOGY_COMMENTS[grade], v + 7),
    metric: { label: "ответов", value: String(v) },
  };
}

function gradeVirality(stats: Stats, profile: Profile): SubjectGrade {
  // For profiles with non-trivial follower count, use engagement rate
  // (engagement / followers). For tiny accounts, fall back to raw avg_likes.
  const followers = profile.followers;
  let grade: Grade;
  let metricValue: string;
  let metricLabel: string;
  if (followers >= 200) {
    const rate = stats.engagement_score / Math.max(followers, 1);
    grade = bucket(rate, [0.001, 0.005, 0.02, 0.06, 0.20]);
    metricValue = `${(rate * 100).toFixed(2)}%`;
    metricLabel = "engagement rate";
  } else {
    const v = stats.avg_likes;
    grade = bucket(v, [0.5, 2, 5, 15, 50]);
    metricValue = `${stats.avg_likes.toFixed(1)} ❤`;
    metricLabel = "avg ❤ / твит";
  }
  return {
    id: "virality",
    name: "Вирусология",
    emoji: "🔥",
    description: "Насколько контент залетает в массы",
    grade,
    numeric: gradeNumeric(grade),
    comment: pick(VIRALITY_COMMENTS[grade], stats.engagement_score + 13),
    metric: { label: metricLabel, value: metricValue },
  };
}

function gradeSmartology(stats: Stats): SubjectGrade {
  // Composite of tweet length + lexical diversity. Longer, more varied tweets
  // score higher. avg_words ≈ 12 is normal Twitter length; > 30 is essay-tier.
  const lengthScore = Math.min(stats.avg_words / 35, 1);
  const diversity = stats.unique_word_ratio;
  const score = lengthScore * 0.55 + diversity * 0.45;
  const grade = bucket(score, [0.20, 0.32, 0.45, 0.60, 0.78]);
  return {
    id: "smartology",
    name: "Смартоведение",
    emoji: "🧠",
    description: "Глубина и осмысленность контента",
    grade,
    numeric: gradeNumeric(grade),
    comment: pick(SMARTOLOGY_COMMENTS[grade], stats.avg_words * 3 + 2),
    metric: {
      label: "ср. слов / твит",
      value: stats.avg_words.toFixed(1),
    },
  };
}

function gradeCreativity(stats: Stats): SubjectGrade {
  // Lexical diversity is the cleanest proxy we have for "разнообразие тем"
  // without running an LLM. < 0.35 → repetitive, > 0.7 → very varied.
  const v = stats.unique_word_ratio;
  const grade = bucket(v, [0.30, 0.40, 0.52, 0.66, 0.78]);
  return {
    id: "creativity",
    name: "Креативология",
    emoji: "🎨",
    description: "Разнообразие тем и формулировок",
    grade,
    numeric: gradeNumeric(grade),
    comment: pick(CREATIVITY_COMMENTS[grade], v * 100 + 5),
    metric: { label: "lexical diversity", value: v.toFixed(2) },
  };
}

function gradeActivity(stats: Stats): SubjectGrade {
  const v = stats.activity_per_day;
  const grade = bucket(v, [0.1, 0.5, 2.0, 5.0, 15.0]);
  return {
    id: "activity",
    name: "Активология",
    emoji: "⚡",
    description: "Регулярность присутствия в X",
    grade,
    numeric: gradeNumeric(grade),
    comment: pick(ACTIVITY_COMMENTS[grade], v * 11 + 1),
    metric: { label: "твитов / день", value: v.toFixed(1) },
  };
}

// ── Main: build the report card ────────────────────────────────────────────

export function buildReportCard(profile: Profile, stats: Stats): ReportCard {
  // If no tweets at all in the window, return an "expelled" card up front.
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
        title: "Отчислен за неактивность",
        subtitle: "Аккаунт молчит. Постов в окне анализа — ноль.",
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
        title: "Отчислен за неактивность",
        subtitle: "Учиться не ходит. Лента в коме.",
      };
    }
    if (gpa < 1.6) {
      return {
        kind: "dvoechnik",
        title: "Двоечник",
        subtitle: "Сидит на задней парте, в окно смотрит. Шансы есть.",
      };
    }
    if (gpa < 2.6) {
      return {
        kind: "troechnik",
        title: "Троечник",
        subtitle: "Уверенный середняк. Не двойки — и хорошо.",
      };
    }
    if (gpa < 3.6) {
      return {
        kind: "horoshist",
        title: "Хорошист",
        subtitle: "На красный диплом не тянет, но в школе уважают.",
      };
    }
    return {
      kind: "otlichnik",
      title: "Отличник",
      subtitle: "Староста класса. Учитель отмечает в журнале первым.",
    };
  })();

  return { subjects, gpa, verdict };
}

export function gradeColor(g: Grade): string {
  switch (g) {
    case "A+":
    case "A":
      return "var(--accent)";
    case "B":
      return "var(--ink)";
    case "C":
      return "var(--ink)";
    case "D":
      return "var(--accent)";
    case "F":
      return "var(--accent)";
  }
}
