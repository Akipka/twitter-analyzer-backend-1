import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import {
  analyze,
  avatarProxyUrl,
  fetchClassmates,
  type AnalyzeResponse,
  type Classification,
  type ClassmateMember,
  type Profile,
  type Stats,
} from "./api";
import { buildReportCard, type ReportCard, type SubjectGrade } from "./grading";
import { applyClassTheme, sectionLabel } from "./classThemes";
import { avatarPng } from "./avatar";

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
    // Build the report card, then re-skin every subject to match the class
    // the user got assigned to (DeFi → "Yield Farming" instead of "Tweetology",
    // etc). The grade itself is unchanged — just the cosmetics.
    const baseCard = buildReportCard(res.profile, res.stats);
    const card: ReportCard = {
      ...baseCard,
      subjects: applyClassTheme(baseCard.subjects, res.classification?.primary),
    };
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
    <div className={(subdued ? "text-center opacity-60" : "text-center") + " anim-header"}>
      <div className="font-mono text-[9px] uppercase tracking-[0.45em] text-[color:var(--muted)] sm:text-[10px] sm:tracking-[0.5em]">
        Ministry of Content · Journal N°{journal}
      </div>
      <h1
        data-text="CRYPTO SCHOOL"
        className="glitch mt-3 font-serif font-black tracking-tight text-[color:var(--ink)]"
        style={{ fontSize: "clamp(2rem, 7.5vw, 3.5rem)", lineHeight: 1.05 }}
      >
        CRYPTO SCHOOL
      </h1>
      <p className="mx-auto mt-2 max-w-md px-2 font-serif text-xs italic text-[color:var(--ink-soft)] sm:text-sm">
        Your Crypto Twitter report card. Enter a @username, get sorted into your class.
      </p>
      <div className="rule-red mx-auto mt-5 w-32 sm:w-48" />
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-10 flex flex-col items-center gap-3 px-2 sm:mt-12">
      <p className="text-center font-mono text-[9px] uppercase tracking-[0.32em] text-[color:var(--muted)] sm:text-[10px] sm:tracking-[0.4em]">
        Window: last 30 tweets&nbsp;·&nbsp;Data via twitterapi.io
      </p>
      <a
        href="https://x.com/0xakipka"
        target="_blank"
        rel="noopener noreferrer"
        className="credit-link inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.06em] text-[color:var(--muted)] hover:text-[color:var(--ink)] sm:text-[12px]"
      >
        <span>Made by</span>
        <span className="font-bold text-[color:var(--ink-soft)]">@0xakipka</span>
      </a>
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
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
      <Header />

      <form
        onSubmit={handleSubmit}
        className="paper-card anim-card mt-8 w-full max-w-lg p-6 sm:mt-12 sm:p-10"
      >
        <div className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)] sm:text-[11px] sm:tracking-[0.32em]">
          Sign-in to the journal
        </div>
        <h2 className="mt-1 font-serif text-2xl font-bold text-[color:var(--ink)] sm:text-3xl">
          Student name
        </h2>
        <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
          Enter a Twitter / X username. The teacher reviews the{" "}
          <strong>last 30 tweets</strong> and assigns grades.
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
          className={
            "mt-6 w-full border-2 border-[color:var(--accent)] bg-[color:var(--accent)] px-3 py-3 font-serif text-base font-bold uppercase tracking-[0.24em] text-[#faf6ee] transition-all hover:bg-[color:var(--accent-deep)] disabled:cursor-not-allowed disabled:border-[color:var(--rule)] disabled:bg-transparent disabled:text-[color:var(--muted)] sm:mt-8 sm:text-lg sm:tracking-[0.3em]" +
            (username.trim() ? " anim-cta" : "")
          }
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
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-3xl px-3 py-8 sm:px-6 sm:py-12">
      <Header subdued />

      {data.demo && (
        <div className="mt-4 border-2 border-[color:var(--accent)] bg-[color:var(--accent)] px-4 py-3 text-center font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-[#faf6ee] sm:text-[13px] sm:tracking-[0.22em]">
          Demo mode — these numbers are <span className="underline">synthetic</span>, not real. Top up the API to see real data.
        </div>
      )}

      <div ref={cardRef} className="paper-card anim-card mt-6 p-4 sm:mt-8 sm:p-8 md:p-10">
        <ProfileHeader profile={data.profile} stats={data.stats} />

        {data.classification && (
          <ClassAssignment
            classification={data.classification}
            username={data.profile.userName}
          />
        )}

        <div className="mt-6 sm:mt-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h3 className="font-serif text-lg font-bold uppercase tracking-wider text-[color:var(--ink)] sm:text-xl">
              Report card
            </h3>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--muted)]">
              last {data.stats.tweets_analyzed} tweets · {data.stats.days_span.toFixed(data.stats.days_span < 10 ? 1 : 0)}d span
            </div>
          </div>
          <div className="mt-2 h-[3px] bg-[color:var(--ink)]" />
          <ul>
            {card.subjects.map((s, i) => (
              <SubjectRow key={s.id} subject={s} showTopDivider={i > 0} index={i} />
            ))}
          </ul>
          <div className="h-[3px] bg-[color:var(--ink)]" />
        </div>

        <Verdict card={card} />
      </div>

      {data.classification && (
        <ClassmatesSection classification={data.classification} />
      )}

      <div className="mt-6 flex flex-col items-stretch gap-3 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <button
          onClick={onBack}
          className="border-2 border-[color:var(--ink)] bg-transparent px-5 py-2 font-mono text-[11px] uppercase tracking-[0.26em] text-[color:var(--ink)] hover:bg-[color:var(--ink)] hover:text-[color:var(--paper)] sm:text-xs sm:tracking-[0.3em]"
        >
          ← Another student
        </button>
        <button
          onClick={() => setShareOpen(true)}
          className="border-2 border-[color:var(--accent)] bg-[color:var(--accent)] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.26em] text-[#faf6ee] hover:bg-[color:var(--accent-deep)] sm:px-6 sm:text-xs sm:tracking-[0.3em]"
        >
          Share results
        </button>
      </div>

      <Footer />

      {shareOpen && (
        <ShareModal
          cardRef={cardRef}
          card={card}
          username={data.profile.userName}
          classification={data.classification}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}

// ── Share modal ────────────────────────────────────────────────────────────

type ShareStatus = "idle" | "working" | "copied" | "saved" | "error";

function ShareModal({
  cardRef,
  card,
  username,
  classification,
  onClose,
}: {
  cardRef: React.RefObject<HTMLDivElement | null>;
  card: ReportCard;
  username: string;
  classification?: Classification;
  onClose: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ShareStatus>("idle");
  const blobRef = useRef<Blob | null>(null);

  // Render the report card to a PNG via html-to-image. It uses SVG
  // foreignObject under the hood, which captures the live page far more
  // faithfully than html2canvas (transforms, line-height, pseudo-elements,
  // emoji, custom fonts all survive intact).
  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    const node = cardRef.current;
    if (!node) return;
    setStatus("working");
    toBlob(node, {
      backgroundColor: "#fcfaf3",
      pixelRatio: 2,
      cacheBust: true,
    })
      .then((blob) => {
        if (cancelled || !blob) return;
        blobRef.current = blob;
        url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setStatus("idle");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [cardRef]);

  // Close on Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const gpa10 = (card.gpa * 2).toFixed(1);
  const classBit = classification && classification.primary !== "general"
    ? ` · ${classification.label}`
    : "";
  const tweetText = `My Crypto School report card: GPA ${gpa10}/10 — ${card.verdict.title}${classBit}.`;
  const tweetUrl = `https://x.com/intent/post?text=${encodeURIComponent(
    tweetText,
  )}&url=${encodeURIComponent(window.location.origin || "")}`;

  const onCopy = useCallback(async () => {
    const blob = blobRef.current;
    if (!blob) return;
    setStatus("working");
    try {
      const item = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2400);
    } catch {
      // Clipboard API unavailable (Safari without HTTPS, etc.) — fall back
      // to a download so the user still gets the file.
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-card-${username}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2400);
    }
  }, [username]);

  const statusLine: Record<ShareStatus, string> = {
    idle: "",
    working: "Preparing image…",
    copied: "Image copied to clipboard ✓",
    saved: "Image saved to your device ✓",
    error: "Couldn't render the image — try again",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share results"
      className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4 sm:px-6"
      style={{
        background: "rgba(31, 29, 26, 0.55)",
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="paper-card relative flex w-full max-w-md flex-col gap-5 p-5 sm:p-7"
      >
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center font-mono text-[11px] uppercase tracking-widest text-[color:var(--ink-soft)] hover:text-[color:var(--accent)]"
        >
          ✕
        </button>

        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)] sm:text-[11px]">
            Share results
          </div>
          <h3 className="mt-1 font-serif text-2xl font-bold text-[color:var(--ink)] sm:text-3xl">
            Send it to the world
          </h3>
          <p className="mt-2 font-serif text-sm italic text-[color:var(--ink-soft)]">
            Post it on X, or copy the image and paste it anywhere.
          </p>
        </div>

        <div
          className="aspect-[5/4] w-full overflow-hidden rounded-sm border-2 border-[color:var(--ink)] bg-[color:var(--paper-deep)]"
          style={{
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.6)",
          }}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Report card preview"
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-mono text-[11px] uppercase tracking-[0.3em] text-[color:var(--muted)] shimmer">
              Drawing your report…
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 border-2 border-[color:var(--accent)] bg-[color:var(--accent)] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#faf6ee] no-underline hover:bg-[color:var(--accent-deep)] sm:text-xs sm:tracking-[0.26em]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M18.244 2H21l-6.52 7.45L22 22h-6.063l-4.745-6.21L5.5 22H2.747l6.99-7.99L2 2h6.21l4.276 5.65L18.244 2zm-1.06 18h1.682L7.92 4H6.155l11.029 16z" />
            </svg>
            Share to X
          </a>
          <button
            onClick={onCopy}
            disabled={!previewUrl}
            className="flex items-center justify-center gap-2 border-2 border-[color:var(--ink)] bg-transparent px-4 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink)] hover:bg-[color:var(--ink)] hover:text-[color:var(--paper)] disabled:opacity-50 sm:text-xs sm:tracking-[0.26em]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Copy image
          </button>
        </div>

        <p
          className={
            "min-h-[1.25em] text-center font-mono text-[10px] uppercase tracking-[0.28em] sm:text-[11px] " +
            (status === "error"
              ? "text-[color:var(--accent)]"
              : "text-[color:var(--muted)]")
          }
        >
          {statusLine[status]}
        </p>
      </div>
    </div>
  );
}

