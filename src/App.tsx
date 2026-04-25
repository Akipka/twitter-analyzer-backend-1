import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { fetchAnalytics, fetchProfile, type ProfileData } from './api';
import { buildReport, type Report, type SubjectGrade } from './analyzer';

// ============================================================
// Constants
// ============================================================

const PRIMARY = '#7f8082';
const ACCENT = '#9c433e';
const BG = '#f5f3f0';

const GRADE_COLORS: Record<number, { text: string; bg: string; border: string; bar: string; hex: string }> = {
  5: { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', bar: 'bg-emerald-500', hex: '#059669' },
  4: { text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-300', bar: 'bg-sky-500', hex: '#0284c7' },
  3: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', bar: 'bg-amber-500', hex: '#d97706' },
  2: { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-300', bar: 'bg-orange-500', hex: '#ea580c' },
  1: { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300', bar: 'bg-red-500', hex: '#dc2626' },
};

// ============================================================
// Input Screen
// ============================================================

function InputScreen({ onAnalyze }: { onAnalyze: (u: string) => void }) {
  const [username, setUsername] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = username.trim().replace(/^@/, '');
    if (clean) onAnalyze(clean);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5" style={{ background: BG }}>
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: ACCENT }} />
      <div className="w-full max-w-md text-center">
        <div className="mb-2 text-5xl">📋</div>
        <h1 className="glitch-title text-3xl font-black tracking-tight sm:text-4xl" style={{ color: '#2a2a2a' }} data-text="DIGITAL GRADEBOOK">DIGITAL GRADEBOOK</h1>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: PRIMARY }}>Twitter Content Report Card</p>
        <p className="mt-1 text-xs" style={{ color: `${PRIMARY}99` }}>30-day analysis · Real data only</p>
        <div className="mx-auto mt-6 mb-8 h-px w-32" style={{ background: `${PRIMARY}30` }} />
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold" style={{ color: PRIMARY }}>@</span>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="enter username" className="w-full rounded-lg border-2 bg-white py-3.5 pl-10 pr-4 text-base font-medium outline-none transition-all" style={{ color: '#2a2a2a', borderColor: focused ? ACCENT : `${PRIMARY}30` }} />
          </div>
          <button type="submit" disabled={!username.trim()} className="w-full rounded-lg py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-all disabled:cursor-not-allowed disabled:opacity-30" style={{ background: ACCENT }}>Analyze</button>
        </form>
        <p className="mt-6 text-xs" style={{ color: `${PRIMARY}60` }}>Real data from Python backend → see SETUP.md</p>
      </div>
      <p className="absolute bottom-6 text-[10px] tracking-wider" style={{ color: `${PRIMARY}40` }}>MIN. OF CONTENT · TWITTER ANALYSIS DEPARTMENT</p>
    </div>
  );
}

// ============================================================
// Loading Screen
// ============================================================

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5" style={{ background: BG }}>
      <div className="text-center">
        <div className="text-5xl">🔍</div>
        <p className="mt-5 text-base font-medium" style={{ color: PRIMARY }}>Fetching real data…</p>
        <div className="mt-5 flex justify-center gap-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-2.5 w-2.5 rounded-full anim-pulse-dot" style={{ background: ACCENT, animationDelay: `${i * 0.2}s` }} />)}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Error Screen — backend not running
// ============================================================

