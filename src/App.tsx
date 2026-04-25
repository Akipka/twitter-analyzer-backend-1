import { useCallback, useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { analyze, type AnalyzeResponse, type Profile, type Stats } from "./api";
import { buildReportCard, type ReportCard, type SubjectGrade } from "./grading";

type Screen =
  | { kind: "input" }
  | { kind: "loading"; username: string }
  | { kind: "result"; data: AnalyzeResponse; card: ReportCard }
  | { kind: "error"; message: string };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ kind: "input" });

  const onAnalyze = useCallback(async (username: string) => {
    setScreen({ kind: "loading", username });
    const res = await analyze(username);
    if ("error" in res) {
      setScreen({ kind: "error", message: res.message });
      return;
    }
    const card = buildReportCard(res.profile, res.stats);
    setScreen({ kind: "result", data: res, card });
  }, []);

  const reset = useCallback(() => setScreen({ kind: "input" }), []);

  return (
    <div className="paper min-h-full">
      {screen.kind === "input" && <InputScreen onSubmit={onAnalyze} />}
      {screen.kind === "loading" && <LoadingScreen username={screen.username} />}
      {screen.kind === "error" && <ErrorScreen message={screen.message} onBack={reset} />}
      {screen.kind === "result" && (
        <ResultScreen data={screen.data} card={screen.card} onBack={reset} />
      )}
    </div>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────

function InputScreen({ onSubmit }: { onSubmit: (u: string) => void }) {
  const [username, setUsername] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = username.trim().replace(/^@/, "");
    if (clean) onSubmit(clean);
  };
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center px-6 py-12">
      <Header />

      <form
        onSubmit={handleSubmit}
        className="paper-card mt-12 w-full max-w-lg p-8 sm:p-10"
      >
        <div className="text-[11px] uppercase tracking-[0.32em] text-[color:var(--muted)]">
          Запись в журнал
        </div>
        <h2 className="mt-1 font-serif text-3xl font-bold text-[color:var(--ink)]">
          Имя ученика
        </h2>
        <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
          Введи Twitter / X username. Учитель проверит твою активность за{" "}
          <strong>30 дней</strong> и выставит оценки.
        </p>

        <div className="mt-6 flex items-stretch gap-2 border-b-2 border-[color:var(--accent)]">
          <span className="font-serif text-2xl font-semibold text-[color:var(--accent)]">
            @
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            spellCheck={false}
            autoCapitalize="off"
            className="w-full bg-transparent py-2 font-serif text-2xl text-[color:var(--ink)] placeholder-[color:var(--muted-soft)] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={!username.trim()}
          className="mt-8 w-full border-2 border-[color:var(--accent)] bg-[color:var(--accent)] py-3 font-serif text-lg font-bold uppercase tracking-[0.3em] text-[#faf6ee] transition-all hover:bg-[color:var(--accent-deep)] disabled:cursor-not-allowed disabled:border-[color:var(--rule)] disabled:bg-transparent disabled:text-[color:var(--muted)]"
        >
          Принять в школу
        </button>

        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-widest text-[color:var(--muted)]">
          ☐ К директору&nbsp;&nbsp;✓ В дневник
        </p>
      </form>

      <Footer />
    </div>
  );
}

// ── Loading ────────────────────────────────────────────────────────────────

