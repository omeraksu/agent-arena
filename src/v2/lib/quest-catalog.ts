/**
 * Quest Catalog — Static quest definitions for QuestArena + QuestDetail.
 *
 * Faz 3: hardcoded catalog (mock data).
 * Faz 6: backend'e taşınacak (Supabase `quests` table).
 *
 * Günlük (daily) ve haftalık (weekly) görevler ayrı listelerde tutuluyor.
 * QuestDetail hem daily hem weekly ID'leri için aynı detail lookup'a bakar.
 */

import type { ChipColor } from "../../components/ui";

// ─── Types ─────────────────────────────────────────────────────────────

export type QuestKind = "daily" | "weekly";
export type QuestStatus = "done" | "active" | "locked";

export interface QuestStep {
  id: string;
  title: string;
  description?: string;
  status: QuestStatus;
}

export interface QuestResource {
  label: string;
  url: string;
  dotColor: ChipColor;
}

export interface QuestCatalogItem {
  id: string;
  kind: QuestKind;
  title: string;
  subtitle: string;
  /** Detail sayfası için tam açıklama */
  description: string;
  xp: number;
  accent: ChipColor;
  status: QuestStatus;
  progress?: { current: number; total: number };
  /** Done ise rozet yazısı */
  completedText?: string;
  /** Locked ise kilit açma koşulu */
  lockedHint?: string;
  /** Detail ekranında listelenen adımlar */
  steps: QuestStep[];
  /** Detail ekranında listelenen kaynaklar */
  resources: QuestResource[];
  /** Detail ekranının ana CTA'sı */
  cta?: { label: string; href: string };
}

// ─── Daily quests (bugün yenilenir, 5 görev) ────────────────────────────

export const DAILY_QUESTS: QuestCatalogItem[] = [
  {
    id: "daily_blockchain_101",
    kind: "daily",
    title: "Blockchain 101",
    subtitle: "Blockchain nedir sorusunu agent'a cevaplat",
    description:
      "ARIA ile blockchain temellerini konuş. Ne olduğunu, neden önemli olduğunu ve sahiplik kavramını anlamaya çalış.",
    xp: 25,
    accent: "teal",
    status: "done",
    completedText: "✓ tamamlandı",
    steps: [
      { id: "s1", title: "Agent'a \"blockchain nedir?\" sor", status: "done" },
      { id: "s2", title: "Sahiplik kavramını açıklat", status: "done" },
    ],
    resources: [
      { label: "Avalanche Academy — Fundamentals", url: "https://build.avax.network/academy", dotColor: "teal" },
    ],
    cta: { label: "Tamamlandı ✓", href: "/v2/quest" },
  },
  {
    id: "daily_defi_kesfi",
    kind: "daily",
    title: "DeFi Keşfi",
    subtitle: "Agent'a \"DeFi nedir\" sor ve 3 protokol öğren",
    description:
      "Agent'a DeFi hakkında sorular sor ve 3 temel protokol türünü öğren.",
    xp: 25,
    accent: "purple",
    status: "active",
    progress: { current: 1, total: 3 },
    steps: [
      { id: "s1", title: "Agent'a \"DeFi nedir?\" sor", status: "done" },
      {
        id: "s2",
        title: "3 DeFi protokol türünü öğren",
        description: "DEX, Lending, Yield Farming",
        status: "active",
      },
      { id: "s3", title: "Öğrendiklerini özetle", status: "locked" },
    ],
    resources: [
      { label: "Avalanche Academy — DeFi Fundamentals", url: "https://build.avax.network/academy", dotColor: "blue" },
      { label: "Cascade — DeFi projeleri", url: "https://cascade.team1.network", dotColor: "red" },
    ],
    cta: { label: "CONNECT WALLET", href: "/wallet" },
  },
  {
    id: "daily_wallet_macerasi",
    kind: "daily",
    title: "Wallet Macerası",
    subtitle: "Core Wallet oluştur ve faucet'ten AVAX al",
    description:
      "Core Wallet'ı kur, embedded wallet üzerinden test AVAX al. Cüzdanlarla tanış.",
    xp: 25,
    accent: "amber",
    status: "locked",
    lockedHint: "DeFi Keşfi'ni tamamla",
    steps: [
      { id: "s1", title: "Core Wallet'ı kur", status: "locked" },
      { id: "s2", title: "Faucet'ten 1 test AVAX al", status: "locked" },
      { id: "s3", title: "İlk transferini yap", status: "locked" },
    ],
    resources: [
      { label: "core.app", url: "https://core.app", dotColor: "teal" },
    ],
    cta: { label: "Kilitli · Önce DeFi Keşfi", href: "/v2/quest" },
  },
];

// ─── Weekly quests (haftalık, daha uzun XP rewards) ──────────────────────

export const WEEKLY_QUESTS: QuestCatalogItem[] = [
  {
    id: "weekly_5_chat_session",
    kind: "weekly",
    title: "5 Chat Session Tamamla",
    subtitle: "Bu hafta 5 farklı konuda agent'la konuş",
    description:
      "Agent'a 5 farklı konuda soru sor, her session'da en az 3 mesajlık bir diyalog kur.",
    xp: 250,
    accent: "blue",
    status: "active",
    progress: { current: 3, total: 5 },
    steps: [
      { id: "s1", title: "DeFi hakkında konuş", status: "done" },
      { id: "s2", title: "NFT deploy hakkında konuş", status: "done" },
      { id: "s3", title: "Gas fees hakkında konuş", status: "done" },
      { id: "s4", title: "L1 vs L2 hakkında konuş", status: "active" },
      { id: "s5", title: "Yeni bir konu seç", status: "locked" },
    ],
    resources: [
      { label: "ARIA Agent Chat", url: "/v2/chat", dotColor: "teal" },
    ],
    cta: { label: "Chat'e git", href: "/v2/chat" },
  },
  {
    id: "weekly_event_katil",
    kind: "weekly",
    title: "Etkinliğe Katıl",
    subtitle: "Herhangi bir ARIA Hub etkinliğine katıl",
    description:
      "Team1 Türkiye'nin yaklaşan etkinliklerinden birine RSVP ol ve katılımını onayla.",
    xp: 250,
    accent: "amber",
    status: "active",
    progress: { current: 0, total: 1 },
    steps: [
      { id: "s1", title: "Yaklaşan etkinliklere göz at", status: "active" },
      { id: "s2", title: "Bir etkinliğe RSVP ol", status: "locked" },
      { id: "s3", title: "Katılımını doğrula", status: "locked" },
    ],
    resources: [
      { label: "Team1 — etkinlikler", url: "https://team1.network", dotColor: "purple" },
    ],
    cta: { label: "Etkinlikleri gör", href: "/v2/hub" },
  },
];

// ─── Lookup helpers ────────────────────────────────────────────────────

const ALL_QUESTS: QuestCatalogItem[] = [...DAILY_QUESTS, ...WEEKLY_QUESTS];

export function getQuestById(id: string): QuestCatalogItem | undefined {
  return ALL_QUESTS.find((q) => q.id === id);
}

export function getDailyQuests(): QuestCatalogItem[] {
  return DAILY_QUESTS;
}

export function getWeeklyQuests(): QuestCatalogItem[] {
  return WEEKLY_QUESTS;
}

export function countCompletedToday(): number {
  return DAILY_QUESTS.filter((q) => q.status === "done").length;
}

export function countTotalToday(): number {
  return DAILY_QUESTS.length;
}