function ProfileHeader({ profile, stats }: { profile: Profile; stats: Stats }) {
  // Always pull the avatar through our backend proxy. The proxy serves the
  // real X profile image with proper CORS so html2canvas can capture it.
  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:gap-5">
      <Avatar
        src={avatarProxyUrl(profile.userName)}
        alt={profile.displayName}
        username={profile.userName}
      />
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
          <Stat label="last 30 tweets" value={String(stats.total)} />
        </div>
      </div>
    </div>
  );
}

function Avatar({
  src,
  alt,
  username,
}: {
  src: string;
  alt: string;
  username: string;
}) {
  // Pre-render the initials avatar into a PNG once. Using a real <img> with
  // a PNG data URL guarantees html2canvas captures it (inline SVG <text>
  // and HTML <span> sometimes don't survive html2canvas's foreignObject
  // path, leaving the avatar empty in the share image).
  const fallbackPng = useMemo(() => avatarPng(alt, username), [alt, username]);
  const [imgState, setImgState] = useState<"loading" | "loaded" | "failed">(
    src ? "loading" : "failed",
  );
  const showNetworkImage = !!src && imgState === "loaded";
  return (
    <div className="relative shrink-0">
      <div
        className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-[color:var(--accent)] sm:h-24 sm:w-24"
        style={{
          boxShadow:
            "0 4px 14px -6px rgba(0,0,0,0.25), inset 0 0 0 2px #faf6ee",
        }}
      >
        <img
          src={showNetworkImage ? src : fallbackPng}
          alt={alt}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
        {/* Hidden probe: only flips to network image after it actually loads. */}
        {!!src && imgState === "loading" && (
          <img
            src={src}
            alt=""
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            onLoad={() => setImgState("loaded")}
            onError={() => setImgState("failed")}
            className="hidden"
          />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] uppercase tracking-widest leading-normal text-[color:var(--muted)] sm:text-[10px]">
        {label}
      </div>
      <div className="font-mono text-sm font-bold leading-normal text-[color:var(--ink)] sm:text-base">
        {value}
      </div>
    </div>
  );
}

function SubjectRow({
  subject,
  showTopDivider,
  index,
}: {
  subject: SubjectGrade;
  showTopDivider: boolean;
  index: number;
}) {
  const isFail = subject.grade === "F";
  // Stagger row entrance, then pop the grade letter once the row settles.
  const rowDelay = 250 + index * 90;
  const gradeDelay = rowDelay + 200;
  return (
    <li
      className={
        "subject-row anim-row flex items-stretch gap-3 px-1 py-4 sm:gap-5 sm:py-5" +
        (showTopDivider ? " subject-row-top" : "")
      }
      style={{ animationDelay: `${rowDelay}ms` }}
    >
      <div className="hidden w-8 shrink-0 self-center text-center font-mono text-base text-[color:var(--muted)] sm:block">
        {subject.emoji}
      </div>
      <div className="min-w-0 flex-1 self-center">
        <div className="flex items-baseline gap-2">
          <span className="text-base sm:hidden">{subject.emoji}</span>
          <h4
            className={
              "font-serif text-base font-bold leading-normal text-[color:var(--ink)] sm:text-lg md:text-xl" +
              (isFail ? " crossed" : "")
            }
          >
            {subject.name}
          </h4>
        </div>
        <p className="mt-0.5 text-[12px] italic leading-normal text-[color:var(--ink-soft)] sm:text-xs">
          “{subject.comment}”
        </p>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--muted)] sm:text-[11px]">
          {subject.metric.label}:{" "}
          <span className="text-[color:var(--ink)]">{subject.metric.value}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-end">
        <span
          className="grade-letter anim-grade select-none"
          style={{
            fontSize: "clamp(2.75rem, 9vw, 4.5rem)",
            minWidth: "2.6ch",
            display: "inline-block",
            textAlign: "right",
            animationDelay: `${gradeDelay}ms`,
          }}
        >
          {subject.grade}
        </span>
      </div>
    </li>
  );
}

