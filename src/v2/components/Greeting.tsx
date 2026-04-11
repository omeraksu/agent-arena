/**
 * Greeting — Hub ana sayfası selamlama bloğu.
 *
 * Figma: MemberHub/Home üst kısım.
 * "Merhaba, {isim}." + Explorer chip + "X / Y XP" + thin progress bar.
 *
 * userName: ArenaContext'ten gelir. Yoksa "Arena" fallback.
 */
import { ChipPill } from "../../components/ui";
import { XPProgressStrip } from "./XPProgressStrip";
import type { LevelProgress } from "../lib/xp";

export interface GreetingProps {
  userName: string | null;
  progress: LevelProgress;
}

export function Greeting({ userName, progress }: GreetingProps) {
  const displayName = userName ?? "Arena";

  return (
    <section className="flex flex-col gap-3 pt-6">
      <h1 className="text-[30px] leading-tight font-bold text-arena-text-primary tracking-tight">
        Merhaba, <span className="text-arena-text-primary">{displayName}.</span>
      </h1>

      <div className="flex items-center gap-3">
        <ChipPill color={progress.dotColor}>{progress.title}</ChipPill>
        <span className="font-mono text-xs text-arena-text-secondary tabular-nums">
          {progress.currentLevelXP} / {progress.nextLevelXP} XP
        </span>
      </div>

      <XPProgressStrip
        current={progress.currentLevelXP}
        total={progress.nextLevelXP}
        className="mt-1"
      />
    </section>
  );
}

Greeting.displayName = "Greeting";
