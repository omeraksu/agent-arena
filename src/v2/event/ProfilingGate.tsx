/**
 * ProfilingGate — 2-question identity scan.
 *
 * Figma: ProfilingGate (85:2)
 *
 * Cevaplar `EventFlowProvider.profile` state'ine yazılır ve AgentReveal'da
 * agent persona matching için kullanılır. Her soru opsiyonel — "atla" butonu
 * ile doğrudan AgentReveal'a geçilebilir.
 */
import { useState } from "react";
import { Button, SkipGate } from "../../components/ui";
import { useEventFlow } from "./EventFlowProvider";
import { cn } from "../../lib/cn";

// ─── Answer options ─────────────────────────────────────────────────────

type Experience = "beginner" | "intermediate" | "advanced";
type Intent = "learn" | "build" | "explore";

interface Option<T extends string> {
  value: T;
  icon: string;
  label: string;
  color: "teal" | "blue" | "amber" | "red" | "purple";
}

const EXPERIENCE_OPTIONS: Option<Experience>[] = [
  { value: "beginner",     icon: "🌱", label: "> yeniyim",         color: "teal"  },
  { value: "intermediate", icon: "🔧", label: "> biraz_biliyorum", color: "blue"  },
  { value: "advanced",     icon: "⚡",  label: "> builder/dev",     color: "amber" },
];

const INTENT_OPTIONS: Option<Intent>[] = [
  { value: "explore", icon: "🎮", label: "> keşfet/oyna", color: "red"   },
  { value: "learn",   icon: "📘", label: "> öğren",       color: "blue"  },
  { value: "build",   icon: "🛠", label: "> inşa_et",     color: "amber" },
];

// ─── Color classes ──────────────────────────────────────────────────────

const OPTION_BASE: Record<Option<string>["color"], string> = {
  teal:   "border-arena-teal/40   hover:border-arena-teal/80   hover:bg-arena-teal/10",
  blue:   "border-arena-blue/40   hover:border-arena-blue/80   hover:bg-arena-blue/10",
  amber:  "border-arena-amber/40  hover:border-arena-amber/80  hover:bg-arena-amber/10",
  red:    "border-arena-red/40    hover:border-arena-red/80    hover:bg-arena-red/10",
  purple: "border-arena-purple/40 hover:border-arena-purple/80 hover:bg-arena-purple/10",
};

const OPTION_SELECTED: Record<Option<string>["color"], string> = {
  teal:   "border-arena-teal   bg-arena-teal/15   text-arena-teal",
  blue:   "border-arena-blue   bg-arena-blue/15   text-arena-blue",
  amber:  "border-arena-amber  bg-arena-amber/15  text-arena-amber",
  red:    "border-arena-red    bg-arena-red/15    text-arena-red",
  purple: "border-arena-purple bg-arena-purple/15 text-arena-purple",
};

// ─── Option row ─────────────────────────────────────────────────────────

function OptionRow<T extends string>({
  option,
  selected,
  onSelect,
}: {
  option: Option<T>;
  selected: boolean;
  onSelect: (v: T) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.value)}
      aria-pressed={selected}
      className={cn(
        "flex items-center gap-3 w-full p-3 rounded-sm border transition-all",
        selected
          ? OPTION_SELECTED[option.color]
          : cn("bg-arena-bg-surface/40 text-arena-text-secondary", OPTION_BASE[option.color]),
      )}
    >
      <span className="text-lg shrink-0" aria-hidden>{option.icon}</span>
      <span className="font-mono text-[12px] font-bold flex-1 text-left">
        {option.label}
      </span>
      {selected && (
        <span className="font-mono text-sm" aria-hidden>✓</span>
      )}
    </button>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────

export default function ProfilingGate() {
  const { setProfile, goNext } = useEventFlow();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [intent, setIntent] = useState<Intent | null>(null);

  const canContinue = experience !== null && intent !== null;

  const handleContinue = () => {
    if (!canContinue) return;
    setProfile({ experience, intent });
    goNext();
  };

  const handleSkip = () => {
    goNext();
  };

  return (
    <div className="flex flex-col gap-8 pt-12 pb-8">
      {/* Terminal header */}
      <section className="font-mono text-[11px] leading-relaxed text-arena-purple px-2">
        <div className="font-bold">[PROFILING]</div>
        <div className="mt-1 text-arena-text-secondary">&gt; identity_scan...</div>
      </section>

      {/* Title */}
      <section className="px-2">
        <h1 className="text-[52px] leading-[0.9] font-black tracking-tight text-arena-text-primary">
          SENİ
          <br />
          TANIYALIM.
        </h1>
        <div className="font-mono text-[11px] text-arena-teal mt-3">
          &gt; 2 soru · 10 saniye
        </div>
      </section>

      {/* Question 1 */}
      <section className="flex flex-col gap-3 mx-2">
        <div className="font-mono text-[10px] font-bold tracking-wider text-arena-purple">
          // SORU_01
        </div>
        <h2 className="text-[17px] font-semibold text-arena-text-primary">
          Blockchain seviyeni seç:
        </h2>
        <div className="flex flex-col gap-2">
          {EXPERIENCE_OPTIONS.map((opt) => (
            <OptionRow
              key={opt.value}
              option={opt}
              selected={experience === opt.value}
              onSelect={setExperience}
            />
          ))}
        </div>
      </section>

      {/* Question 2 */}
      <section className="flex flex-col gap-3 mx-2">
        <div className="font-mono text-[10px] font-bold tracking-wider text-arena-purple">
          // SORU_02
        </div>
        <h2 className="text-[17px] font-semibold text-arena-text-primary">
          Bugünkü amacın ne?
        </h2>
        <div className="flex flex-col gap-2">
          {INTENT_OPTIONS.map((opt) => (
            <OptionRow
              key={opt.value}
              option={opt}
              selected={intent === opt.value}
              onSelect={setIntent}
            />
          ))}
        </div>
      </section>

      {/* Skip link */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleSkip}
          className="font-mono text-[10px] text-arena-text-tertiary hover:text-arena-text-secondary underline underline-offset-4"
        >
          &gt; atla, direkt_aria
        </button>
      </div>

      {/* Continue CTA */}
      <section className="mx-2">
        <Button
          variant="terminal"
          size="lg"
          fullWidth
          onClick={handleContinue}
          disabled={!canContinue}
        >
          ARIA&apos;YA GİT ↗
        </Button>
      </section>

      <SkipGate onSkip={handleSkip} label="[dev] skip → reveal" />
    </div>
  );
}
