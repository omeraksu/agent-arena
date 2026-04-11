/**
 * Quests — client-side daily quest engine (Faz 2).
 *
 * Template-based: sabit quest tanımları, günlük rotasyon (date-seed ile
 * deterministik). Tamamlanma state'i localStorage'da + `ArenaContext`
 * completedTypes ile cross-check.
 *
 * Faz 6'da Supabase backend'e migrate edilecek.
 */

import type { LevelProgress } from "./xp";

export interface QuestTemplate {
  id: string;
  title: string;
  subtitle: string;
  /** XP reward */
  xp: number;
  /** Hub Mode'da hangi accent */
  accent: "teal" | "purple" | "amber" | "blue" | "red";
  /** Tamamlanma için gereken event type (ArenaContext.completedTypes kontrol) */
  requiresEventType?: string;
  /** Derin link: Quest card tıklanınca gidilecek route */
  href: string;
  /** İkon (emoji veya kısa glyph) */
  icon: string;
}

// ─── Quest Templates ───────────────────────────────────────────────────

const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    id: "daily_quest",
    title: "Quest",
    subtitle: "Günlük görev hazır",
    xp: 25,
    accent: "purple",
    href: "/v2/quest",
    icon: "◆",
  },
  {
    id: "daily_chat",
    title: "Chat",
    subtitle: "Agent'la konuş",
    xp: 10,
    accent: "teal",
    requiresEventType: "agent_message",
    href: "/v2/chat",
    icon: ">_",
  },
  {
    id: "daily_transfer",
    title: "Transfer",
    subtitle: "Birine token gönder",
    xp: 10,
    accent: "blue",
    requiresEventType: "transfer",
    href: "/wallet",
    icon: "⚡",
  },
  {
    id: "daily_quiz",
    title: "Quiz",
    subtitle: "Yeni bir konu öğren",
    xp: 25,
    accent: "amber",
    requiresEventType: "quiz_completed",
    href: "/v2/quest",
    icon: "?",
  },
  {
    id: "daily_meme",
    title: "Meme",
    subtitle: "Günün memesine oy ver",
    xp: 5,
    accent: "red",
    requiresEventType: "meme_voted",
    href: "/meme-arena",
    icon: "✦",
  },
];

// ─── Daily rotation (deterministik, date-seed) ──────────────────────────

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Bugünün quest listesi. İlk 2 sabit (Quest + Chat), sonraki 2-3 rotasyonla
 * seçilir. Toplam 3-4 quest/gün.
 */
export function getTodayQuests(): QuestTemplate[] {
  const fixed = QUEST_TEMPLATES.filter((q) => q.id === "daily_quest" || q.id === "daily_chat");
  const rotating = QUEST_TEMPLATES.filter(
    (q) => q.id !== "daily_quest" && q.id !== "daily_chat",
  );
  const seed = dayOfYear();
  // Rotasyondan 2 tane seç
  const picked: QuestTemplate[] = [];
  for (let i = 0; i < 2; i++) {
    const idx = (seed + i) % rotating.length;
    picked.push(rotating[idx]);
  }
  return [...fixed, ...picked];
}

// ─── Completion state ──────────────────────────────────────────────────

const COMPLETED_KEY = "aria_quests_completed";
const COMPLETED_DATE_KEY = "aria_quests_date";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Bugün için tamamlanan quest ID listesi. Tarih değiştiyse otomatik reset.
 */
export function getCompletedQuestIds(): string[] {
  const date = localStorage.getItem(COMPLETED_DATE_KEY);
  if (date !== todayKey()) {
    // Daily reset
    localStorage.setItem(COMPLETED_DATE_KEY, todayKey());
    localStorage.setItem(COMPLETED_KEY, "[]");
    return [];
  }
  try {
    const raw = localStorage.getItem(COMPLETED_KEY) ?? "[]";
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function markQuestCompleted(questId: string): void {
  const current = getCompletedQuestIds();
  if (current.includes(questId)) return;
  current.push(questId);
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(current));
  localStorage.setItem(COMPLETED_DATE_KEY, todayKey());
}

/**
 * Quest otomatik tamamlanma check'i: `requiresEventType` varsa,
 * `ArenaContext.completedTypes` bunu içeriyorsa, markQuestCompleted çağır.
 */
export function syncQuestsFromEvents(completedTypes: string[]): string[] {
  const quests = getTodayQuests();
  const completedIds = getCompletedQuestIds();
  const updated = [...completedIds];

  for (const quest of quests) {
    if (!quest.requiresEventType) continue;
    if (completedTypes.includes(quest.requiresEventType) && !updated.includes(quest.id)) {
      updated.push(quest.id);
    }
  }

  if (updated.length !== completedIds.length) {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(updated));
    localStorage.setItem(COMPLETED_DATE_KEY, todayKey());
  }

  return updated;
}

// ─── Re-export LevelProgress type for convenience ──────────────────────
export type { LevelProgress };
