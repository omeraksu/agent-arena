/**
 * ProfileV2 — User profile with stats + events + NFT collection + settings.
 *
 * Figma: Profile (71:53)
 *
 * Yapı (tek-scroll):
 *   1. Header: [← back] "Profil"
 *   2. Identity: avatar glyph + name + level chip + address + XP strip
 *   3. İSTATİSTİKLER — 2x2 stat grid (XP / Streak / Quest / Session)
 *   4. KATILDIĞIN ETKİNLİKLER — event list
 *   5. NFT KOLEKSİYONU — 4-col grid
 *   6. AYARLAR — Core Wallet bağlı status
 *
 * Plan orijinal 3 sub-tab öneriyordu (Collection/Network/Settings); Figma tek
 * scroll ile tasarlanmış, ARIA kararı: Figma'yı takip et, sub-tab kaldırıldı.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useActiveAccount } from "thirdweb/react";
import { useArena } from "@/contexts/ArenaContext";
import { cn } from "../../lib/cn";
import { ChipPill } from "../../components/ui";
import { XPProgressStrip } from "../components/XPProgressStrip";
import { computeUserXP, computeLevelProgress, getStreak } from "../lib/xp";

// ─── Icons ──────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

// ─── Stat tile (2x2 grid) ───────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  color: "teal" | "purple" | "amber" | "blue";
}

const STAT_TEXT: Record<StatCardProps["color"], string> = {
  teal:   "text-arena-teal",
  purple: "text-arena-purple",
  amber:  "text-arena-amber",
  blue:   "text-arena-blue",
};

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-md border border-arena-text-muted/25 bg-arena-bg-surface">
      <div className="font-mono text-[10px] uppercase tracking-wider text-arena-text-tertiary">
        {label}
      </div>
      <div className={cn("text-2xl font-bold tabular-nums", STAT_TEXT[color])}>
        {value}
      </div>
    </div>
  );
}

// ─── Event row (KATILDIĞIN ETKİNLİKLER) ─────────────────────────────────

interface PastEvent {
  id: string;
  title: string;
  location: string;
  date: string;
  dotColor: "teal" | "purple" | "blue" | "amber";
}

const MOCK_PAST_EVENTS: PastEvent[] = [
  { id: "e1", title: "Builder Night", location: "Kozalak Hub", date: "11 Nis 2025", dotColor: "teal" },
  { id: "e2", title: "Workshop",       location: "Mersin GGK",   date: "8 Mar 2025",  dotColor: "purple" },
  { id: "e3", title: "Blockchain 101", location: "ESTÜ",         date: "22 Şub 2025", dotColor: "blue" },
];

const DOT_BG: Record<PastEvent["dotColor"], string> = {
  teal:   "bg-arena-teal",
  purple: "bg-arena-purple",
  blue:   "bg-arena-blue",
  amber:  "bg-arena-amber",
};

function EventRow({ event }: { event: PastEvent }) {
  return (
    <li className="flex items-start gap-3 py-3 border-b border-arena-text-muted/15 last:border-0">
      <span
        className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", DOT_BG[event.dotColor])}
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-arena-text-primary leading-tight">
          {event.title} <span className="text-arena-text-secondary">· {event.location}</span>
        </div>
        <div className="font-mono text-[10px] text-arena-text-tertiary mt-0.5">
          {event.date}
        </div>
      </div>
    </li>
  );
}

// ─── NFT collection grid ────────────────────────────────────────────────

interface NFTItem {
  id: string;
  glyph: string;
  accent: "teal" | "purple" | "blue" | "amber" | "red";
}

const MOCK_NFTS: NFTItem[] = [
  { id: "n1", glyph: ">_", accent: "teal"   },
  { id: "n2", glyph: "◆",  accent: "purple" },
  { id: "n3", glyph: "⬡",  accent: "blue"   },
  { id: "n4", glyph: "▲",  accent: "amber"  },
];

const NFT_BORDER: Record<NFTItem["accent"], string> = {
  teal:   "border-arena-teal/60",
  purple: "border-arena-purple/60",
  blue:   "border-arena-blue/60",
  amber:  "border-arena-amber/60",
  red:    "border-arena-red/60",
};

const NFT_TEXT: Record<NFTItem["accent"], string> = {
  teal:   "text-arena-teal",
  purple: "text-arena-purple",
  blue:   "text-arena-blue",
  amber:  "text-arena-amber",
  red:    "text-arena-red",
};

function NFTCell({ nft }: { nft: NFTItem }) {
  return (
    <div
      className={cn(
        "aspect-square flex items-center justify-center rounded-md bg-arena-bg-elevated border-2",
        NFT_BORDER[nft.accent],
      )}
    >
      <span className={cn("font-mono text-2xl font-bold", NFT_TEXT[nft.accent])} aria-hidden>
        {nft.glyph}
      </span>
    </div>
  );
}

// ─── Section title ──────────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-arena-text-tertiary mb-3">
      {children}
    </h2>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────

export default function ProfileV2() {
  const { userName, completedTypes } = useArena();
  const account = useActiveAccount();

  const progress = useMemo(() => {
    const xp = computeUserXP(completedTypes);
    return computeLevelProgress(xp);
  }, [completedTypes]);

  const streak = useMemo(() => getStreak(), []);

  const totalXP = useMemo(() => computeUserXP(completedTypes), [completedTypes]);
  const questCount = useMemo(
    () => completedTypes.filter((t) => t.includes("quiz") || t.includes("quest")).length,
    [completedTypes],
  );
  const sessionCount = useMemo(
    () => completedTypes.filter((t) => t === "agent_message").length || 0,
    [completedTypes],
  );

  const displayName = userName ?? "Arena";
  const displayAddress = account?.address
    ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
    : "—";

  return (
    <div className="flex flex-col gap-6 pt-4 pb-6">
      {/* Header */}
      <header className="flex items-center gap-2">
        <Link
          to="/v2/hub"
          aria-label="Geri"
          className="-ml-2 h-10 w-10 flex items-center justify-center text-arena-text-secondary hover:text-arena-text-primary"
        >
          <BackIcon />
        </Link>
        <h1 className="flex-1 text-xl font-semibold text-arena-text-primary tracking-tight">
          Profil
        </h1>
      </header>

      {/* Identity */}
      <section className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-md bg-arena-bg-elevated border-2 border-arena-teal/60 flex items-center justify-center shrink-0">
          <span className="font-mono text-xl font-bold text-arena-teal" aria-hidden>
            &gt;_
          </span>
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="text-[26px] leading-tight font-bold text-arena-text-primary tracking-tight">
            {displayName}
          </div>
          <div className="flex items-center gap-3">
            <ChipPill color={progress.dotColor}>{progress.title}</ChipPill>
            <span className="font-mono text-[10px] text-arena-text-secondary truncate">
              {displayAddress}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <XPProgressStrip
              current={progress.currentLevelXP}
              total={progress.nextLevelXP}
              className="flex-1"
            />
            <span className="font-mono text-[10px] text-arena-text-tertiary whitespace-nowrap tabular-nums">
              {progress.currentLevelXP} / {progress.nextLevelXP} XP
            </span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section>
        <SectionTitle>İstatistikler</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="XP"      value={totalXP.toLocaleString("tr-TR")} color="teal"   />
          <StatCard label="Streak"  value={`${streak.count} gün`}           color="amber"  />
          <StatCard label="Quest"   value={String(questCount)}              color="purple" />
          <StatCard label="Session" value={String(sessionCount)}            color="blue"   />
        </div>
      </section>

      {/* Past events */}
      <section>
        <SectionTitle>Katıldığın etkinlikler</SectionTitle>
        <ul className="flex flex-col">
          {MOCK_PAST_EVENTS.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </ul>
      </section>

      {/* NFT collection */}
      <section>
        <SectionTitle>NFT koleksiyonu</SectionTitle>
        <div className="grid grid-cols-4 gap-3">
          {MOCK_NFTS.map((n) => (
            <NFTCell key={n.id} nft={n} />
          ))}
        </div>
      </section>

      {/* Settings */}
      <section>
        <SectionTitle>Ayarlar</SectionTitle>
        <div className="flex items-center justify-between p-4 rounded-md border border-arena-text-muted/25 bg-arena-bg-surface">
          <span className="text-sm text-arena-text-primary">Core Wallet</span>
          <span className="font-mono text-[11px] font-bold text-arena-teal">
            {account ? "Bağlı" : "Bağlı değil"}
          </span>
        </div>
      </section>
    </div>
  );
}
