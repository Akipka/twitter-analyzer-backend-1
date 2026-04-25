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

export function svgAvatar(name: string, username: string): string {
  const seed = hashCode(username || name || "anon");
  const { bg, fg } = PALETTE[seed % PALETTE.length];
  const text = initials(name || username || "?");
  // Base64-encoded SVG so it works as <img src="data:..."> with no network.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
    <rect width="96" height="96" fill="${bg}"/>
    <text x="48" y="58" text-anchor="middle"
          font-family="Fraunces, 'Times New Roman', serif"
          font-weight="800" font-size="42" fill="${fg}">${text}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
