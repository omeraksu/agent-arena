/**
 * HubHome — Quest-centric landing page (Faz 2 full).
 *
 * Figma referansı: MemberHub/Home (69:3)
 *
 * Yapı (Figma sırası):
 *   1. Greeting (Merhaba + level chip + XP strip)
 *   2. BUGÜN — QuestTodayCard × 2 grid
 *   3. SON AKTİVİTE — ActivityTimeline
 *   4. KOLEKSİYON — CollectionStrip (horizontal scroll)
 *   5. SONRAKİ ETKİNLİK — NextEventCard
 *
 * Veri kaynağı (Faz 2 fake/client-side):
 *   - userName + completedTypes: ArenaContext
 *   - XP/level: computeLevelProgress(completedTypes)
 *   - Quest list: getTodayQuests() + syncQuestsFromEvents()
 *   - Activity entries: completedTypes → mock mapping
 *   - Collection: hardcoded 3 örnek (Faz 6'da NFT API)
 *   - Next event: hardcoded (Faz 6'da event API)
 */
import { useMemo, useEffect } from "react";
import { useArena } from "@/contexts/ArenaContext";
import { Greeting } from "../components/Greeting";
import { QuestTodayCard } from "../components/QuestTodayCard";
import { ActivityTimeline, type ActivityEntry } from "../components/ActivityTimeline";
import { CollectionStrip, type CollectionItem } from "../components/CollectionStrip";
import { NextEventCard, type NextEvent } from "../components/NextEventCard";
import {
  computeUserXP,
  computeLevelProgress,
  checkInStreak,
} from "../lib/xp";
import {
  getTodayQuests,
  syncQuestsFromEvents,
} from "../lib/quests";

// ─── Section header helper ─────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-arena-text-tertiary mb-3">
      {children}
    </h2>
  );
}

// ─── completedTypes → activity entries mapping ─────────────────────────

interface ActivityMapEntry {
  title: string;
  xp: number;
  dotColor: ActivityEntry["dotColor"];
}

const ACTIVITY_LABELS: Record<string, ActivityMapEntry> = {
  nft_mint:          { title: "NFT kazanıldı",               xp: 50, dotColor: "amber"  },
  agent_message:     { title: "Agent ile chat session",      xp: 10, dotColor: "blue"   },
  agent_registered:  { title: "Agent oluşturuldu",           xp: 25, dotColor: "purple" },
  transfer:          { title: "Transfer tamamlandı",         xp: 10, dotColor: "teal"   },
  faucet:            { title: "Faucet'tan token alındı",     xp: 15, dotColor: "teal"   },
  wallet_created:    { title: "Cüzdan oluşturuldu",          xp: 20, dotColor: "teal"   },
  quiz_completed:    { title: "Quiz tamamlandı",             xp: 25, dotColor: "purple" },
  meme_submitted:    { title: "Meme gönderildi",             xp: 15, dotColor: "red"    },
  meme_voted:        { title: "Meme oylandı",                xp: 5,  dotColor: "red"    },
  signal_pulse:      { title: "Signal pulse katılımı",       xp: 10, dotColor: "teal"   },
  fragment_collected:{ title: "Treasure fragment bulundu",   xp: 15, dotColor: "amber"  },
  treasure_redeemed: { title: "Treasure ödülü alındı",       xp: 60, dotColor: "amber"  },
};

function deriveActivityEntries(completedTypes: string[]): ActivityEntry[] {
  // Son 5 tamamlanmış type'ı al, ters sırayla (en yeni üstte)
  const recent = completedTypes.slice(-5).reverse();
  return recent
    .map((type, idx) => {
      const meta = ACTIVITY_LABELS[type];
      if (!meta) return null;
      return {
        id: `${type}_${idx}`,
        title: meta.title,
        xp: meta.xp,
        relativeTime: idx === 0 ? "az önce" : idx === 1 ? "bugün" : `${idx} gün önce`,
        dotColor: meta.dotColor,
      } satisfies ActivityEntry;
    })
    .filter((x): x is ActivityEntry => x !== null);
}

// ─── Mock static data (Faz 2) ──────────────────────────────────────────

const MOCK_COLLECTION: CollectionItem[] = [
  { id: "nft_1", glyph: ">_", accent: "teal",   href: "/profile" },
  { id: "nft_2", glyph: "◆",  accent: "purple", href: "/profile" },
  { id: "nft_3", glyph: "⬡",  accent: "blue",   href: "/profile" },
  { id: "nft_4", glyph: "▲",  accent: "amber",  href: "/profile" },
  { id: "nft_5", glyph: "✦",  accent: "red",    href: "/profile" },
  { id: "nft_6", glyph: "◉",  accent: "teal",   href: "/profile" },
];

const MOCK_NEXT_EVENT: NextEvent = {
  title: "Builder Night",
  location: "Kozalak Hub · Bursa",
  dateISO: "2026-04-25",
  rsvpHref: "https://team1.network",
  accent: "teal",
};

// ─── Page component ────────────────────────────────────────────────────

export default function HubHome() {
  const { userName, completedTypes } = useArena();

  // Check in streak once on mount
  useEffect(() => {
    checkInStreak();
  }, []);

  // XP / level progress
  const progress = useMemo(() => {
    const xp = computeUserXP(completedTypes);
    return computeLevelProgress(xp);
  }, [completedTypes]);

  // Today's quests + completed IDs (sync with events)
  const { quests, completedQuestIds } = useMemo(() => {
    const quests = getTodayQuests();
    const completed = syncQuestsFromEvents(completedTypes);
    return { quests, completedQuestIds: completed };
  }, [completedTypes]);

  // Top 2 quest for "BUGÜN" grid
  const todayPair = quests.slice(0, 2);

  // Activity entries derived from completedTypes
  const activityEntries = useMemo(
    () => deriveActivityEntries(completedTypes),
    [completedTypes],
  );

  return (
    <div className="flex flex-col gap-8 pb-6">
      {/* 1. Greeting + XP strip */}
      <Greeting userName={userName} progress={progress} />

      {/* 2. Bugün */}
      <section>
        <SectionTitle>Bugün</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {todayPair.map((quest) => (
            <QuestTodayCard
              key={quest.id}
              quest={quest}
              completed={completedQuestIds.includes(quest.id)}
            />
          ))}
        </div>
      </section>

      {/* 3. Son aktivite */}
      <section>
        <SectionTitle>Son aktivite</SectionTitle>
        <ActivityTimeline entries={activityEntries} />
      </section>

      {/* 4. Koleksiyon */}
      <section>
        <SectionTitle>Koleksiyon</SectionTitle>
        <CollectionStrip items={MOCK_COLLECTION} visibleCount={4} />
      </section>

      {/* 5. Sonraki etkinlik */}
      <section>
        <SectionTitle>Sonraki etkinlik</SectionTitle>
        <NextEventCard event={MOCK_NEXT_EVENT} />
      </section>
    </div>
  );
}
