/**
 * XP & Level — client-side XP derivation (Faz 2).
 *
 * Kaynak: `ArenaContext.completedTypes` (user'ın tamamladığı event type'ları).
 * Her event type'a sabit XP değeri atanır. Toplam XP'den level ve progress türer.
 *
 * Level formülü: `level = floor(xp / 100) + 1` — basit, lineer.
 * XP'yi backend'e taşıma Faz 6'da.
 *
 * Streak: Client-side, localStorage'da son giriş tarihi + ardışık gün sayısı.
 */

// ─── Event type → XP mapping ───────────────────────────────────────────

const XP_TABLE: Record<string, number> = {
  wallet_created: 20,
  faucet: 15,
  transfer: 10,
  transfer_request: 5,
  transfer_request_accepted: 8,
  nft_mint: 50,
  agent_registered: 25,
  agent_message: 5,
  quiz_completed: 25,
  meme_submitted: 15,
  meme_voted: 5,
  meme_winner: 40,
  signal_pulse: 10,
  lobby_joined: 5,
  treasure_hunt_started: 10,
  fragment_collected: 15,
  treasure_redeemed: 60,
};

// ─── Level titles (Figma "Explorer" chip'ine benzer) ────────────────────

interface LevelTier {
  minXP: number;
  title: string;
  dotColor: "teal" | "blue" | "purple" | "amber" | "red";
}

const LEVEL_TIERS: LevelTier[] = [
  { minXP: 0,    title: "Başlangıç",  dotColor: "teal" },
  { minXP: 100,  title: "Explorer",   dotColor: "teal" },
  { minXP: 300,  title: "Builder",    dotColor: "blue" },
  { minXP: 600,  title: "Architect",  dotColor: "purple" },
  { minXP: 1000, title: "Commander",  dotColor: "amber" },
  { minXP: 2000, title: "Legend",     dotColor: "red" },
];

// ─── Public API ────────────────────────────────────────────────────────

export function computeUserXP(completedTypes: string[]): number {
  let total = 0;
  for (const type of completedTypes) {
    total += XP_TABLE[type] ?? 0;
  }
  return total;
}

export function computeUserLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export interface LevelProgress {
  level: number;
  title: string;
  dotColor: LevelTier["dotColor"];
  currentLevelXP: number;
  nextLevelXP: number;
  progressRatio: number; // 0..1
}

export function computeLevelProgress(xp: number): LevelProgress {
  const level = computeUserLevel(xp);
  const currentLevelXP = (level - 1) * 100;
  const nextLevelXP = level * 100;
  const progressRatio = (xp - currentLevelXP) / (nextLevelXP - currentLevelXP);

  // Find current tier
  let tier = LEVEL_TIERS[0];
  for (const t of LEVEL_TIERS) {
    if (xp >= t.minXP) tier = t;
  }

  return {
    level,
    title: tier.title,
    dotColor: tier.dotColor,
    currentLevelXP: xp - currentLevelXP,
    nextLevelXP: nextLevelXP - currentLevelXP,
    progressRatio: Math.min(1, Math.max(0, progressRatio)),
  };
}

// ─── Streak (localStorage) ─────────────────────────────────────────────

const STREAK_KEY = "aria_streak";
const STREAK_DATE_KEY = "aria_streak_last_date";

interface StreakData {
  count: number;
  lastDate: string; // YYYY-MM-DD
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function getStreak(): StreakData {
  const countRaw = localStorage.getItem(STREAK_KEY);
  const lastDate = localStorage.getItem(STREAK_DATE_KEY) ?? "";
  const count = countRaw ? parseInt(countRaw, 10) || 0 : 0;
  return { count, lastDate };
}

/**
 * Streak'i bugün için güncelle. Bugün zaten işaretliyse no-op.
 * Dün işaretliyse +1, eski tarihte ise reset (1).
 */
export function checkInStreak(): StreakData {
  const { count, lastDate } = getStreak();
  const today = todayKey();

  if (lastDate === today) {
    return { count, lastDate };
  }

  let newCount: number;
  if (lastDate === yesterdayKey()) {
    newCount = count + 1;
  } else {
    newCount = 1;
  }

  localStorage.setItem(STREAK_KEY, String(newCount));
  localStorage.setItem(STREAK_DATE_KEY, today);
  return { count: newCount, lastDate: today };
}
