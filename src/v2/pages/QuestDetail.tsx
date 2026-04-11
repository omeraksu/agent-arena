/**
 * QuestDetail — Single quest steps + resources + CTA.
 *
 * Figma: QuestDetail (77:83)
 *
 * Route: `/v2/quest/:id`
 *
 * Yapı:
 *   1. Header: [← back] "Quest" + "+X XP" pill
 *   2. Title (Inter Black) + description
 *   3. İLERLEME — progress bar + "X/Y tamamlandı"
 *   4. GÖREVLER — step list
 *   5. KAYNAKLAR — external link list
 *   6. CTA button (sticky bottom)
 */
import { useNavigate, useParams, Link } from "react-router-dom";
import { cn } from "../../lib/cn";
import { ChipPill, Button, EmptyState } from "../../components/ui";
import { getQuestById } from "../lib/quest-catalog";
import type { QuestStep } from "../lib/quest-catalog";
import type { ChipColor } from "../../components/ui";

// ─── Icons ──────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

// ─── Step row ───────────────────────────────────────────────────────────

const ACCENT_ACTIVE_RING: Record<ChipColor, string> = {
  teal:   "border-arena-teal   text-arena-teal",
  blue:   "border-arena-blue   text-arena-blue",
  purple: "border-arena-purple text-arena-purple",
  pink:   "border-arena-red    text-arena-red",
  amber:  "border-arena-amber  text-arena-amber",
  red:    "border-arena-red    text-arena-red",
};

const ACCENT_ACTIVE_BG: Record<ChipColor, string> = {
  teal:   "bg-arena-teal/8   border-arena-teal/60",
  blue:   "bg-arena-blue/8   border-arena-blue/60",
  purple: "bg-arena-purple/8 border-arena-purple/60",
  pink:   "bg-arena-red/8    border-arena-red/60",
  amber:  "bg-arena-amber/8  border-arena-amber/60",
  red:    "bg-arena-red/8    border-arena-red/60",
};

