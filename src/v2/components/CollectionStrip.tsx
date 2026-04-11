/**
 * CollectionStrip — Horizontal NFT thumbnail scroll.
 *
 * Figma: MemberHub/Home "KOLEKSİYON" section.
 * Thumbnail'lar yan yana, sonunda "+N more" pill. Snap-scroll, fade edges.
 * Gap item 9.
 */
import { Link } from "react-router-dom";
import { EmptyState } from "../../components/ui";
import { cn } from "../../lib/cn";

export interface CollectionItem {
  id: string;
  glyph: string; // placeholder symbol — Faz 6'da image URL
  accent: "teal" | "blue" | "purple" | "amber" | "red";
  href?: string;
}

export interface CollectionStripProps {
  items: CollectionItem[];
  /** Scroll'da gösterilen max thumbnail sayısı (sonraki "+N more") */
  visibleCount?: number;
}

const ACCENT_BORDER: Record<CollectionItem["accent"], string> = {
  teal:   "border-arena-teal/60",
  blue:   "border-arena-blue/60",
  purple: "border-arena-purple/60",
  amber:  "border-arena-amber/60",
  red:    "border-arena-red/60",
};

const ACCENT_TEXT: Record<CollectionItem["accent"], string> = {
  teal:   "text-arena-teal",
  blue:   "text-arena-blue",
  purple: "text-arena-purple",
  amber:  "text-arena-amber",
  red:    "text-arena-red",
};

function Thumbnail({ item }: { item: CollectionItem }) {
  const content = (
    <div
      className={cn(
        "h-16 w-16 shrink-0 flex items-center justify-center rounded-md",
        "bg-arena-bg-elevated border",
        ACCENT_BORDER[item.accent],
        "transition-transform duration-200 ease-out hover:scale-[1.04]",
      )}
    >
      <span
        className={cn("font-mono text-xl font-bold", ACCENT_TEXT[item.accent])}
        aria-hidden
      >
        {item.glyph}
      </span>
    </div>
  );

  return item.href ? <Link to={item.href}>{content}</Link> : content;
}

export function CollectionStrip({ items, visibleCount = 4 }: CollectionStripProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Henüz NFT yok"
        description="Agent'ı ikna et, ilk NFT'ni kazan."
      />
    );
  }

  const visible = items.slice(0, visibleCount);
  const remaining = items.length - visibleCount;

  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {visible.map((item) => (
        <div key={item.id} className="snap-start">
          <Thumbnail item={item} />
        </div>
      ))}
      {remaining > 0 && (
        <div className="snap-start h-16 w-16 shrink-0 flex items-center justify-center rounded-md bg-arena-bg-elevated border border-arena-text-muted/30">
          <span className="font-mono text-xs font-bold text-arena-text-secondary">
            +{remaining}
          </span>
        </div>
      )}
    </div>
  );
}

CollectionStrip.displayName = "CollectionStrip";