function Verdict({ card }: { card: ReportCard }) {
  const target = card.gpa * 2; // friendly 0..10 scale
  const animated = useCountUp(target, 1100);
  const gpa10 = animated.toFixed(1);
  return (
    <div className="mt-8 border-t-2 border-double border-[color:var(--accent)] pt-5 sm:mt-10 sm:pt-6">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="anim-gpa min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-[color:var(--muted)] sm:tracking-[0.4em]">
            GPA
          </div>
          <div className="flex items-baseline gap-2">
            <div
              className="font-serif font-black leading-none tabular-nums text-[color:var(--ink)]"
              style={{ fontSize: "clamp(2.75rem, 11vw, 4rem)" }}
            >
              {gpa10}
            </div>
            <div className="font-mono text-sm text-[color:var(--muted)]">/ 10</div>
          </div>
          <p className="mt-2 max-w-xs font-serif text-[15px] font-medium leading-normal text-[color:var(--ink)] sm:text-base">
            {card.verdict.subtitle}
          </p>
        </div>
        <div className="self-end sm:self-auto">
          <div
            className="stamp anim-stamp"
            style={{ fontSize: "clamp(1.25rem, 4.5vw, 1.875rem)" }}
          >
            <span className="stamp__inner">{card.verdict.title}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Animate a number from 0 to `target` once on mount (and on target change),
// using requestAnimationFrame and cubic ease-out. Cheap, no deps.
// The animation is a one-shot — by the time the user opens the share modal
// the number is at its target, so the captured PNG is correct.
function useCountUp(target: number, durationMs = 1000): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined" || !target) {
      setV(target || 0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return v;
}

// ── Class assignment + classmates ──────────────────────────────────────────

/**
 * Renders inside the report card. Gives the user their crypto class +
 * a horizontal breakdown bar of every category they touched. Captured
 * inside the share PNG along with the rest of the report card.
 */
function ClassAssignment({
  classification,
  username,
}: {
  classification: Classification;
  username: string;
}) {
  // Top categories to render in the bar — anything with a non-zero share.
  // Sorted desc by backend already.
  const segs = classification.breakdown.filter((b) => b.share > 0.005);
  const section = sectionLabel(classification.primary, username || "anon");

  return (
    <div className="mt-6 border-y-2 border-double border-[color:var(--accent)] py-5 sm:mt-8 sm:py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-[color:var(--muted)] sm:tracking-[0.4em]">
            Class assignment
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              aria-hidden
              style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)" }}
            >
              {classification.emoji}
            </span>
            <h3
              className="font-serif font-black leading-tight text-[color:var(--ink)]"
              style={{ fontSize: "clamp(1.4rem, 5.5vw, 2.1rem)" }}
            >
              {classification.label}
            </h3>
          </div>
          <p className="mt-1.5 max-w-md font-serif text-[14px] italic text-[color:var(--ink-soft)] sm:text-[15px]">
            {classification.blurb}
          </p>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)] sm:text-right sm:text-[11px] sm:tracking-[0.32em]">
          <div>{section}</div>
          {classification.tweets_classified > 0 && (
            <div className="mt-1 text-[color:var(--ink-soft)]">
              {classification.tweets_classified}/{classification.tweets_total} tweets matched
            </div>
          )}
        </div>
      </div>

      {segs.length > 0 && (
        <div className="mt-4">
          <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-[color:var(--muted)] sm:text-[10px]">
            Topic mix
          </div>
          <div className="mt-2 flex h-3 w-full overflow-hidden border border-[color:var(--ink)]">
            {segs.map((b) => (
              <div
                key={b.id}
                title={`${b.label}: ${(b.share * 100).toFixed(0)}%`}
                style={{
                  width: `${b.share * 100}%`,
                  background: classColor(b.id),
                }}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-[color:var(--ink-soft)] sm:text-[11px]">
            {segs.slice(0, 4).map((b) => (
              <div key={b.id} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: classColor(b.id) }}
                />
                <span className="font-bold uppercase tracking-[0.08em]">{b.label}</span>
                <span className="tabular-nums text-[color:var(--muted)]">
                  {(b.share * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Crypto-class palette. Hand-picked so the breakdown bar is legible on
 * the paper background and survives the html-to-image capture cleanly.
 */
function classColor(id: string): string {
  switch (id) {
    case "defi": return "#3a6f4a";
    case "perps": return "#9c433e";
    case "nft": return "#7c5fc7";
    case "trading": return "#c98a2e";
    case "shitposting": return "#c84e8a";
    case "prediction": return "#3267a6";
    default: return "#7f8082";
  }
}

/**
 * Lazy-loaded "classmates" section under the report card. Fetches the
 * roster for the user's primary class on mount and renders an
 * American-style classroom layout (~28 students). Members are seeded
 * from a hardcoded list of recognisable Crypto Twitter handles per
 * class, so even an empty server already shows a populated room.
 */
function ClassmatesSection({ classification }: { classification: Classification }) {
  const classId = classification.primary;
  const [members, setMembers] = useState<ClassmateMember[] | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Lazy fetch: only hit the API the first time the user expands the section.
  // The roster doesn't fit in the share PNG anyway (it's a separate UI block),
  // so there's no need to load it eagerly.
  const onToggle = useCallback(async () => {
    if (!loaded) {
      setLoaded(true);
      const data = await fetchClassmates(classId);
      setMembers(data?.members ?? []);
    }
    setExpanded((v) => !v);
  }, [classId, loaded]);

  return (
    <div className="paper-card anim-card mt-6 p-4 sm:mt-8 sm:p-6 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-[color:var(--muted)] sm:tracking-[0.4em]">
            Your classroom
          </div>
          <h3 className="mt-1 font-serif text-xl font-bold text-[color:var(--ink)] sm:text-2xl">
            {classification.emoji} {classification.label}
          </h3>
          <p className="mt-1 font-serif text-[13px] italic text-[color:var(--ink-soft)] sm:text-sm">
            {expanded
              ? "Real American class size. Yes, you sit next to all of them."
              : "Open the door — see who else got assigned to this class."}
          </p>
        </div>
        <button
          onClick={onToggle}
          className="self-start border-2 border-[color:var(--ink)] bg-transparent px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink)] transition hover:bg-[color:var(--ink)] hover:text-[color:var(--paper)] sm:self-end sm:text-[12px] sm:tracking-[0.26em]"
          aria-expanded={expanded}
        >
          {expanded ? "Close classroom" : "Meet your classmates"}
        </button>
      </div>

      {expanded && (
        <div className="mt-5 sm:mt-6">
          {members === null ? (
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-[color:var(--muted)] shimmer">
              Calling the roll…
            </div>
          ) : members.length === 0 ? (
            <p className="font-serif text-sm text-[color:var(--ink-soft)]">
              The classroom hasn't been populated yet — check back later.
            </p>
          ) : (
            <ul
              className="grid gap-3 sm:gap-4"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
              }}
            >
              {members.map((m, i) => (
                <ClassmateTile key={m.username + i} member={m} index={i} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ClassmateTile({ member, index }: { member: ClassmateMember; index: number }) {
  const [imgOk, setImgOk] = useState(true);
  const initials = (member.displayName || member.username)
    .replace(/^@/, "")
    .split(/\s+|_+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
  return (
    <li
      className="anim-row flex flex-col items-center gap-1.5 text-center"
      style={{ animationDelay: `${index * 35}ms` }}
    >
      <a
        href={`https://x.com/${member.username}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
        aria-label={`Open @${member.username} on X`}
      >
        <div
          className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-[color:var(--ink)] bg-[color:var(--paper-deep)] font-serif font-bold text-[color:var(--ink)] transition group-hover:border-[color:var(--accent)] sm:h-20 sm:w-20"
          style={{ fontSize: "1.05rem" }}
        >
          {imgOk ? (
            <img
              src={avatarProxyUrl(member.username)}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
              onError={() => setImgOk(false)}
            />
          ) : (
            <span aria-hidden>{initials}</span>
          )}
        </div>
      </a>
      <div className="w-full truncate font-mono text-[10px] text-[color:var(--ink-soft)] sm:text-[11px]">
        @{member.username}
      </div>
    </li>
  );
}

// ── Utils ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}
