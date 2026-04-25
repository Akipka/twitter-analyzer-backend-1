import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

// ── Header / Footer ────────────────────────────────────────────────────────

function Header({ subdued = false }: { subdued?: boolean }) {
  // Stable journal number across renders so the header doesn't flicker.
  const journal = useMemo(() => Math.floor(Math.random() * 900) + 100, []);
  return (
    <div className={subdued ? "text-center opacity-60" : "text-center"}>
      <div className="font-mono text-[9px] uppercase tracking-[0.45em] text-[color:var(--muted)] sm:text-[10px] sm:tracking-[0.5em]">
        Ministry of Content · Journal N°{journal}
      </div>
      <h1
        data-text="TWITTER SCHOOL"
        className="glitch mt-3 font-serif font-black tracking-tight text-[color:var(--ink)]"
        style={{ fontSize: "clamp(2rem, 7.5vw, 3.5rem)", lineHeight: 1.05 }}
      >
        TWITTER SCHOOL
      </h1>
      <p className="mx-auto mt-2 max-w-md px-2 font-serif text-xs italic text-[color:var(--ink-soft)] sm:text-sm">
        Your Twitter report card. Enter a @username, get the verdict.
      </p>
      <div className="rule-red mx-auto mt-5 w-32 sm:w-48" />
    </div>
  );
}

function Footer() {
  return (
    <p className="mt-10 px-2 text-center font-mono text-[9px] uppercase tracking-[0.32em] text-[color:var(--muted)] sm:mt-12 sm:text-[10px] sm:tracking-[0.4em]">
      Window: 30 days&nbsp;·&nbsp;Data via twitterapi.io
    </p>
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
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
      <Header />

      <form
        onSubmit={handleSubmit}
        className="paper-card mt-8 w-full max-w-lg p-6 sm:mt-12 sm:p-10"
      >
        <div className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)] sm:text-[11px] sm:tracking-[0.32em]">
          Sign-in to the journal
        </div>
        <h2 className="mt-1 font-serif text-2xl font-bold text-[color:var(--ink)] sm:text-3xl">
          Student name
        </h2>
        <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
          Enter a Twitter / X username. The teacher reviews the last{" "}
          <strong>30 days</strong> and assigns grades.
        </p>

        <label className="mt-6 flex items-stretch gap-2 border-b-2 border-[color:var(--accent)]">
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
            autoCorrect="off"
            inputMode="text"
            className="w-full bg-transparent py-2 font-serif text-xl text-[color:var(--ink)] placeholder-[color:var(--muted-soft)] focus:outline-none sm:text-2xl"
          />
        </label>

        <button
          type="submit"
          disabled={!username.trim()}
          className="mt-6 w-full border-2 border-[color:var(--accent)] bg-[color:var(--accent)] px-3 py-3 font-serif text-base font-bold uppercase tracking-[0.24em] text-[#faf6ee] transition-all hover:bg-[color:var(--accent-deep)] disabled:cursor-not-allowed disabled:border-[color:var(--rule)] disabled:bg-transparent disabled:text-[color:var(--muted)] sm:mt-8 sm:text-lg sm:tracking-[0.3em]"
        >
          Enroll student
        </button>

        <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.3em] text-[color:var(--muted)] sm:text-[10px] sm:tracking-widest">
          ☐ Send to principal&nbsp;&nbsp;✓ Mark in journal
        </p>
      </form>

      <Footer />
    </div>
  );
}

// ── Loading ────────────────────────────────────────────────────────────────

function LoadingScreen({ username }: { username: string }) {
  const lines = useMemo(
    () => [
      `📂  Pulling student file for @${username}`,
      "📜  Taking the journal off the shelf...",
      "✏️  Teacher is sharpening the red pen",
      "📊  Counting posts, replies, likes",
      "🧠  Comparing against the gold standard",
      "📋  Writing grades into the ledger...",
    ],
    [username],
  );
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, lines.length)),
      900,
    );
    return () => clearInterval(id);
  }, [lines.length]);
  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
      <Header subdued />
      <div className="paper-card mt-8 w-full max-w-lg p-6 sm:mt-10 sm:p-8">
        <div className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)] sm:text-[11px] sm:tracking-[0.32em]">
          Inspection in progress
        </div>
        <h2 className="mt-1 font-serif text-xl font-bold text-[color:var(--ink)] sm:text-2xl">
          Teacher is busy…
        </h2>
        <ul className="mt-6 space-y-2 font-mono text-[13px] sm:text-sm">
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
        <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-[color:var(--muted)]">
          May take ~30s — twitterapi.io free tier is rate-limited.
        </p>
      </div>
    </div>
  );
}

