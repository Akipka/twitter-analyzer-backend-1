// Inline SVG fallback avatar with initials, in our paper/crimson palette.
// Used when the network avatar fails or is empty (e.g. demo mode where
// unavatar.io is occasionally slow / blocked by ad-blockers).

const PALETTE = [
  // muted-warm crimson family — same family as --accent / --accent-deep
  { bg: "#9c433e", fg: "#faf6ee" },
  { bg: "#7d2f2c", fg: "#faf6ee" },
  { bg: "#b85952", fg: "#1f1d1a" },
  { bg: "#5a564e", fg: "#faf6ee" },
  { bg: "#3a3733", fg: "#faf6ee" },
  { bg: "#7f8082", fg: "#1f1d1a" },
];

function hashCode(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function initials(name: string): string {
  const parts = name
    .replace(/\(demo\)/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface AvatarFallback {
  initials: string;
  bg: string;
  fg: string;
}

export function avatarFallback(name: string, username: string): AvatarFallback {
  const seed = hashCode(username || name || "anon");
  const { bg, fg } = PALETTE[seed % PALETTE.length];
  return { initials: initials(name || username || "?"), bg, fg };
}

// Renders the initials avatar into a PNG data URL using the Canvas API.
// We use this PNG as the <img src> so html2canvas captures it reliably —
// inline SVG <text> and HTML <span> don't always survive html2canvas's
// foreignObject renderer (the text disappears in the snapshot).
export function avatarPng(name: string, username: string, size = 192): string {
  const { initials, bg, fg } = avatarFallback(name, username);
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = fg;
  ctx.font = `900 ${Math.round(size * 0.46)}px "Fraunces", "Times New Roman", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, size / 2, size / 2 + size * 0.04);
  return c.toDataURL("image/png");
}