function LoadingScreen({ username }: { username: string }) {
  const lines = [
    "📂  Открываем личное дело @" + username,
    "📜  Достаём дневник из шкафа...",
    "✏️  Учитель точит красную ручку",
    "📊  Считаем посты, ответы, лайки",
    "🧠  Сверяем с золотым стандартом",
    "📋  Вписываем оценки в журнал...",
  ];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, lines.length)), 700);
    return () => clearInterval(id);
  }, [lines.length]);
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center px-6 py-12">
      <Header subdued />
      <div className="paper-card mt-10 w-full max-w-lg p-8">
        <div className="text-[11px] uppercase tracking-[0.32em] text-[color:var(--muted)]">
          Идёт проверка
        </div>
        <h2 className="mt-1 font-serif text-2xl font-bold text-[color:var(--ink)]">
          Учитель занят...
        </h2>
        <ul className="mt-6 space-y-2 font-mono text-sm">
          {lines.slice(0, step + 1).map((line, i) => (
            <li
              key={i}
              className={
                i === step
                  ? "shimmer text-[color:var(--ink)]"
                  : "text-[color:var(--ink-soft)]"
              }
            >
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Error ──────────────────────────────────────────────────────────────────

function ErrorScreen({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center px-6 py-12">
      <Header subdued />
      <div className="paper-card mt-10 w-full max-w-lg p-8">
        <div className="text-[11px] uppercase tracking-[0.32em] text-[color:var(--accent)]">
          Двойка за поведение
        </div>
        <h2 className="mt-1 font-serif text-2xl font-bold text-[color:var(--ink)]">
          Не получилось проверить ученика
        </h2>
        <p className="mt-3 text-sm text-[color:var(--ink-soft)]">{message}</p>
        <button
          onClick={onBack}
          className="mt-8 border-2 border-[color:var(--ink)] bg-transparent px-6 py-2 font-mono text-xs uppercase tracking-[0.3em] text-[color:var(--ink)] hover:bg-[color:var(--ink)] hover:text-[color:var(--paper)]"
        >
          ← В коридор
        </button>
      </div>
    </div>
  );
}

// ── Header / Footer ────────────────────────────────────────────────────────

function Header({ subdued = false }: { subdued?: boolean }) {
  return (
    <div className={subdued ? "text-center opacity-60" : "text-center"}>
      <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-[color:var(--muted)]">
        Министерство Контента · Журнал N°{Math.floor(Math.random() * 900) + 100}
      </div>
      <h1
        data-text="ШКОЛА ТВИТТЕРА"
        className="glitch mt-3 font-serif text-4xl font-black tracking-tight text-[color:var(--ink)] sm:text-5xl"
      >
        ШКОЛА ТВИТТЕРА
      </h1>
      <p className="mt-2 font-serif text-sm italic text-[color:var(--ink-soft)]">
        Дневник твиттер-успеваемости. Введи @username, узнай вердикт.
      </p>
      <div className="rule-red mx-auto mt-5 w-48" />
    </div>
  );
}

function Footer() {
  return (
    <p className="mt-12 font-mono text-[10px] uppercase tracking-[0.4em] text-[color:var(--muted)]">
      Период анализа: 30 дней&nbsp;·&nbsp;Данные с X
    </p>
  );
}

// ── Result ─────────────────────────────────────────────────────────────────

function ResultScreen({
  data,
  card,
  onBack,
}: {
  data: AnalyzeResponse;
  card: ReportCard;
  onBack: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [shareState, setShareState] = useState<"idle" | "copying" | "copied" | "saved" | "error">(
    "idle",
  );
  const onShare = useCallback(async () => {
    if (!cardRef.current) return;
    setShareState("copying");
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#f3efe8",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png", 1),
      );
      if (!blob) throw new Error("toBlob failed");

      // Try native share with image first (mobile).
      const file = new File([blob], "twitter-report-card.png", { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
      };
      if (typeof nav !== "undefined" && nav.canShare?.({ files: [file] }) && nav.share) {
        try {
          await nav.share({
            files: [file],
            title: "Мой табель Twitter",
            text: `Мой результат в Школе Твиттера: ${card.verdict.title}`,
          });
          setShareState("idle");
          return;
        } catch {
          // user cancelled or share unsupported — fall through to clipboard
        }
      }

      // Try clipboard image.
      try {
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        setShareState("copied");
        setTimeout(() => setShareState("idle"), 2200);
        return;
      } catch {
        // Fallback: download.
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report-card-${data.profile.userName}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setShareState("saved");
        setTimeout(() => setShareState("idle"), 2200);
      }
    } catch (err) {
      console.error(err);
      setShareState("error");
      setTimeout(() => setShareState("idle"), 2200);
    }
  }, [card.verdict.title, data.profile.userName]);

  const shareLabel: Record<typeof shareState, string> = {
    idle: "Поделиться · скриншот",
    copying: "Готовим картинку…",
    copied: "Скопировано в буфер ✓",
    saved: "Сохранено на устройство ✓",
    error: "Ошибка — попробуй ещё раз",
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <Header subdued />

      <div ref={cardRef} className="paper-card mt-8 p-6 sm:p-10">
        <ProfileHeader profile={data.profile} stats={data.stats} />

        <div className="mt-8">
          <div className="flex items-baseline justify-between">
            <h3 className="font-serif text-xl font-bold uppercase tracking-wider text-[color:var(--ink)]">
              Табель успеваемости
            </h3>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--muted)]">
              30 дней · {data.stats.tweets_analyzed} твитов
            </div>
          </div>
          <div className="mt-1 h-px bg-[color:var(--rule)]" />
          <ul className="mt-2 divide-y divide-[color:var(--rule-soft)]">
            {card.subjects.map((s) => (
              <SubjectRow key={s.id} subject={s} />
            ))}
          </ul>
        </div>

        <Verdict card={card} />
      </div>

      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <button
          onClick={onBack}
          className="border-2 border-[color:var(--ink)] bg-transparent px-5 py-2 font-mono text-xs uppercase tracking-[0.3em] text-[color:var(--ink)] hover:bg-[color:var(--ink)] hover:text-[color:var(--paper)]"
        >
          ← Другой ученик
        </button>
        <button
          onClick={onShare}
          disabled={shareState === "copying"}
          className="border-2 border-[color:var(--accent)] bg-[color:var(--accent)] px-6 py-3 font-mono text-xs uppercase tracking-[0.3em] text-[#faf6ee] hover:bg-[color:var(--accent-deep)] disabled:opacity-60"
        >
          {shareLabel[shareState]}
        </button>
      </div>

      <Footer />
    </div>
  );
}

function ProfileHeader({ profile, stats }: { profile: Profile; stats: Stats }) {
  return (
    <div className="flex items-start gap-5">
      <Avatar src={profile.avatarUrl} alt={profile.displayName} />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-[color:var(--muted)]">
          Личное дело
        </div>
        <h2 className="truncate font-serif text-2xl font-bold text-[color:var(--ink)] sm:text-3xl">
          {profile.displayName}
          {profile.isBlueVerified && (
            <span
              className="ml-2 align-middle text-[color:var(--accent)]"
              title="Twitter Blue"
            >
              ✓
            </span>
          )}
        </h2>
        <a
          href={profile.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm text-[color:var(--ink-soft)] hover:text-[color:var(--accent)]"
        >
          @{profile.userName}
        </a>
        <div className="mt-3 grid grid-cols-3 gap-3 font-mono text-xs">
          <Stat label="подписчиков" value={fmt(profile.followers)} />
          <Stat label="всего твитов" value={fmt(profile.statusesCount)} />
          <Stat label="за 30 дней" value={String(stats.total)} />
        </div>
      </div>
    </div>
  );
}

function Avatar({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative shrink-0">
      <div
        className="h-20 w-20 overflow-hidden rounded-full border-4 border-[color:var(--accent)] bg-[color:var(--paper-deep)] sm:h-24 sm:w-24"
        style={{
          boxShadow: "0 4px 14px -6px rgba(0,0,0,0.25), inset 0 0 0 2px #faf6ee",
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            crossOrigin="anonymous"
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-serif text-3xl text-[color:var(--muted)]">
            ?
          </div>
        )}
      </div>
      <div className="absolute -right-2 -bottom-2 rounded-full border-2 border-[color:var(--paper)] bg-[color:var(--accent)] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-[#faf6ee]">
        Учен.
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--muted)]">
        {label}
      </div>
      <div className="font-mono text-base font-bold text-[color:var(--ink)]">{value}</div>
    </div>
  );
}