function ErrorScreen({ error, profile, username, onBack, onRetry }: { error: string; profile: ProfileData | null; username: string; onBack: () => void; onRetry: () => void }) {
  const [showSetup, setShowSetup] = useState(false);

  return (
    <div className="min-h-screen pb-8" style={{ background: BG }}>
      <div className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur-sm" style={{ borderColor: `${PRIMARY}20` }}>
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: PRIMARY }}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            Back
          </button>
          <button onClick={onRetry} className="text-xs font-semibold" style={{ color: ACCENT }}>Retry</button>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pt-10 space-y-6">
        {profile && (
          <div className="rounded-xl border bg-white p-5 text-center" style={{ borderColor: `${PRIMARY}20` }}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full" style={{ border: '3px solid #e5e3e0' }}>
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-2xl font-black uppercase text-white" style={{ background: PRIMARY, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{username.charAt(0)}</span>}
            </div>
            <h2 className="mt-3 text-lg font-black" style={{ color: '#2a2a2a' }}>@{username}</h2>
            <p className="text-xs" style={{ color: PRIMARY }}>{profile.displayName} · {profile.followers.toLocaleString()} followers</p>
            <p className="text-xs mt-1 text-emerald-600">✅ Profile found — but tweet data requires backend</p>
          </div>
        )}

        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-5 text-center">
          <div className="text-3xl mb-2">🚫</div>
          <h2 className="text-lg font-black text-red-700">Failed to fetch data</h2>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button onClick={onRetry} className="mt-4 rounded-lg px-6 py-2 text-sm font-bold text-white" style={{ background: ACCENT }}>Try again</button>
        </div>

        <button onClick={() => setShowSetup(!showSetup)} className="w-full rounded-xl border-2 py-3 text-sm font-bold uppercase tracking-wider" style={{ borderColor: PRIMARY, color: PRIMARY }}>
          {showSetup ? '▲ Hide' : '▼ Show'} setup instructions
        </button>

        {showSetup && (
          <div className="rounded-xl border bg-white p-5 space-y-4 text-sm" style={{ borderColor: `${PRIMARY}20` }}>
            <h3 className="font-black text-base" style={{ color: '#2a2a2a' }}>🖥️ Backend Setup</h3>
            <p style={{ color: `${PRIMARY}90` }}>The frontend calls <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">GET /api/analyze/:username</code> which must return:</p>
            <pre className="rounded-lg bg-stone-800 p-3 text-xs text-stone-200">{`{ "posts": 42, "replies": 87, "total": 129 }`}</pre>

            <div>
              <p className="font-bold" style={{ color: PRIMARY }}>1. Install:</p>
              <pre className="mt-1 rounded-lg bg-stone-800 p-3 text-xs text-stone-200">pip install snscrape flask flask-cors</pre>
            </div>

            <div>
              <p className="font-bold" style={{ color: PRIMARY }}>2. Create <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">server.py</code>:</p>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-stone-800 p-3 text-[11px] text-stone-200 leading-relaxed">{`from flask import Flask, jsonify
from flask_cors import CORS
import snscrape.modules.twitter as sntwitter
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

@app.route("/api/analyze/<username>")
def analyze(username):
    since = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    posts = 0
    replies = 0
    try:
        for t in sntwitter.TwitterSearchScraper(
            f"from:{username} since:{since}"
        ).get_items():
            if t.inReplyToTweetId:
                replies += 1
            else:
                posts += 1
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify({
        "posts": posts,
        "replies": replies,
        "total": posts + replies
    })

if __name__ == "__main__":
    app.run(port=5000)`}</pre>
            </div>

            <div>
              <p className="font-bold" style={{ color: PRIMARY }}>3. Run:</p>
              <pre className="mt-1 rounded-lg bg-stone-800 p-3 text-xs text-stone-200">python server.py</pre>
            </div>

            <div>
              <p className="font-bold" style={{ color: PRIMARY }}>4. Refresh this page and retry</p>
              <p className="text-xs mt-1" style={{ color: `${PRIMARY}70` }}>snscrape fetches real tweets without API keys. <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">inReplyToTweetId</code> separates posts from replies.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Subject Card
// ============================================================

function SubjectCard({ subject, index }: { subject: SubjectGrade; index: number }) {
  const c = GRADE_COLORS[subject.grade] ?? GRADE_COLORS[3];
  return (
    <div className="anim-card rounded-xl border bg-white p-4 transition-shadow hover:shadow-md" style={{ borderColor: `${PRIMARY}18`, animationDelay: `${index * 0.1 + 0.2}s` }}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{subject.icon}</span>
            <h3 className="text-sm font-bold" style={{ color: '#2a2a2a' }}>{subject.name}</h3>
            <span className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: `${PRIMARY}15`, color: PRIMARY }}>{subject.letter}</span>
          </div>
          <p className="mt-1 text-xs" style={{ color: `${PRIMARY}80` }}>{subject.details}</p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 text-xl font-black ${c.text} ${c.bg} ${c.border}`}>{subject.grade}</div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: `${PRIMARY}12` }}>
          <div className={`h-full rounded-full anim-bar ${c.bar}`} style={{ width: `${subject.score}%`, animationDelay: `${index * 0.1 + 0.5}s` }} />
        </div>
        <span className="text-xs font-mono font-semibold" style={{ color: PRIMARY }}>{subject.score}</span>
      </div>
      <div className="mt-3 rounded-lg p-2.5" style={{ background: `${PRIMARY}06` }}>
        <p className="text-xs italic leading-relaxed" style={{ color: `${PRIMARY}CC` }}>&ldquo;{subject.comment}&rdquo;</p>
        <p className="mt-1 text-right text-[10px] font-medium" style={{ color: `${PRIMARY}60` }}>— {subject.teacher}</p>
      </div>
    </div>
  );
}

// ============================================================
// Verdict
// ============================================================

function VerdictSection({ report }: { report: Report }) {
  const [showStamp, setShowStamp] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShowStamp(true), 1200); return () => clearTimeout(t); }, []);

  const gc = report.averageGrade >= 4.5 ? '#059669' : report.averageGrade >= 3.5 ? '#0284c7' : report.averageGrade >= 2.5 ? '#d97706' : report.averageGrade >= 1.5 ? '#ea580c' : '#dc2626';

  return (
    <div className="anim-card relative overflow-hidden rounded-xl border-2 bg-white p-5 text-center" style={{ borderColor: gc, animationDelay: '1.1s' }}>
      {showStamp && <div className="anim-stamp absolute right-3 top-3 rounded-lg px-3 py-1.5 font-black text-sm tracking-wider opacity-80" style={{ borderColor: gc, color: gc, borderWidth: 3 }}>{report.verdict}</div>}
      <div className="mb-2 text-4xl">{report.verdictEmoji}</div>
      <h3 className="text-2xl font-black tracking-wide" style={{ color: gc }}>{report.verdict}</h3>
      <div className="mt-2 flex items-baseline justify-center gap-2">
        <span className="text-sm" style={{ color: PRIMARY }}>Average:</span>
        <span className="font-mono text-3xl font-black" style={{ color: '#2a2a2a' }}>{report.averageGrade.toFixed(2)}</span>
      </div>
      <p className="mt-3 text-sm italic leading-relaxed" style={{ color: `${PRIMARY}BB` }}>{report.verdictComment}</p>
      <div className="mx-auto mt-4 h-0.5 w-16 rounded-full" style={{ background: gc, opacity: 0.4 }} />
    </div>
  );
}

// ============================================================
// Share Card (for image capture)
// ============================================================

function ShareCard({ report, avatarUrl }: { report: Report; avatarUrl: string | null }) {
  const vc = report.averageGrade >= 4.5 ? '#059669' : report.averageGrade >= 3.5 ? '#0284c7' : report.averageGrade >= 2.5 ? '#d97706' : report.averageGrade >= 1.5 ? '#ea580c' : '#dc2626';

  return (
    <div style={{ width: 520, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', background: '#fff', borderRadius: 16, overflow: 'hidden', border: '2px solid #e5e3e0' }}>
      <div style={{ background: '#2a2a2a', padding: '24px 28px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 4 }}>📋</div>
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 900, letterSpacing: 1 }}>DIGITAL GRADEBOOK</div>
        <div style={{ color: '#9ca3af', fontSize: 10, fontWeight: 600, letterSpacing: 3, marginTop: 4 }}>REAL DATA · NO SIMULATION</div>
      </div>
      <div style={{ padding: '20px 28px 16px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 10px', overflow: 'hidden', border: '3px solid #e5e3e0' }}>
          {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: '#7f8082', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 26, fontWeight: 900 }}>?</div>}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#2a2a2a' }}>@{report.username}</div>
        <div style={{ fontSize: 10, color: '#7f8082', marginTop: 4 }}>{report.period} · {report.totalPosts} posts · {report.totalReplies} replies</div>
      </div>
      <div style={{ padding: '16px 28px', background: '#fafaf8' }}>
        {report.subjects.map((s) => {
          const gc = GRADE_COLORS[s.grade] ?? GRADE_COLORS[3];
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
              <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{s.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#2a2a2a', width: 85 }}>{s.name}</span>
              <div style={{ flex: 1, height: 8, background: '#e5e3e0', borderRadius: 4, overflow: 'hidden' }}><div style={{ height: '100%', width: `${s.score}%`, background: gc.hex, borderRadius: 4 }} /></div>
              <span style={{ fontSize: 13, fontWeight: 800, color: gc.hex, width: 24, textAlign: 'right' }}>{s.grade}</span>
            </div>
          );
        })}
      </div>
      <div style={{ padding: '20px 28px', textAlign: 'center', borderTop: '1px solid #eee' }}>
        <div style={{ fontSize: 28 }}>{report.verdictEmoji}</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: vc, marginTop: 4 }}>{report.verdict}</div>
        <div style={{ fontSize: 11, color: '#7f8082', marginTop: 6 }}>Average: <span style={{ fontWeight: 800, color: '#2a2a2a' }}>{report.averageGrade.toFixed(2)}</span></div>
      </div>
      <div style={{ padding: '10px 28px', background: '#f5f3f0', textAlign: 'center', borderTop: '1px solid #eee' }}>
        <span style={{ fontSize: 9, color: '#7f808280', letterSpacing: 2, fontWeight: 600 }}>DIGITAL GRADEBOOK · {new Date().getFullYear()}</span>
      </div>
    </div>
  );
}

// ============================================================
// Share Modal
// ============================================================

function ShareModal({ report, avatarUrl, onClose }: { report: Report; avatarUrl: string | null; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'capturing' | 'copied' | 'downloaded'>('idle');

  const capture = async () => {
    if (!cardRef.current) return null;
    return html2canvas(cardRef.current, { useCORS: true, allowTaint: false, scale: 2, backgroundColor: '#ffffff', logging: false });
  };

  const handleCopy = async () => {
    setStatus('capturing');
    try {
      const canvas = await capture();
      if (!canvas) throw new Error('no canvas');
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
      if (blob) { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); setStatus('copied'); return; }
    } catch {}
    try { const canvas = await capture(); if (canvas) { const a = document.createElement('a'); a.download = `gradebook-${report.username}.png`; a.href = canvas.toDataURL('image/png'); a.click(); setStatus('downloaded'); } } catch { setStatus('idle'); }
  };

  const handleDownload = async () => {
    setStatus('capturing');
    try { const canvas = await capture(); if (canvas) { const a = document.createElement('a'); a.download = `gradebook-${report.username}.png`; a.href = canvas.toDataURL('image/png'); a.click(); setStatus('downloaded'); } } catch { setStatus('idle'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end mb-3"><button onClick={onClose} className="rounded-full p-2 text-white hover:bg-white/20"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
        <div className="flex justify-center overflow-auto rounded-xl p-4" style={{ maxHeight: '70vh', background: '#f5f3f0' }}><div ref={cardRef}><ShareCard report={report} avatarUrl={avatarUrl} /></div></div>
        <div className="mt-4 flex gap-2">
          <button onClick={handleCopy} disabled={status === 'capturing'} className="flex-1 rounded-xl py-3 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50" style={{ background: status === 'copied' ? '#059669' : ACCENT }}>{status === 'capturing' ? '⏳…' : status === 'copied' ? '✓ Copied!' : '📋 Copy Image'}</button>
          <button onClick={handleDownload} disabled={status === 'capturing'} className="rounded-xl border-2 px-5 py-3 text-sm font-bold uppercase tracking-wider disabled:opacity-50" style={{ borderColor: ACCENT, color: ACCENT, background: status === 'downloaded' ? '#ecfdf5' : 'white' }}>{status === 'downloaded' ? '✓ Saved' : '💾 Save'}</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Section Header
// ============================================================

function Hdr({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-1 pt-2">
      <div className="h-px flex-1" style={{ background: `${PRIMARY}20` }} />
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${PRIMARY}50` }}>{children}</span>
      <div className="h-px flex-1" style={{ background: `${PRIMARY}20` }} />
    </div>
  );
}

