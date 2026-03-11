import { useState, useEffect, useRef } from "react";
import { ARCHETYPES, type MadLibsPersonality, type Archetype } from "@/config/archetypes";

interface CompileAnimationProps {
  agentName: string;
  archetypeId: string;
  personality: MadLibsPersonality;
  enabledChipCount: number;
  totalChipCount: number;
  onComplete: () => void;
}

export default function CompileAnimation({
  agentName,
  archetypeId,
  personality,
  enabledChipCount,
  totalChipCount,
  onComplete,
}: CompileAnimationProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [progress, setProgress] = useState(0);
  const promptHash = useRef(`0x${crypto.randomUUID().slice(0, 8)}`);
  const archetype = ARCHETYPES.find((a) => a.id === archetypeId) as Archetype;

  const truncate = (s: string, len: number) =>
    s.length > len ? s.slice(0, len) + "..." : s;

  const lines = [
    { text: "> Compiling agent binary...", cls: "text-emerald-400 font-semibold", delay: 600 },
    { text: "\u00A0", cls: "", delay: 300 },
    { text: `  agent_name: ${agentName} ...................... ✓`, cls: "text-emerald-400", delay: 400 },
    ...(personality.speechStyle
      ? [{ text: `  kisilik_cekirdegi: ${truncate(personality.speechStyle, 24)} .............. ✓`, cls: "text-emerald-400", delay: 500 }]
      : []),
    ...(personality.curiosity
      ? [{ text: `  merak_modulu: ${truncate(personality.curiosity, 24)} .................... ✓`, cls: "text-emerald-400", delay: 400 }]
      : []),
    ...(personality.vibe
      ? [{ text: `  tarzi_kalibrasyonu: ${truncate(personality.vibe, 24)} ................... ✓`, cls: "text-emerald-400", delay: 400 }]
      : []),
    { text: `  yetenekler: ${enabledChipCount}/${totalChipCount} yuklendi .................... ✓`, cls: "text-emerald-400", delay: 400 },
    { text: `  prompt_hash: ${promptHash.current} ............. ✓`, cls: "text-emerald-400", delay: 500 },
    { text: `  neural_weights: loaded ................. ✓`, cls: "text-emerald-400", delay: 400 },
    { text: "\u00A0", cls: "", delay: 300 },
    { text: "> Deploying to Arena network...", cls: "text-blue-400", delay: 800 },
    { text: "> Establishing secure channel...", cls: "text-blue-400", delay: 600 },
    { text: `> Agent "${agentName}" is now online`, cls: "font-semibold text-sm", delay: 0 },
  ];

  useEffect(() => {
    if (visibleLines < lines.length) {
      const delay = lines[visibleLines]?.delay || 400;
      const timer = setTimeout(() => {
        setVisibleLines((v) => v + 1);
        setProgress(Math.round(((visibleLines + 1) / lines.length) * 100));
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [visibleLines]);

  const isDone = visibleLines >= lines.length;

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1117]/95 flex items-center justify-center p-4">
      <div className="mx-auto max-w-xl w-full">
        <div className="rounded-xl bg-[#1a1d27] border border-white/10 p-8 font-mono-data">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-right text-[10px] text-gray-500 mt-1">{progress}%</div>
          </div>

          <div className="space-y-0.5 min-h-[340px]">
            {lines.slice(0, visibleLines).map((line, i) => (
              <p
                key={i}
                className={`text-xs ${line.cls}`}
                style={
                  i === lines.length - 1 && archetype
                    ? { color: archetype.color }
                    : undefined
                }
              >
                {line.text}
              </p>
            ))}
            {!isDone && (
              <span className="inline-block w-2 h-3.5 bg-emerald-400 animate-pulse" />
            )}
          </div>

          {isDone && (
            <button
              onClick={onComplete}
              className="mt-4 rounded-md w-full px-4 py-3 text-sm font-semibold text-black hover:brightness-110 transition-all"
              style={{ backgroundColor: archetype?.color || "#34d399" }}
            >
              Chat Başlat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