function SubjectRow({ subject }: { subject: SubjectGrade }) {
  const isFail = subject.grade === "F";
  return (
    <li className="flex items-center gap-4 py-4 sm:gap-6">
      <div className="hidden w-8 text-center font-mono text-base text-[color:var(--muted)] sm:block">
        {subject.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm sm:hidden">{subject.emoji}</span>
          <h4
            className={
              "truncate font-serif text-lg font-bold text-[color:var(--ink)] sm:text-xl" +
              (isFail ? " crossed" : "")
            }
          >
            {subject.name}
          </h4>
        </div>
        <p className="text-xs text-[color:var(--ink-soft)] italic">
          “{subject.comment}”
        </p>
        <div className="mt-1 font-mono text-[11px] uppercase tracking-widest text-[color:var(--muted)]">
          {subject.metric.label}: <span className="text-[color:var(--ink)]">{subject.metric.value}</span>
        </div>
      </div>
      <div
        className="grade-letter shrink-0 select-none text-right text-6xl sm:text-7xl"
        style={{ minWidth: "3.2ch" }}
      >
        {subject.grade}
      </div>
    </li>
  );
}

function Verdict({ card }: { card: ReportCard }) {
  const gpa10 = (card.gpa * 2).toFixed(1); // friendly 0..10 scale
  return (
    <div className="mt-10 border-t-2 border-double border-[color:var(--accent)] pt-6">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-[color:var(--muted)]">
            Средний балл
          </div>
          <div className="flex items-baseline gap-2">
            <div className="font-serif text-6xl font-black text-[color:var(--ink)]">
              {gpa10}
            </div>
            <div className="font-mono text-sm text-[color:var(--muted)]">/ 10</div>
          </div>
          <p className="mt-2 max-w-xs font-serif text-sm italic text-[color:var(--ink-soft)]">
            {card.verdict.subtitle}
          </p>
        </div>
        <div className="stamp text-2xl sm:text-3xl">{card.verdict.title}</div>
      </div>
    </div>
  );
}

// ── Utils ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}