function StepRow({ step, index, accent }: { step: QuestStep; index: number; accent: ChipColor }) {
  const isDone = step.status === "done";
  const isActive = step.status === "active";
  const isLocked = step.status === "locked";

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-3 rounded-md border",
        isActive ? cn("border-2", ACCENT_ACTIVE_BG[accent]) : "border-arena-text-muted/25 bg-arena-bg-surface",
        (isDone || isLocked) && "opacity-55",
      )}
    >
      {/* Step circle */}
      <span
        className={cn(
          "inline-flex items-center justify-center h-6 w-6 rounded-full border-2 shrink-0",
          isDone && "border-arena-teal bg-arena-teal/15 text-arena-teal",
          isActive && ACCENT_ACTIVE_RING[accent],
          isLocked && "border-arena-text-muted/50 text-arena-text-tertiary",
        )}
        aria-hidden
      >
        {isDone ? (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 8 7 12 13 4" />
          </svg>
        ) : (
          <span className="font-mono text-[10px] font-bold">{index}</span>
        )}
      </span>

      <div className="flex-1 min-w-0">
        <div className={cn(
          "text-sm leading-snug",
          isLocked ? "text-arena-text-tertiary" : "text-arena-text-primary",
        )}>
          {step.title}
        </div>
        {step.description && (
          <div className="text-xs text-arena-text-tertiary mt-1">
            {step.description}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────

export default function QuestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const quest = id ? getQuestById(id) : undefined;

  if (!quest) {
    return (
      <div className="flex flex-col gap-6 pt-4 pb-6">
        <header className="flex items-center gap-2">
          <Link
            to="/v2/quest"
            aria-label="Geri"
            className="-ml-2 h-10 w-10 flex items-center justify-center text-arena-text-secondary hover:text-arena-text-primary"
          >
            <BackIcon />
          </Link>
          <h1 className="flex-1 text-xl font-semibold text-arena-text-primary">Quest</h1>
        </header>
        <EmptyState
          title="Quest bulunamadı"
          description="Bu görev artık mevcut değil veya link hatalı."
          action={<Button variant="ghost" onClick={() => navigate("/v2/quest")}>Görevlere dön</Button>}
        />
      </div>
    );
  }

  const totalSteps = quest.steps.length;
  const doneSteps = quest.steps.filter((s) => s.status === "done").length;
  const progressRatio = totalSteps > 0 ? doneSteps / totalSteps : 0;

  return (
    <div className="flex flex-col gap-6 pt-4 pb-24">
      {/* Header */}
      <header className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          aria-label="Geri"
          className="-ml-2 h-10 w-10 flex items-center justify-center text-arena-text-secondary hover:text-arena-text-primary"
        >
          <BackIcon />
        </button>
        <h1 className="flex-1 text-xl font-semibold text-arena-text-primary tracking-tight">
          Quest
        </h1>
        <ChipPill color={quest.accent} dot={false}>
          +{quest.xp} XP
        </ChipPill>
      </header>

      {/* Title + description */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[30px] leading-tight font-bold text-arena-text-primary tracking-tight">
          {quest.title}
        </h2>
        <p className="text-sm text-arena-text-secondary leading-relaxed">
          {quest.description}
        </p>
      </section>

      {/* Progress */}
      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-arena-text-tertiary mb-2">
          İlerleme
        </div>
        <div className="h-1.5 w-full rounded-full bg-arena-bg-elevated overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500 ease-out",
              quest.accent === "teal"   && "bg-arena-teal",
              quest.accent === "blue"   && "bg-arena-blue",
              quest.accent === "purple" && "bg-arena-purple",
              quest.accent === "amber"  && "bg-arena-amber",
              (quest.accent === "red" || quest.accent === "pink") && "bg-arena-red",
            )}
            style={{ width: `${progressRatio * 100}%` }}
          />
        </div>
        <div className="mt-2 font-mono text-[11px] text-arena-text-tertiary">
          <span className={cn(
            "font-bold",
            quest.accent === "teal"   && "text-arena-teal",
            quest.accent === "blue"   && "text-arena-blue",
            quest.accent === "purple" && "text-arena-purple",
            quest.accent === "amber"  && "text-arena-amber",
            (quest.accent === "red" || quest.accent === "pink") && "text-arena-red",
          )}>
            {doneSteps} / {totalSteps}
          </span>{" "}
          tamamlandı
        </div>
      </section>

      {/* Steps */}
      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-arena-text-tertiary mb-3">
          Görevler
        </div>
        <div className="flex flex-col gap-2">
          {quest.steps.map((step, i) => (
            <StepRow
              key={step.id}
              step={step}
              index={i + 1}
              accent={quest.accent}
            />
          ))}
        </div>
      </section>

      {/* Resources */}
      {quest.resources.length > 0 && (
        <section>
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-arena-text-tertiary mb-3">
            Kaynaklar
          </div>
          <div className="flex flex-col gap-2">
            {quest.resources.map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-3 p-3 rounded-md border border-arena-text-muted/25 bg-arena-bg-surface hover:bg-arena-bg-elevated transition-colors"
              >
                <span className={cn(
                  "h-2 w-2 rounded-full shrink-0 mt-1.5",
                  r.dotColor === "teal"   && "bg-arena-teal",
                  r.dotColor === "blue"   && "bg-arena-blue",
                  r.dotColor === "purple" && "bg-arena-purple",
                  r.dotColor === "amber"  && "bg-arena-amber",
                  (r.dotColor === "red" || r.dotColor === "pink") && "bg-arena-red",
                )} aria-hidden />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-arena-text-primary">{r.label}</div>
                  <div className="font-mono text-[10px] text-arena-text-tertiary mt-0.5 truncate">
                    {r.url.replace(/^https?:\/\//, "")}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      {quest.cta && (
        <div className="mt-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate(quest.cta!.href)}
          >
            {quest.cta.label}
          </Button>
        </div>
      )}
    </div>
  );
}