// ============================================================
// Report Screen
// ============================================================

function ReportScreen({ report, avatarUrl, onBack }: { report: Report; avatarUrl: string | null; onBack: () => void }) {
  const [showShare, setShowShare] = useState(false);

  return (
    <div className="min-h-screen pb-8" style={{ background: BG }}>
      <div className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur-sm" style={{ borderColor: `${PRIMARY}20` }}>
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: PRIMARY }}><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>Back</button>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${PRIMARY}50` }}>Digital Gradebook</span>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-5">
        {/* Real data badge */}
        <div className="anim-card rounded-xl border-2 border-emerald-300 bg-emerald-50 p-3 text-center" style={{ animationDelay: '0.1s' }}>
          <span className="text-xs font-bold text-emerald-700">✅ Real data — {report.totalPosts} posts + {report.totalReplies} replies from backend API</span>
        </div>

        {/* Profile */}
        <div className="anim-card scanlines rounded-xl border bg-white p-5 text-center" style={{ borderColor: `${PRIMARY}20` }}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full" style={{ border: '3px solid #e5e3e0' }}>
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-2xl font-black uppercase text-white" style={{ background: PRIMARY, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{report.username.charAt(0)}</span>}
          </div>
          <h2 className="mt-3 text-lg font-black" style={{ color: '#2a2a2a' }}>@{report.username}</h2>
          <div className="mt-2 text-xs" style={{ color: PRIMARY }}>{report.displayName}</div>
          <div className="mt-2 text-xs" style={{ color: PRIMARY }}>Period: <span className="font-semibold">{report.period}</span></div>
        </div>

        {/* Stats */}
        <div className="anim-card grid grid-cols-3 gap-2" style={{ animationDelay: '0.15s' }}>
          {[
            { label: 'Posts', value: report.totalPosts, icon: '📝' },
            { label: 'Replies', value: report.totalReplies, icon: '💬' },
            { label: 'Total', value: report.totalActivity, icon: '⚡' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-3 text-center" style={{ borderColor: `${PRIMARY}15` }}>
              <div className="text-lg">{s.icon}</div>
              <div className="font-mono text-lg font-black" style={{ color: '#2a2a2a' }}>{s.value}</div>
              <div className="text-[10px] font-medium" style={{ color: `${PRIMARY}70` }}>{s.label}</div>
            </div>
          ))}
        </div>

        <Hdr>Subject Grades</Hdr>
        <div className="space-y-3">{report.subjects.map((s, i) => <SubjectCard key={s.id} subject={s} index={i} />)}</div>

        <Hdr>Final Verdict</Hdr>
        <VerdictSection report={report} />

        <button onClick={() => setShowShare(true)} className="anim-card w-full rounded-xl border-2 py-3.5 text-sm font-bold uppercase tracking-wider transition-all" style={{ borderColor: ACCENT, color: ACCENT }} onMouseEnter={(e) => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.color = '#fff'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ACCENT; }}>📎 Share results</button>

        {/* Summary */}
        <div className="anim-card overflow-hidden rounded-xl border bg-white" style={{ borderColor: `${PRIMARY}20` }}>
          <table className="w-full text-xs">
            <thead><tr style={{ background: `${PRIMARY}08` }}><th className="px-4 py-2 text-left font-semibold" style={{ color: PRIMARY }}>Subject</th><th className="px-2 py-2 text-center font-semibold" style={{ color: PRIMARY }}>Score</th><th className="px-2 py-2 text-center font-semibold" style={{ color: PRIMARY }}>Grade</th><th className="px-4 py-2 text-center font-semibold" style={{ color: PRIMARY }}>Letter</th></tr></thead>
            <tbody>
              {report.subjects.map((s, i) => { const c = GRADE_COLORS[s.grade] ?? GRADE_COLORS[3]; return (<tr key={s.id} style={{ background: i % 2 === 0 ? 'transparent' : `${PRIMARY}05` }}><td className="px-4 py-2 font-medium" style={{ color: '#2a2a2a' }}>{s.icon} {s.name}</td><td className="px-2 py-2 text-center font-mono font-semibold" style={{ color: PRIMARY }}>{s.score}</td><td className={`px-2 py-2 text-center font-black ${c.text}`}>{s.grade}</td><td className="px-4 py-2 text-center font-bold" style={{ color: PRIMARY }}>{s.letter}</td></tr>); })}
            </tbody>
            <tfoot>
              <tr className="border-t-2" style={{ borderColor: `${PRIMARY}25` }}>
                <td className="px-4 py-2.5 font-black" style={{ color: '#2a2a2a' }}>AVERAGE</td>
                <td className="px-2 py-2.5 text-center font-mono font-black" style={{ color: ACCENT }}>{report.averageScore}</td>
                <td className="px-2 py-2.5 text-center font-black text-sm" style={{ color: ACCENT }}>{report.averageGrade.toFixed(1)}</td>
                <td className="px-4 py-2.5 text-center"><span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-black text-white" style={{ background: ACCENT }}>{report.verdict}</span></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {showShare && <ShareModal report={report} avatarUrl={avatarUrl} onClose={() => setShowShare(false)} />}
    </div>
  );
}

// ============================================================
// Main App
// ============================================================

type Screen = 'input' | 'loading' | 'report' | 'error';

export default function App() {
  const [screen, setScreen] = useState<Screen>('input');
  const [username, setUsername] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const handleAnalyze = (u: string) => {
    setUsername(u);
    setScreen('loading');

    Promise.all([fetchAnalytics(u), fetchProfile(u)]).then(([analytics, profile]) => {
      setAvatarUrl(profile?.avatarUrl || null);
      setProfile(profile);

      // fetchAnalytics never returns null — always valid AnalyticsData
      // warning field is set if something went wrong (user not found, timeout, etc.)
      const displayName = profile?.displayName || u;
      const r = buildReport(u, displayName, analytics);
      setReport(r);
      setScreen('report');
    }).catch((e: Error) => {
      setError(e.message || 'Unexpected error');
      setScreen('error');
    });
  };

  const handleBack = () => {
    setScreen('input');
    setReport(null);
    setError('');
    setProfile(null);
  };

  if (screen === 'input') return <InputScreen onAnalyze={handleAnalyze} />;
  if (screen === 'loading') return <LoadingScreen />;
  if (screen === 'error') return <ErrorScreen error={error} profile={profile} username={username} onBack={handleBack} onRetry={() => handleAnalyze(username)} />;
  if (screen === 'report' && report) return <ReportScreen report={report} avatarUrl={avatarUrl} onBack={handleBack} />;
  return <InputScreen onAnalyze={handleAnalyze} />;
}
