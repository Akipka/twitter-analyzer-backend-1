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
// whether they're on the DeFi floor or in the Memecoin Casino, but the B
// is labelled "Yield Farming" vs "Bag Posting".

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
    tweetology: { name: "Yield Farming",       emoji: "🌾", description: "Posts harvested from the timeline this period." },
    replyology: { name: "DAO Governance",      emoji: "🗳️", description: "Engagement in proposals and forum threads." },
    virality:   { name: "TVL Magnetism",       emoji: "🧲", description: "How much liquidity each post pulls in." },
    smartology: { name: "Whitepaper Diction",  emoji: "📄", description: "Depth and substance of the protocol takes." },
    creativity: { name: "Protocol Design",     emoji: "🛠️", description: "Breadth of primitives and topics covered." },
    activity:   { name: "Liquidity Uptime",    emoji: "⏰", description: "Day-to-day presence at the terminal." },
  },
  perps: {
    tweetology: { name: "Position Posting",    emoji: "📈", description: "Trade ideas opened over the period." },
    replyology: { name: "Funding Rate Talk",   emoji: "💸", description: "Banter under other people's positions." },
    virality:   { name: "Liquidation Hype",    emoji: "💥", description: "How loud the chart cries when shared." },
    smartology: { name: "Trade Thesis",        emoji: "🧮", description: "Depth and rigour of the setup write-ups." },
    creativity: { name: "Setup Variety",       emoji: "🎯", description: "Range of pairs, patterns and timeframes played." },
    activity:   { name: "Open Interest",       emoji: "🕯️", description: "Hours staring at the order book each day." },
  },
  memecoins: {
    tweetology: { name: "Bag Posting",         emoji: "💼", description: "Tickers shilled or covered this period." },
    replyology: { name: "Replyguy Quota",      emoji: "🤝", description: "Slid into how many CT threads." },
    virality:   { name: "Pump Magnetism",      emoji: "🚀", description: "How hard the chart moves when shared." },
    smartology: { name: "Tape Reading",        emoji: "📡", description: "Depth of CA / wallet / chart analysis." },
    creativity: { name: "Narrative Crafting",  emoji: "🎨", description: "Range of memes and angles deployed." },
    activity:   { name: "Casino Hours",        emoji: "🎰", description: "Day-to-day grind on the launch pad." },
  },
  nft: {
    tweetology: { name: "Mint Activity",       emoji: "🎨", description: "Pieces dropped or covered this period." },
    replyology: { name: "Floor Discussion",    emoji: "🏛️", description: "Hours spent in the floor wars." },
    virality:   { name: "Floor Magnetism",     emoji: "💎", description: "How far the floor moves on a single post." },
    smartology: { name: "Art Critique",        emoji: "✍️", description: "Depth of the curation and provenance takes." },
    creativity: { name: "Collection Range",    emoji: "🖼️", description: "Variety of styles, eras and projects covered." },
    activity:   { name: "Daily Drops",         emoji: "🗓️", description: "Day-to-day presence in the gallery." },
  },
  prediction: {
    tweetology: { name: "Bet Posting",         emoji: "🎲", description: "Markets entered or covered this period." },
    replyology: { name: "Odds Discussion",     emoji: "💬", description: "Argument under live resolutions." },
    virality:   { name: "Resolution Hype",     emoji: "🎯", description: "How loud the market reacts to a take." },
    smartology: { name: "Thesis Rigour",       emoji: "📑", description: "Depth of the bet write-ups." },
    creativity: { name: "Market Variety",      emoji: "🎰", description: "Range of markets traded." },
    activity:   { name: "Daily Wagers",        emoji: "📅", description: "Day-to-day presence at the book." },
  },
  rwa: {
    tweetology: { name: "Issuance Activity",   emoji: "🏛️", description: "Tokenized issues posted this period." },
    replyology: { name: "Counsel Roundtable", emoji: "⚖️", description: "Engagement in legal/compliance threads." },
    virality:   { name: "TradFi Pickup",       emoji: "📰", description: "How far each take travels into TradFi." },
    smartology: { name: "Diligence Depth",     emoji: "📊", description: "Quality of the structuring & risk takes." },
    creativity: { name: "Asset Variety",       emoji: "🏘️", description: "Range of asset classes covered." },
    activity:   { name: "Trading Desk Hours",  emoji: "💼", description: "Day-to-day presence on the desk." },
  },
  ai: {
    tweetology: { name: "Inference Output",    emoji: "🤖", description: "Posts generated this period." },
    replyology: { name: "Prompt Replies",      emoji: "💬", description: "Engagement in agent / model threads." },
    virality:   { name: "Embedding Pull",      emoji: "🧲", description: "How wide each take resonates." },
    smartology: { name: "Model Reasoning",     emoji: "🧠", description: "Substance of the technical takes." },
    creativity: { name: "Agent Design",        emoji: "🛠️", description: "Range of architectures & ideas explored." },
    activity:   { name: "GPU Uptime",          emoji: "⚡", description: "Day-to-day presence at the keyboard." },
  },
  airdrops: {
    tweetology: { name: "Farm Output",         emoji: "🪂", description: "Campaign updates posted this period." },
    replyology: { name: "Discord-to-X Bridge", emoji: "🌐", description: "Engagement under campaign threads." },
    virality:   { name: "Snapshot Magnetism",  emoji: "📸", description: "How fast each call gets picked up." },
    smartology: { name: "Sybil Defense",       emoji: "🛡️", description: "Depth of the eligibility / ROI takes." },
    creativity: { name: "Campaign Variety",    emoji: "🎯", description: "Range of protocols farmed." },
    activity:   { name: "Daily Quests",        emoji: "📅", description: "Day-to-day grind on the points board." },
  },
  socialfi: {
    tweetology: { name: "Content Output",      emoji: "📝", description: "Pieces published this period." },
    replyology: { name: "Audience Reply",      emoji: "👥", description: "Engagement with subscribers and tippers." },
    virality:   { name: "Follower Magnetism",  emoji: "🧲", description: "How wide each post lands." },
    smartology: { name: "Editorial Voice",     emoji: "🎙️", description: "Substance and originality of the takes." },
    creativity: { name: "Format Range",        emoji: "🎬", description: "Variety of formats, threads, casts, podcasts." },
    activity:   { name: "Streaming Hours",     emoji: "📡", description: "Day-to-day presence on the channel." },
  },
  restaking: {
    tweetology: { name: "Slot Posting",        emoji: "🔁", description: "Operator / AVS updates this period." },
    replyology: { name: "Operator Chat",       emoji: "🛰️", description: "Engagement in restaking ops threads." },
    virality:   { name: "Validator Pull",      emoji: "📡", description: "How widely each take spreads." },
    smartology: { name: "Slashing Risk Takes", emoji: "⚔️", description: "Depth of the security/yield analysis." },
    creativity: { name: "AVS Variety",         emoji: "🧬", description: "Range of services and constructions covered." },
    activity:   { name: "Validator Uptime",    emoji: "⏰", description: "Day-to-day presence on-chain and off-." },
  },
  l2: {
    tweetology: { name: "Block Posting",       emoji: "🛣️", description: "Chain / rollup updates this period." },
    replyology: { name: "Sequencer Banter",    emoji: "💬", description: "Engagement in chain-war threads." },
    virality:   { name: "TPS Hype",            emoji: "🚀", description: "How loud each take travels." },
    smartology: { name: "Architecture Takes",  emoji: "🏗️", description: "Depth of modular / DA / proofs takes." },
    creativity: { name: "Chain Range",         emoji: "🌐", description: "Variety of L2/L1 ecosystems covered." },
    activity:   { name: "Block-time Uptime",   emoji: "⏱️", description: "Day-to-day presence on the timeline." },
  },
  macro: {
    tweetology: { name: "Print Posting",       emoji: "📰", description: "Macro / policy posts this period." },
    replyology: { name: "Fed Watch Replies",   emoji: "🏛️", description: "Engagement in macro and ETF threads." },
    virality:   { name: "Headline Pull",       emoji: "📡", description: "How far each macro take travels." },
    smartology: { name: "Print Reading",       emoji: "📊", description: "Depth and accuracy of macro analysis." },
    creativity: { name: "Asset Range",         emoji: "🌍", description: "Variety of assets and themes covered." },
    activity:   { name: "Bloomberg Hours",     emoji: "💹", description: "Day-to-day presence at the terminal." },
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
