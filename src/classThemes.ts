// Crypto-class subject themes.
//
// The grading logic is universal — `gradeTweetology`, `gradeReplyology`, etc.
// produce a `SubjectGrade` with the same numeric grade for every user. But
// once we've decided which Crypto Twitter "class" the user belongs to, we
// re-skin each subject so the report card *reads* like it came out of that
// class's lesson plan.
//
// Only the cosmetic fields change: subject `name`, `emoji`, and one-line
// `description`. The metric, value, comment, and grade are all preserved.
// That keeps the system honest — a user who posts ~2 times a day gets a B
// whether they're on the DeFi floor or in the Shitposting room, but the B
// is labelled "Yield Farming" vs "Cope Output".

import type { SubjectGrade } from "./grading";

interface SubjectTheme {
  name: string;
  emoji: string;
  description: string;
}

// Order matches the six base subject ids from grading.ts.
type ClassTheme = {
  tweetology: SubjectTheme;
  replyology: SubjectTheme;
  virality: SubjectTheme;
  smartology: SubjectTheme;
  creativity: SubjectTheme;
  activity: SubjectTheme;
};

// Each class gets 6 themed subjects. The id under each entry is the *base*
// subject id (`s.id` on the SubjectGrade); applying the theme overrides
// the visible name/emoji/description but leaves grade, comment, metric
// untouched. New classes can be added by extending this map plus the
// `CLASSES` dict on the backend.
const THEMES: Record<string, ClassTheme> = {
  defi: {
    tweetology: { name: "Yield Farming",      emoji: "🌾", description: "Posts harvested from the timeline this period." },
    replyology: { name: "DAO Governance",     emoji: "🗳️", description: "Engagement in proposals and forum threads." },
    virality:   { name: "TVL Magnetism",      emoji: "🧲", description: "How much liquidity each post pulls in." },
    smartology: { name: "Whitepaper Diction", emoji: "📄", description: "Depth and substance of the protocol takes." },
    creativity: { name: "Protocol Design",    emoji: "🛠️", description: "Breadth of primitives and topics covered." },
    activity:   { name: "Liquidity Uptime",   emoji: "⏰", description: "Day-to-day presence at the terminal." },
  },
  perps: {
    tweetology: { name: "Position Posting",   emoji: "📈", description: "Trade ideas opened over the period." },
    replyology: { name: "Funding Rate Talk",  emoji: "💸", description: "Banter under other people's positions." },
    virality:   { name: "Liquidation Hype",   emoji: "💥", description: "How loud the chart cries when shared." },
    smartology: { name: "Trade Thesis",       emoji: "🧮", description: "Depth and rigour of the setup write-ups." },
    creativity: { name: "Setup Variety",      emoji: "🎯", description: "Range of pairs, patterns and timeframes played." },
    activity:   { name: "Open Interest",      emoji: "🕯️", description: "Hours staring at the order book each day." },
  },
  nft: {
    tweetology: { name: "Mint Activity",      emoji: "🎨", description: "Pieces dropped or covered this period." },
    replyology: { name: "Floor Discussion",   emoji: "🏛️", description: "Hours spent in the floor wars." },
    virality:   { name: "Floor Magnetism",    emoji: "💎", description: "How far the floor moves on a single post." },
    smartology: { name: "Art Critique",       emoji: "✍️", description: "Depth of the curation and provenance takes." },
    creativity: { name: "Collection Range",   emoji: "🖼️", description: "Variety of styles, eras and projects covered." },
    activity:   { name: "Daily Drops",        emoji: "🗓️", description: "Day-to-day presence in the gallery." },
  },
  trading: {
    tweetology: { name: "Setup Posting",      emoji: "🕯️", description: "Calls and setups shared over the period." },
    replyology: { name: "Calls Engagement",   emoji: "📞", description: "Replying to other traders' charts." },
    virality:   { name: "Pump Generation",    emoji: "🚀", description: "How hard the candle moves on a post." },
    smartology: { name: "Analysis Depth",     emoji: "🔍", description: "Substance of the technical write-ups." },
    creativity: { name: "Indicator Variety",  emoji: "📊", description: "Range of tools and timeframes invoked." },
    activity:   { name: "Screen Time",        emoji: "🖥️", description: "Daily hours glued to the chart." },
  },
  shitposting: {
    tweetology: { name: "Cope Output",        emoji: "😭", description: "Daily volume of pure shitposts." },
    replyology: { name: "Quote-Tweet Wars",   emoji: "🪞", description: "Engagement in the running lore wars." },
    virality:   { name: "Banger Index",       emoji: "🔥", description: "Frequency of certified bangers." },
    smartology: { name: "Lore Density",       emoji: "📚", description: "Substance smuggled in under the irony." },
    creativity: { name: "Mememagic",          emoji: "🪄", description: "Range of formats, references and bits." },
    activity:   { name: "Tweet Storm",        emoji: "⛈️", description: "Daily presence on the timeline." },
  },
  prediction: {
    tweetology: { name: "Bet Posting",        emoji: "🎲", description: "Markets entered or covered this period." },
    replyology: { name: "Odds Discussion",    emoji: "💬", description: "Argument under live resolutions." },
    virality:   { name: "Resolution Hype",    emoji: "🎯", description: "How loud the market reacts to a take." },
    smartology: { name: "Thesis Length",      emoji: "📑", description: "Depth of the bet write-ups." },
    creativity: { name: "Market Variety",     emoji: "🎰", description: "Range of markets traded." },
    activity:   { name: "Daily Wagers",       emoji: "📅", description: "Day-to-day presence at the book." },
  },
};

/**
 * Apply the class theme to the subjects. If the class id is unknown
 * (e.g. "general" or anything the backend doesn't theme yet), the
 * subjects are returned untouched — the report card stays in its
 * original "general school" form.
 */
export function applyClassTheme(
  subjects: SubjectGrade[],
  classId: string | undefined,
): SubjectGrade[] {
  if (!classId) return subjects;
  const theme = THEMES[classId];
  if (!theme) return subjects;
  return subjects.map((s) => {
    const t = theme[s.id as keyof ClassTheme];
    if (!t) return s;
    return {
      ...s,
      name: t.name,
      emoji: t.emoji,
      description: t.description,
    };
  });
}

/**
 * Mock-section assignment: derive a stable, school-style "Section X-NN"
 * label from the class id and username so the same user always lands
 * in the same section. Doesn't affect classmate matching — it's purely
 * a flavour string for the report card header.
 */
export function sectionLabel(classId: string, username: string): string {
  const seed = (classId + ":" + username.toLowerCase())
    .split("")
    .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const letter = String.fromCharCode("A".charCodeAt(0) + (seed % 6));
  const number = (seed >> 4) % 12 + 1;
  return `Section ${letter}-${number.toString().padStart(2, "0")}`;
}