// ── Error ──────────────────────────────────────────────────────────────────

function ErrorScreen({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
      <Header subdued />
      <div className="paper-card mt-8 w-full max-w-lg p-6 sm:mt-10 sm:p-8">
        <div className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--accent)] sm:text-[11px] sm:tracking-[0.32em]">
          Misconduct notice
        </div>
        <h2 className="mt-1 font-serif text-xl font-bold text-[color:var(--ink)] sm:text-2xl">
          Could not inspect this student
        </h2>
        <p className="mt-3 text-sm text-[color:var(--ink-soft)]">{message}</p>
        <button
          onClick={onBack}
          className="mt-6 border-2 border-[color:var(--ink)] bg-transparent px-5 py-2 font-mono text-[11px] uppercase tracking-[0.28em] text-[color:var(--ink)] hover:bg-[color:var(--ink)] hover:text-[color:var(--paper)] sm:mt-8 sm:text-xs sm:tracking-[0.3em]"
        >
          ← Back to the hallway
        </button>
      </div>
    </div>
  );
}

// ── Result ─────────────────────────────────────────────────────────────────

type ShareState = "idle" | "copying" | "copied" | "saved" | "error";

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
  const [shareState, setShareState] = useState<ShareState>("idle");

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

      const file = new File([blob], "twitter-report-card.png", { type: "image/png" });

      // 1) Try native share with image (most useful on mobile).
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
      };
      if (typeof nav !== "undefined" && nav.canShare?.({ files: [file] }) && nav.share) {
        try {
          await nav.share({
            files: [file],
            title: "My Twitter Report Card",
            text: `My result at Twitter School: ${card.verdict.title}`,
          });
          setShareState("idle");
          return;
        } catch {
          // user cancelled or share unsupported — fall through to clipboard
        }
      }

      // 2) Try clipboard image (desktop Chromium / Safari).
      try {
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        setShareState("copied");
        setTimeout(() => setShareState("idle"), 2400);
        return;
      } catch {
        // 3) Final fallback: download.
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report-card-${data.profile.userName}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setShareState("saved");
        setTimeout(() => setShareState("idle"), 2400);
      }
    } catch (err) {
      console.error(err);
      setShareState("error");
      setTimeout(() => setShareState("idle"), 2400);
    }
  }, [card.verdict.title, data.profile.userName]);

  const shareLabel: Record<ShareState, string> = {
    idle: "Share · screenshot",
    copying: "Preparing image…",
    copied: "Copied to clipboard ✓",
    saved: "Saved to device ✓",
    error: "Error — try again",
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-3 py-8 sm:px-6 sm:py-12">
      <Header subdued />

      <div ref={cardRef} className="paper-card mt-6 p-4 sm:mt-8 sm:p-8 md:p-10">
        <ProfileHeader profile={data.profile} stats={data.stats} />

        <div className="mt-6 sm:mt-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h3 className="font-serif text-lg font-bold uppercase tracking-wider text-[color:var(--ink)] sm:text-xl">
              Report card
            </h3>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--muted)]">
              30 days · {data.stats.tweets_analyzed} tweets
            </div>
          </div>
          <div className="mt-2 h-px bg-[color:var(--rule)]" />
          <ul className="mt-1 divide-y divide-[color:var(--rule-soft)]">
            {card.subjects.map((s) => (
              <SubjectRow key={s.id} subject={s} />
            ))}
          </ul>
        </div>

        <Verdict card={card} />
      </div>

      <div className="mt-6 flex flex-col items-stretch gap-3 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <button
          onClick={onBack}
          className="border-2 border-[color:var(--ink)] bg-transparent px-5 py-2 font-mono text-[11px] uppercase tracking-[0.26em] text-[color:var(--ink)] hover:bg-[color:var(--ink)] hover:text-[color:var(--paper)] sm:text-xs sm:tracking-[0.3em]"
        >
          ← Another student
        </button>
        <button
          onClick={onShare}
          disabled={shareState === "copying"}
          className="border-2 border-[color:var(--accent)] bg-[color:var(--accent)] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.26em] text-[#faf6ee] hover:bg-[color:var(--accent-deep)] disabled:opacity-60 sm:px-6 sm:text-xs sm:tracking-[0.3em]"
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
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:gap-5">
      <Avatar src={profile.avatarUrl} alt={profile.displayName} />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)] sm:tracking-[0.32em]">
          Student file
        </div>
        <h2
          className="font-serif font-bold leading-tight text-[color:var(--ink)]"
          style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)" }}
        >
          <span className="break-words">{profile.displayName}</span>
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
          href={profile.url || `https://x.com/${profile.userName}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm break-all text-[color:var(--ink-soft)] hover:text-[color:var(--accent)]"
        >
          @{profile.userName}
        </a>
        <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-xs sm:gap-3">
          <Stat label="followers" value={fmt(profile.followers)} />
          <Stat label="total tweets" value={fmt(profile.statusesCount)} />
          <Stat label="last 30d" value={String(stats.total)} />
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
        Stud.
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-[9px] uppercase tracking-widest text-[color:var(--muted)] sm:text-[10px]">
        {label}
      </div>
      <div className="font-mono text-sm font-bold text-[color:var(--ink)] sm:text-base">
        {value}
      </div>
    </div>
  );
}

function SubjectRow({ subject }: { subject: SubjectGrade }) {
  const isFail = subject.grade === "F";
  return (
    <li className="flex items-center gap-3 py-3 sm:gap-5 sm:py-4">
      <div className="hidden w-8 shrink-0 text-center font-mono text-base text-[color:var(--muted)] sm:block">
        {subject.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-base sm:hidden">{subject.emoji}</span>
          <h4
            className={
              "truncate font-serif text-base font-bold text-[color:var(--ink)] sm:text-lg md:text-xl" +
              (isFail ? " crossed" : "")
            }
          >
            {subject.name}
          </h4>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[12px] italic leading-snug text-[color:var(--ink-soft)] sm:text-xs sm:leading-normal">
          “{subject.comment}”
        </p>
        <div className="mt-1 truncate font-mono text-[10px] uppercase tracking-widest text-[color:var(--muted)] sm:text-[11px]">
          {subject.metric.label}:{" "}
          <span className="text-[color:var(--ink)]">{subject.metric.value}</span>
        </div>
      </div>
      <div
        className="grade-letter shrink-0 select-none text-right"
        style={{
          fontSize: "clamp(2.75rem, 9vw, 4.5rem)",
          minWidth: "2.6ch",
        }}
      >
        {subject.grade}
      </div>
    </li>
  );
}

function Verdict({ card }: { card: ReportCard }) {
  const gpa10 = (card.gpa * 2).toFixed(1); // friendly 0..10 scale
  return (
    <div className="mt-8 border-t-2 border-double border-[color:var(--accent)] pt-5 sm:mt-10 sm:pt-6">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-[color:var(--muted)] sm:tracking-[0.4em]">
            GPA
          </div>
          <div className="flex items-baseline gap-2">
            <div
              className="font-serif font-black leading-none text-[color:var(--ink)]"
              style={{ fontSize: "clamp(2.75rem, 11vw, 4rem)" }}
            >
              {gpa10}
            </div>
            <div className="font-mono text-sm text-[color:var(--muted)]">/ 10</div>
          </div>
          <p className="mt-2 max-w-xs font-serif text-sm italic text-[color:var(--ink-soft)]">
            {card.verdict.subtitle}
          </p>
        </div>
        <div className="self-end sm:self-auto">
          <div
            className="stamp"
            style={{ fontSize: "clamp(1.25rem, 4.5vw, 1.875rem)" }}
          >
            {card.verdict.title}
          </div>
        </div>
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
