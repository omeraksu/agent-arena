/**
 * NextEventCard — "SONRAKİ ETKİNLİK" card.
 *
 * Figma: MemberHub/Home alt kısım.
 * [teal dot] Etkinlik başlığı · Konum · Tarih   [Kayıt ol →]
 * Gap item 10.
 *
 * event: Hardcoded Faz 2'de (geleceğin etkinlikleri data layer'ı Faz 6).
 */
import { cn } from "../../lib/cn";

export interface NextEvent {
  title: string;
  location: string;
  dateISO: string;
  rsvpHref?: string;
  accent: "teal" | "blue" | "purple" | "amber" | "red";
}

export interface NextEventCardProps {
  event: NextEvent | null;
}

const DOT_CLASSES: Record<NextEvent["accent"], string> = {
  teal:   "bg-arena-teal",
  blue:   "bg-arena-blue",
  purple: "bg-arena-purple",
  amber:  "bg-arena-amber",
  red:    "bg-arena-red",
};

const CTA_CLASSES: Record<NextEvent["accent"], string> = {
  teal:   "text-arena-teal hover:text-arena-teal/80",
  blue:   "text-arena-blue hover:text-arena-blue/80",
  purple: "text-arena-purple hover:text-arena-purple/80",
  amber:  "text-arena-amber hover:text-arena-amber/80",
  red:    "text-arena-red hover:text-arena-red/80",
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function NextEventCard({ event }: NextEventCardProps) {
  if (!event) return null;

  return (
    <article className="flex items-center gap-3 p-4 rounded-md border border-arena-text-muted/30 bg-arena-bg-surface">
      <span
        className={cn("h-2 w-2 rounded-full shrink-0", DOT_CLASSES[event.accent])}
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-arena-text-primary">
          {event.title} <span className="font-normal text-arena-text-secondary">· {event.location}</span>
        </div>
        <div className="font-mono text-[10px] text-arena-text-tertiary mt-0.5">
          {formatDate(event.dateISO)}
        </div>
      </div>
      {event.rsvpHref && (
        <a
          href={event.rsvpHref}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "font-mono text-xs font-bold whitespace-nowrap transition-colors",
            CTA_CLASSES[event.accent],
          )}
        >
          Kayıt ol →
        </a>
      )}
    </article>
  );
}

NextEventCard.displayName = "NextEventCard";
