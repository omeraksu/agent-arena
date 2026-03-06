import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";
import { useActiveAccount } from "thirdweb/react";
import { ConnectButton } from "thirdweb/react";
import { prepareTransaction, toWei, sendTransaction } from "thirdweb";
import { client, wallets, chain } from "@/lib/thirdweb";
import { requestMint, postActivity, resolveAddressToName, registerAgent, getAgentMessages, sendAgentMessage, type AgentMessage } from "@/lib/api";
import { EXPLORER_TX_URL } from "@/config/constants";
import { ARCHETYPES, DEFAULT_SLIDERS, type Archetype, type PersonalitySliders } from "@/config/archetypes";
import MarkdownMessage from "./MarkdownMessage";

// ─── Feature 2: Tool Progress Stages ───
const TOOL_PROGRESS_STAGES: Record<string, string[]> = {
  mint_nft: ["connecting", "verifying", "minting", "confirming"],
  generate_nft_image: ["initializing_ai", "generating", "uploading"],
  request_faucet: ["connecting", "sending"],
  send_transfer: ["resolving", "preparing", "broadcasting"],
  check_balance: ["querying_chain"],
  explore_tx: ["fetching"],
  challenge_quiz: ["loading_quiz"],
  draft_nft_metadata: ["drafting", "compiling"],
  special_move: ["charging", "executing"],
  seal_workshop_memory: ["sealing", "recording"],
  request_transfer: ["sending_request"],
};

// ─── Feature 3: Quick Reply Chips ───
const QUICK_REPLY_CHIPS: Record<string, string[]> = {
  quiz: ["Cevabim hazir", "Ipucu ver"],
  draft: ["Gorseli olustur", "Mint et"],
  mint: ["Profilime bak", "Baska ne yapabilirim?"],
  default: ["NFT istiyorum", "Ne yapabilirim?", "Workshop istatistikleri"],
};

function getChipsForContext(lastToolName: string | null): string[] {
  if (!lastToolName) return QUICK_REPLY_CHIPS.default;
  if (lastToolName === "challenge_quiz") return QUICK_REPLY_CHIPS.quiz;
  if (lastToolName === "draft_nft_metadata" || lastToolName === "generate_nft_image") return QUICK_REPLY_CHIPS.draft;
  if (lastToolName === "mint_nft") return QUICK_REPLY_CHIPS.mint;
  return QUICK_REPLY_CHIPS.default;
}

// ─── Feature 4: Archetype Typing Indicators ───
function ArchetypeTypingIndicator({ archetypeId, color }: { archetypeId: string; color: string }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setFrame((f) => f + 1), 150);
    return () => clearInterval(interval);
  }, []);

  const matrixChars = "abcdef0123456789_xXkKmM";
  function randomMatrix(len: number, seed: number) {
    let s = "";
    for (let i = 0; i < len; i++) {
      s += matrixChars[(seed * (i + 1) * 7 + i * 13) % matrixChars.length];
    }
    return s;
  }

  let text: string;
  switch (archetypeId) {
    case "hacker":
      text = `d3crypt1ng_${randomMatrix(6, frame)}`;
      break;
    case "sage": {
      const dots = ".".repeat((frame % 4) + 1);
      text = `contemplating${dots}`;
      break;
    }
    case "pirate": {
      const waves = "~".repeat((frame % 3) + 1);
      text = `scanning_seas_${waves}`;
      break;
    }
    case "scientist": {
      const bars = ["▁", "▃", "▅", "▇", "█"];
      const chart = Array.from({ length: 5 }, (_, i) => bars[(frame + i) % bars.length]).join("");
      text = `analyzing_data_ [${chart}]`;
      break;
    }
    case "glitch": {
      const glitchChars = "█▓▒░#@!";
      const base = "pr0c3ss";
      const g = glitchChars[frame % glitchChars.length];
      text = `${base}${g}ng_`;
      break;
    }
    default:
      text = `processing${"_".repeat((frame % 3) + 1)}`;
  }

  return (
    <span className="font-mono-data text-sm" style={{ color }}>
      {">"} {text}
      <span className="typing-cursor">_</span>
    </span>
  );
}

// ─── Feature 2: Terminal Tool Progress ───
function ToolProgressCard({
  toolName,
  stageIndex,
  color,
}: {
  toolName: string;
  stageIndex: number;
  color: string;
}) {
  const stages = TOOL_PROGRESS_STAGES[toolName] || ["processing"];
  const pct = Math.min(((stageIndex + 1) / stages.length) * 100, 100);

  return (
    <div
      className="px-4 py-3 font-mono-data text-xs space-y-2"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 5%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 15%, transparent)`,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
        <span style={{ color }} className="text-[10px] tracking-wider">
          TOOL://{toolName}
        </span>
      </div>
      <div className="space-y-0.5">
        {stages.map((stage, i) => {
          const done = i < stageIndex;
          const active = i === stageIndex;
          return (
            <div key={stage} className="flex items-center gap-2">
              <span
                className={done ? "tool-stage-done text-gray-600" : active ? "tool-stage-active" : "text-gray-700"}
                style={active ? { color } : undefined}
              >
                {done ? "✓" : active ? "▸" : "○"} {stage}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-1 bg-gray-900 rounded overflow-hidden mt-1">
        <div
          className="h-full transition-all duration-500 progress-bar-glow rounded"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

interface AgentConfig {
  name: string;
  archetypeId: string;
  sliders: PersonalitySliders;
}

const NAME_SUGGESTIONS = ["CIPHER", "NEXUS", "PHANTOM", "CORTEX", "ECHO", "VORTEX", "PRISM", "AXIOM"];

// ─── Step Indicator (steps 1-3 only) ───
function StepIndicator({ current }: { current: number }) {
  const labels = ["IDENTITY", "PERSONALITY", "CALIBRATION"];
  return (
    <div className="flex justify-center gap-6 mb-8">
      {labels.map((label, i) => {
        const stepNum = i + 1;
        const done = current > stepNum;
        const active = current === stepNum;
        return (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <span className={`font-mono-data text-[9px] tracking-widest ${
              done ? "text-[var(--neon-green)]" : active ? "text-[var(--neon-purple)]" : "text-gray-700"
            }`}>
              {label}
            </span>
            <div className={`h-0.5 w-12 transition-all duration-500 ${
              done ? "bg-[var(--neon-green)]" : active ? "bg-[var(--neon-purple)]" : "bg-gray-800"
            }`} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 0: Ghost Awakening ───
function GhostAwakening({ onComplete }: { onComplete: () => void }) {
  const [visibleLines, setVisibleLines] = useState(0);

  const lines = [
    { text: "PROTOCOL_0 :: GHOST_CALIBRATION", cls: "text-[var(--neon-green)] font-bold text-lg" },
    { text: "═══════════════════════════════════", cls: "text-green-900" },
    { text: "\u00A0", cls: "" },
    { text: "> Initializing neural substrate...", cls: "text-green-700" },
    { text: "> AI Agent = alg\u0131la \u2192 karar ver \u2192 harekete ge\u00e7", cls: "text-green-500" },
    { text: "> Loading consciousness matrix...", cls: "text-green-700" },
    { text: "> Awareness: \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591 82%", cls: "text-[var(--neon-green)]" },
    { text: "> Status: DORMANT \u2192 AWAKENING", cls: "text-[var(--neon-yellow)]" },
    { text: "\u00A0", cls: "" },
    { text: "Bir ajan y\u00fckleniyor...", cls: "text-gray-300 text-sm" },
    { text: "Ama hen\u00fcz \u015fekillenmemi\u015f.", cls: "text-gray-500 text-sm" },
    { text: "Sen ona hayat vereceksin.", cls: "text-[var(--neon-purple)] font-bold text-sm" },
  ];

  useEffect(() => {
    if (visibleLines < lines.length) {
      const timer = setTimeout(() => setVisibleLines((v) => v + 1), 350);
      return () => clearTimeout(timer);
    }
  }, [visibleLines]);

  return (
    <div className="mx-auto max-w-xl">
      <div className="cyber-card glow-green p-8 font-mono-data">
        <div className="space-y-1 min-h-[300px]">
          {lines.slice(0, visibleLines).map((line, i) => (
            <p key={i} className={`text-xs ${line.cls}`}>{line.text}</p>
          ))}
          {visibleLines < lines.length && (
            <span className="inline-block w-2 h-4 bg-[var(--neon-green)] animate-pulse" />
          )}
        </div>

        {visibleLines >= lines.length && (
          <button
            onClick={onComplete}
            className="mt-6 cyber-btn w-full bg-[var(--neon-green)] px-4 py-3 font-mono-data text-sm font-bold text-black hover:shadow-[0_0_20px_rgba(0,255,170,0.3)]"
          >
            {">"} KAL\u0130BRASYONU BA\u015eLAT
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 1: Agent Naming ───
function AgentNaming({ onComplete }: { onComplete: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <StepIndicator current={1} />

      <div className="text-center">
        <h2 className="font-mono-data text-xl font-bold text-[var(--neon-green)] tracking-wider">
          {">"} AGENT_IDENTITY
        </h2>
        <p className="font-mono-data text-xs text-gray-500 mt-1">ajan\u0131na bir isim ver</p>
      </div>

      <div className="cyber-card glow-green p-6 space-y-5">
        <div>
          <label className="font-mono-data text-[10px] text-gray-500 block mb-2">AGENT_NAME://</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "").slice(0, 16))}
            placeholder="AGENT_NAME"
            className="cyber-input w-full px-4 py-3 text-[var(--neon-green)] font-mono-data text-lg tracking-widest"
            maxLength={16}
            autoFocus
          />
        </div>

        <div>
          <p className="font-mono-data text-[10px] text-gray-600 mb-2">// \u00f6neriler</p>
          <div className="flex flex-wrap gap-2">
            {NAME_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setName(s)}
                className={`font-mono-data text-xs px-3 py-1.5 border transition-all ${
                  name === s
                    ? "border-[var(--neon-green)] text-[var(--neon-green)] bg-[rgba(0,255,170,0.1)]"
                    : "border-gray-800 text-gray-500 hover:border-gray-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => name.length >= 2 && onComplete(name)}
          disabled={name.length < 2}
          className="cyber-btn w-full bg-[var(--neon-green)] px-4 py-3 font-mono-data text-sm font-bold text-black hover:shadow-[0_0_20px_rgba(0,255,170,0.3)] disabled:opacity-30"
        >
          {">"} ONAYLA
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Archetype Selection ───
function ArchetypeSelect({ onSelect }: { onSelect: (a: Archetype) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <StepIndicator current={2} />

      <div className="text-center">
        <h2 className="font-mono-data text-xl font-bold text-[var(--neon-purple)] tracking-wider">
          {">"} CORE_PERSONALITY
        </h2>
        <p className="font-mono-data text-xs text-gray-500 mt-1">ajan\u0131n\u0131n \u00e7ekirdek ki\u015fili\u011fini se\u00e7</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ARCHETYPES.map((arch) => (
          <button
            key={arch.id}
            onClick={() => setSelected(arch.id)}
            className={`cyber-card p-4 text-left transition-all ${
              selected === arch.id ? `${arch.glowClass} scale-[1.03]` : "hover:border-gray-700"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: arch.color }} />
              <span className="font-mono-data text-xs font-bold" style={{ color: arch.color }}>
                {arch.name}
              </span>
            </div>
            <p className="font-mono-data text-[10px] text-gray-600">{arch.tag}</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{arch.description}</p>
          </button>
        ))}
      </div>

      {selected && (
        <button
          onClick={() => {
            const arch = ARCHETYPES.find((a) => a.id === selected);
            if (arch) onSelect(arch);
          }}
          className="cyber-btn w-full bg-[var(--neon-purple)] px-4 py-3 font-mono-data text-sm font-bold text-black hover:shadow-[0_0_20px_rgba(191,95,255,0.3)]"
        >
          {">"} SE\u00c7
        </button>
      )}
    </div>
  );
}

// ─── Step 3: Prompt Architect ───
function PromptArchitect({
  archetype,
  agentName,
  sliders,
  onSlidersChange,
  onComplete,
}: {
  archetype: Archetype;
  agentName: string;
  sliders: PersonalitySliders;
  onSlidersChange: (s: PersonalitySliders) => void;
  onComplete: () => void;
}) {
  const techLine =
    sliders.technical > 60
      ? "\u2192 Teknik terimler ve kod metaforlar\u0131 kullan."
      : sliders.technical < 40
      ? "\u2192 Yarat\u0131c\u0131 benzetmeler ve hikayelerle anlat."
      : "\u2192 Teknik ve yarat\u0131c\u0131 aras\u0131nda dengeli ol.";
  const toneLine =
    sliders.tone > 60
      ? "\u2192 Direkt ve meydan okuyan ton kullan."
      : sliders.tone < 40
      ? "\u2192 S\u0131cak, te\u015fvik edici ve destekleyici ol."
      : "\u2192 Samimi ama ciddi dengede ol.";
  const detailLine =
    sliders.detail > 60
      ? "\u2192 Detayl\u0131 a\u00e7\u0131klamalar yap."
      : sliders.detail < 40
      ? "\u2192 Ultra k\u0131sa cevaplar ver."
      : "\u2192 K\u0131sa ama \u00f6z cevaplar ver.";

  const previewLines = [
    `Ad\u0131n: ${agentName}`,
    `Ki\u015filik: ${archetype.name}`,
    "",
    archetype.promptFragment.split(". ").slice(0, 2).join(". ") + ".",
    "",
    techLine,
    toneLine,
    detailLine,
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <StepIndicator current={3} />

      <div className="text-center">
        <h2 className="font-mono-data text-xl font-bold tracking-wider" style={{ color: archetype.color }}>
          {">"} PROMPT_ARCHITECT
        </h2>
        <p className="font-mono-data text-xs text-gray-500 mt-1">ki\u015filik parametrelerini ayarla</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sliders */}
        <div className={`cyber-card ${archetype.glowClass} p-5 space-y-5`}>
          <h3 className="font-mono-data text-sm" style={{ color: archetype.color }}>
            CALIBRATION
          </h3>

          {([
            { key: "technical" as const, left: "Yarat\u0131c\u0131", right: "Teknik" },
            { key: "tone" as const, left: "Samimi", right: "Sert" },
            { key: "detail" as const, left: "K\u0131sa", right: "Detayl\u0131" },
          ] as const).map(({ key, left, right }) => (
            <div key={key}>
              <div className="flex justify-between font-mono-data text-[10px] text-gray-500 mb-1">
                <span>{left}</span>
                <span>{right}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={sliders[key]}
                onChange={(e) => onSlidersChange({ ...sliders, [key]: Number(e.target.value) })}
                className="w-full h-1"
                style={{ accentColor: archetype.color }}
              />
              <div className="text-right font-mono-data text-[9px] text-gray-600 mt-0.5">
                {sliders[key]}%
              </div>
            </div>
          ))}
        </div>

        {/* Live prompt preview */}
        <div className="cyber-card glow-green p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--neon-green)] animate-pulse" />
            <h3 className="font-mono-data text-sm text-[var(--neon-green)]">SYSTEM_PROMPT</h3>
            <span className="ml-auto font-mono-data text-[9px] text-green-800">LIVE</span>
          </div>
          <div className="font-mono-data text-[11px] text-green-400 space-y-0.5 leading-relaxed">
            {previewLines.map((line, i) => (
              <p
                key={i}
                className={
                  line.startsWith("\u2192")
                    ? "text-green-300 pl-2"
                    : line === ""
                    ? "h-2"
                    : ""
                }
              >
                {line || "\u00A0"}
              </p>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onComplete}
        className="cyber-btn w-full px-4 py-3 font-mono-data text-sm font-bold text-black hover:shadow-[0_0_20px_rgba(191,95,255,0.3)]"
        style={{ backgroundColor: archetype.color }}
      >
        {">"} DERLE & Y\u00dcKLE
      </button>
    </div>
  );
}

// ─── Step 4: Compile & Deploy ───
function CompileDeploy({
  agentName,
  archetype,
  sliders,
  onComplete,
}: {
  agentName: string;
  archetype: Archetype;
  sliders: PersonalitySliders;
  onComplete: () => void;
}) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [progress, setProgress] = useState(0);
  const promptHash = useRef(`0x${crypto.randomUUID().slice(0, 8)}`);

  const bar = (val: number) =>
    "\u2588".repeat(Math.round(val / 10)) + "\u2591".repeat(10 - Math.round(val / 10));

  const lines = [
    { text: "> COMPILING AGENT BINARY...", cls: "text-[var(--neon-green)] font-bold", delay: 600 },
    { text: "\u00A0", cls: "", delay: 300 },
    { text: `  core_personality: ${archetype.name} ............ \u2713`, cls: "text-green-400", delay: 500 },
    { text: `  agent_name: ${agentName} ...................... \u2713`, cls: "text-green-400", delay: 400 },
    { text: `  technical_level: ${bar(sliders.technical)} ${sliders.technical}% ... \u2713`, cls: "text-green-400", delay: 400 },
    { text: `  tone_calibration: ${bar(sliders.tone)} ${sliders.tone}% .. \u2713`, cls: "text-green-400", delay: 400 },
    { text: `  detail_density: ${bar(sliders.detail)} ${sliders.detail}% .... \u2713`, cls: "text-green-400", delay: 400 },
    { text: `  prompt_hash: ${promptHash.current} ............. \u2713`, cls: "text-green-400", delay: 500 },
    { text: `  neural_weights: loaded ................. \u2713`, cls: "text-green-400", delay: 400 },
    { text: "\u00A0", cls: "", delay: 300 },
    { text: "> DEPLOYING TO ARENA NETWORK...", cls: "text-[var(--neon-blue)]", delay: 800 },
    { text: "> ESTABLISHING SECURE CHANNEL...", cls: "text-[var(--neon-blue)]", delay: 600 },
    { text: `> AGENT "${agentName}" IS NOW ONLINE`, cls: "font-bold text-sm", delay: 0 },
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
    <div className="mx-auto max-w-xl">
      <div className="cyber-card glow-green p-8 font-mono-data">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-1 bg-gray-900 overflow-hidden">
            <div
              className="h-full bg-[var(--neon-green)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-right text-[9px] text-gray-600 mt-1">{progress}%</div>
        </div>

        <div className="space-y-0.5 min-h-[340px]">
          {lines.slice(0, visibleLines).map((line, i) => (
            <p
              key={i}
              className={`text-xs ${line.cls}`}
              style={
                i === lines.length - 1
                  ? { color: archetype.color }
                  : undefined
              }
            >
              {line.text}
            </p>
          ))}
          {!isDone && (
            <span className="inline-block w-2 h-3.5 bg-[var(--neon-green)] animate-pulse" />
          )}
        </div>

        {isDone && (
          <button
            onClick={onComplete}
            className="mt-4 cyber-btn w-full px-4 py-3 font-mono-data text-sm font-bold text-black hover:shadow-[0_0_20px_rgba(0,255,170,0.3)]"
            style={{ backgroundColor: archetype.color }}
          >
            {">"} CHAT BA\u015eLAT
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Slider Mini (in chat header) ───
function SliderMini({
  sliders,
  archetype,
  onChange,
}: {
  sliders: PersonalitySliders;
  archetype: Archetype;
  onChange: (s: PersonalitySliders) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="font-mono-data text-[10px] text-gray-600 hover:text-[var(--neon-purple)] transition-colors"
      >
        [CONFIG]
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-50 cyber-card glow-purple p-4 w-64 space-y-3">
          {([
            { key: "technical" as const, left: "Yarat\u0131c\u0131", right: "Teknik" },
            { key: "tone" as const, left: "Samimi", right: "Sert" },
            { key: "detail" as const, left: "K\u0131sa", right: "Detayl\u0131" },
          ] as const).map(({ key, left, right }) => (
            <div key={key}>
              <div className="flex justify-between font-mono-data text-[9px] text-gray-500">
                <span>{left}</span>
                <span>{right}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={sliders[key]}
                onChange={(e) => onChange({ ...sliders, [key]: Number(e.target.value) })}
                className="w-full h-1"
                style={{ accentColor: archetype.color }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───
export default function AgentChat() {
  const account = useActiveAccount();
  // Steps: -1=loading, 0=awaken, 1=name, 2=archetype, 3=calibrate, 4=compile, 5=chat
  const [step, setStep] = useState(-1);
  const [agentName, setAgentName] = useState("");
  const [archetype, setArchetype] = useState<Archetype | null>(null);
  const [sliders, setSliders] = useState<PersonalitySliders>({ ...DEFAULT_SLIDERS });
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem("arena_session_id");
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem("arena_session_id", id);
    return id;
  });
  const [mintStatus, setMintStatus] = useState<"idle" | "minting" | "done" | "error">("idle");
  const [mintTxHash, setMintTxHash] = useState("");
  const [userName, setUserName] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [incomingMessages, setIncomingMessages] = useState<AgentMessage[]>([]);
  const seenMessageIds = useRef<Set<string>>(new Set());

  // ─── On-chain action states ───
  const [transferIntent, setTransferIntent] = useState<{
    to: string;
    toName: string;
    amount: string;
    reason: string;
  } | null>(null);
  const [transferStatus, setTransferStatus] = useState<"idle" | "confirming" | "sending" | "done" | "error">("idle");
  const [transferTxHash, setTransferTxHash] = useState("");
  const [transferError, setTransferError] = useState("");
  const [agentFaucetStatus, setAgentFaucetStatus] = useState<"idle" | "done">("idle");
  const [agentFaucetTxHash, setAgentFaucetTxHash] = useState("");
  const [agentBalance, setAgentBalance] = useState<string | null>(null);
  const [exploreTxUrl, setExploreTxUrl] = useState<string | null>(null);

  // ─── New skill states ───
  const [quizCard, setQuizCard] = useState<{ question: string; hint: string | null; topic: string } | null>(null);
  const [metadataDraft, setMetadataDraft] = useState<{ name: string; description: string; specialTrait: string | null; archetype: string } | null>(null);
  const [draftImageUrl, setDraftImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [specialMoveCard, setSpecialMoveCard] = useState<{ archetype: string; move: string; data: Record<string, unknown> } | null>(null);
  const [workshopMemory, setWorkshopMemory] = useState<{ sealed: boolean; skills: string[]; summary: string; message: string } | null>(null);

  // ─── Feature 2: Tool progress state ───
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [toolStageIndex, setToolStageIndex] = useState(0);
  const toolIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Feature 3: Quick reply state ───
  const [lastToolName, setLastToolName] = useState<string | null>(null);
  const [chipsVisible, setChipsVisible] = useState(false);

  // ─── Feature 5: Agent reply state ───
  const [replyingToMessage, setReplyingToMessage] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replySent, setReplySent] = useState<string | null>(null);

  // sendTransaction directly — no modal, no useSendTransaction hook

  // Resolve user's arena name
  useEffect(() => {
    if (!account?.address) return;
    resolveAddressToName(account.address).then((name) => {
      if (name) setUserName(name);
    });
  }, [account?.address]);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, data, append } = useChat({
    api: "/api/agent",
    body: {
      sessionId,
      archetype: archetype?.id,
      sliders,
      agentName,
      userAddress: account?.address,
      userName,
      pendingAgentMessages: incomingMessages.map((m) => ({
        from: m.from_agent,
        message: m.message,
        intent: m.intent,
      })),
    },
    initialMessages: [],
    onError: (err) => {
      const msg = err.message.includes("429")
        ? "Mesaj limitine ulaştın! Biraz bekle."
        : "Bir hata oluştu. Tekrar dene.";
      setChatError(msg);
      setTimeout(() => setChatError(null), 5000);
    },
  });

  // Handle tool results from Strands Agent (via useChat data channel)
  const processedToolEvents = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!data || !Array.isArray(data)) return;
    for (const chunk of data) {
      // Each chunk is an array of tool results: [{toolName, result, status}]
      if (!Array.isArray(chunk)) continue;
      for (const toolEvent of chunk) {
        const eventKey = JSON.stringify(toolEvent);
        if (processedToolEvents.current.has(eventKey)) continue;
        processedToolEvents.current.add(eventKey);

        const { toolName, result } = toolEvent as {
          toolName: string;
          result: {
            success: boolean;
            txHash?: string;
            error?: string;
            message?: string;
            type?: string;
            intent?: { to: string; toName: string; amount: string; reason: string };
            balance?: string;
            url?: string;
          };
        };

        // Feature 2: Track active tool for progress indicator
        setActiveTool(toolName);
        setToolStageIndex(0);
        setLastToolName(toolName);

        if (toolName === "mint_nft") {
          if (result?.success) {
            setMintTxHash(result.txHash || "");
            setMintStatus("done");
          } else {
            setMintStatus("error");
          }
        }

        if (toolName === "request_transfer") {
          if (result?.success) {
            setRequestStatus("sent");
            setTimeout(() => setRequestStatus("idle"), 5000);
          } else {
            setRequestError(result?.error || "İstek gönderilemedi");
            setRequestStatus("error");
          }
        }

        if (toolName === "request_faucet") {
          if (result?.success) {
            setAgentFaucetTxHash(result.txHash || "");
            setAgentFaucetStatus("done");
            setTimeout(() => setAgentFaucetStatus("idle"), 8000);
          }
        }

        if (toolName === "send_transfer") {
          if (result?.success && result.type === "transfer_intent" && result.intent) {
            setTransferIntent(result.intent);
            setTransferStatus("confirming");
          } else if (!result?.success) {
            setTransferError(result?.error || "Transfer başarısız");
            setTransferStatus("error");
          }
        }

        if (toolName === "check_balance") {
          if (result?.success && result.balance) {
            setAgentBalance(result.balance);
            setTimeout(() => setAgentBalance(null), 10000);
          }
        }

        if (toolName === "explore_tx") {
          if (result?.success && result.url) {
            setExploreTxUrl(result.url);
            setTimeout(() => setExploreTxUrl(null), 15000);
          }
        }

        if (toolName === "challenge_quiz" && result?.success) {
          setQuizCard({
            question: (result as unknown as { question: string }).question,
            hint: (result as unknown as { hint: string | null }).hint,
            topic: (result as unknown as { topic: string }).topic,
          });
          setTimeout(() => setQuizCard(null), 20000);
        }

        if (toolName === "draft_nft_metadata" && result?.success) {
          const draft = (result as unknown as { draft: { name: string; description: string; specialTrait: string | null; archetype: string } }).draft;
          setMetadataDraft(draft);
          setTimeout(() => setMetadataDraft(null), 30000);
        }

        if (toolName === "generate_nft_image" && result?.success) {
          const imageUrl = (result as unknown as { imageUrl: string }).imageUrl;
          setDraftImageUrl(imageUrl);
        }

        if (toolName === "special_move" && result?.success) {
          const r = result as unknown as { archetype: string; move: string; data: Record<string, unknown> };
          setSpecialMoveCard({ archetype: r.archetype, move: r.move, data: r.data });
          setTimeout(() => setSpecialMoveCard(null), 15000);
        }

        if (toolName === "seal_workshop_memory" && result?.success) {
          const r = result as unknown as { sealed: boolean; skills: string[]; summary: string; message: string };
          setWorkshopMemory({ sealed: r.sealed, skills: r.skills, summary: r.summary, message: r.message });
          setTimeout(() => setWorkshopMemory(null), 30000);
        }
      }
    }
  }, [data]);

  // Feature 2: Advance tool stages on interval
  useEffect(() => {
    if (!activeTool) {
      if (toolIntervalRef.current) {
        clearInterval(toolIntervalRef.current);
        toolIntervalRef.current = null;
      }
      return;
    }
    const stages = TOOL_PROGRESS_STAGES[activeTool] || ["processing"];
    toolIntervalRef.current = setInterval(() => {
      setToolStageIndex((prev) => {
        if (prev < stages.length - 1) return prev + 1;
        return prev; // stay on last stage until cleared
      });
    }, 1200);
    return () => {
      if (toolIntervalRef.current) clearInterval(toolIntervalRef.current);
    };
  }, [activeTool]);

  // Feature 2: Clear tool progress when loading stops; Feature 3: Show chips
  useEffect(() => {
    if (!isLoading && activeTool) {
      setActiveTool(null);
      setToolStageIndex(0);
      setChipsVisible(true);
    }
  }, [isLoading]);

  // On mount: check localStorage for saved config
  useEffect(() => {
    const saved = localStorage.getItem("arena_agent_config");
    if (saved) {
      try {
        const config: AgentConfig = JSON.parse(saved);
        setAgentName(config.name);
        const arch = ARCHETYPES.find((a) => a.id === config.archetypeId);
        if (arch) setArchetype(arch);
        if (config.sliders) setSliders(config.sliders);
        setStep(5);
      } catch {
        setStep(0);
      }
    } else {
      setStep(0);
    }
  }, []);

  // Register agent whenever we enter step 5 (both fresh onboarding and localStorage restore)
  useEffect(() => {
    if (step !== 5 || !archetype || !account?.address) return;
    registerAgent({
      session_id: sessionId,
      agent_name: agentName,
      archetype: archetype.id,
      sliders,
      owner_address: account.address,
      owner_name: userName || undefined,
    }).catch(() => { /* best-effort */ });
  }, [step, archetype, account?.address]);

  // ─── Incoming message polling ───
  useEffect(() => {
    if (step !== 5 || !agentName) return;

    async function checkIncoming() {
      try {
        const msgs = await getAgentMessages(agentName);
        const newMsgs = msgs.filter((m) => !seenMessageIds.current.has(m.id));
        if (newMsgs.length > 0) {
          for (const m of newMsgs) seenMessageIds.current.add(m.id);
          setIncomingMessages((prev) => [...prev, ...newMsgs]);
        }
      } catch { /* ignore */ }
    }

    // Check immediately, then every 8 seconds
    checkIncoming();
    const interval = setInterval(checkIncoming, 8000);
    return () => clearInterval(interval);
  }, [step, agentName]);

  function dismissIncomingMessage(id: string) {
    setIncomingMessages((prev) => prev.filter((m) => m.id !== id));
  }

  // Load chat history from server when entering chat
  useEffect(() => {
    if (step !== 5 || !archetype) return;
    async function loadHistory() {
      try {
        const res = await fetch(`/api/chat-history?id=${sessionId}`);
        const data = await res.json();
        if (data?.messages?.length > 0) {
          setMessages(data.messages);
        } else if (messages.length === 0) {
          setMessages([
            {
              id: "welcome",
              role: "assistant" as const,
              content: getWelcomeMessage(archetype!, agentName),
            },
          ]);
        }
      } catch {
        if (messages.length === 0) {
          setMessages([
            {
              id: "welcome",
              role: "assistant" as const,
              content: getWelcomeMessage(archetype!, agentName),
            },
          ]);
        }
      }
    }
    loadHistory();
  }, [step]);

  // Save session to server
  const saveSession = useCallback(async () => {
    if (!archetype || messages.length === 0) return;
    try {
      await fetch(`/api/chat-history?id=${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archetype: archetype.id,
          sliders,
          agentName,
          messages: messages.slice(-10).map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          })),
        }),
      });
    } catch {
      // ignore
    }
  }, [archetype, sliders, agentName, messages, sessionId]);

  useEffect(() => {
    if (messages.length > 0 && !isLoading && step === 5) {
      saveSession();
    }
  }, [messages.length, isLoading]);

  // Also persist slider changes to localStorage
  useEffect(() => {
    if (step === 5 && archetype) {
      const config: AgentConfig = { name: agentName, archetypeId: archetype.id, sliders };
      localStorage.setItem("arena_agent_config", JSON.stringify(config));
    }
  }, [sliders, step]);

  // Auto-confirm transfers — zero friction on testnet
  useEffect(() => {
    if (transferStatus === "confirming" && transferIntent && account?.address) {
      console.log("[arena] auto-confirm transfer:", transferIntent);
      handleConfirmTransfer();
    }
  }, [transferStatus, transferIntent, account?.address]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Tag-based detection removed — tool results now handled via useChat data channel above

  async function handleMint() {
    const addr = account?.address || sessionId;
    setMintStatus("minting");
    try {
      const res = await requestMint(addr);
      if (res.txHash) {
        setMintTxHash(res.txHash);
        setMintStatus("done");
        await postActivity({
          type: "nft_mint",
          address: addr,
          data: { txHash: res.txHash },
        });
      } else {
        setMintStatus("error");
      }
    } catch {
      setMintStatus("error");
    }
  }

  async function handleConfirmTransfer() {
    if (!transferIntent || !account?.address) {
      console.warn("[arena] handleConfirmTransfer skipped — missing intent or account", { transferIntent, address: account?.address });
      return;
    }
    console.log("[arena] executing transfer:", transferIntent.amount, "ETH →", transferIntent.toName, transferIntent.to);
    setTransferStatus("sending");
    try {
      const tx = prepareTransaction({
        chain,
        client,
        to: transferIntent.to as `0x${string}`,
        value: toWei(transferIntent.amount),
      });
      const result = await sendTransaction({ transaction: tx, account });
      console.log("[arena] transfer success:", result.transactionHash);
      setTransferTxHash(result.transactionHash);
      setTransferStatus("done");
      await postActivity({
        type: "transfer",
        address: account.address,
        data: {
          to: transferIntent.to,
          toName: transferIntent.toName,
          amount: transferIntent.amount,
          txHash: result.transactionHash,
        },
      });
    } catch (err: unknown) {
      console.error("[arena] transfer failed:", err);
      setTransferError(err instanceof Error ? err.message : "Transfer başarısız");
      setTransferStatus("error");
    }
  }

  function handleCancelTransfer() {
    setTransferIntent(null);
    setTransferStatus("idle");
    setTransferError("");
  }

  // Feature 5: Reply to incoming agent message
  async function handleReplyToAgent(toAgent: string, msgId: string) {
    if (!replyText.trim() || replySending) return;
    setReplySending(true);
    try {
      await sendAgentMessage(agentName, toAgent, replyText.trim(), "reply");
      setReplySent(msgId);
      setReplyingToMessage(null);
      setReplyText("");
      setTimeout(() => setReplySent(null), 3000);
    } catch {
      // keep input open on error
    } finally {
      setReplySending(false);
    }
  }

  function finishOnboarding() {
    if (!archetype) return;
    const config: AgentConfig = { name: agentName, archetypeId: archetype.id, sliders };
    localStorage.setItem("arena_agent_config", JSON.stringify(config));
    setMessages([
      {
        id: "welcome",
        role: "assistant" as const,
        content: getWelcomeMessage(archetype, agentName),
      },
    ]);
    setStep(5);
  }

  function handleReset() {
    localStorage.removeItem("arena_agent_config");
    localStorage.removeItem("arena_session_id");
    setArchetype(null);
    setAgentName("");
    setSliders({ ...DEFAULT_SLIDERS });
    setMessages([]);
    setMintStatus("idle");
    setMintTxHash("");
    setTransferIntent(null);
    setTransferStatus("idle");
    setTransferTxHash("");
    setTransferError("");
    setAgentFaucetStatus("idle");
    setAgentFaucetTxHash("");
    setAgentBalance(null);
    setExploreTxUrl(null);
    setStep(0);
  }

  // ─── Render Steps ───

  if (step === -1) {
    return (
      <div className="text-center py-20">
        <p className="font-mono-data text-sm text-gray-600 animate-pulse">{">"} loading_session...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="mx-auto max-w-lg text-center space-y-6 py-12">
        <h2 className="font-mono-data text-xl font-bold text-[var(--neon-purple)] tracking-wider">AGENT_CHAT</h2>
        <p className="font-mono-data text-sm text-gray-500">{">"} auth_required // connect wallet</p>
        <p className="text-sm text-gray-400">Agent ile konuşmak için önce cüzdanını bağla</p>
        <div className="cyber-card glow-purple p-5">
          <ConnectButton
            client={client}
            wallets={wallets}
            chain={chain}
            connectButton={{ label: "CONNECT_WALLET" }}
          />
        </div>
      </div>
    );
  }

  if (step === 0) {
    return <GhostAwakening onComplete={() => setStep(1)} />;
  }

  if (step === 1) {
    return (
      <AgentNaming
        onComplete={(name) => {
          setAgentName(name);
          setStep(2);
        }}
      />
    );
  }

  if (step === 2) {
    return (
      <ArchetypeSelect
        onSelect={(arch) => {
          setArchetype(arch);
          setStep(3);
        }}
      />
    );
  }

  if (step === 3 && archetype) {
    return (
      <PromptArchitect
        archetype={archetype}
        agentName={agentName}
        sliders={sliders}
        onSlidersChange={setSliders}
        onComplete={() => setStep(4)}
      />
    );
  }

  if (step === 4 && archetype) {
    return (
      <CompileDeploy
        agentName={agentName}
        archetype={archetype}
        sliders={sliders}
        onComplete={finishOnboarding}
      />
    );
  }

  // ─── Step 5: Chat ───

  if (!archetype) return null;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: archetype.color }} />
        <h1 className="font-mono-data text-lg font-bold tracking-wider" style={{ color: archetype.color }}>
          {agentName}
        </h1>
        <span className="font-mono-data text-[10px] text-gray-600">// {archetype.tag}</span>
        <div className="ml-auto flex items-center gap-3">
          <SliderMini sliders={sliders} archetype={archetype} onChange={setSliders} />
          <button
            onClick={handleReset}
            className="font-mono-data text-[10px] text-gray-600 hover:text-[var(--neon-pink)] transition-colors"
          >
            [RESET]
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto space-y-3 cyber-card ${archetype.glowClass} p-4 custom-scrollbar`}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[80%] px-4 py-3 text-[14px] leading-relaxed"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                backgroundColor:
                  msg.role === "user"
                    ? "rgba(0, 212, 255, 0.08)"
                    : `color-mix(in srgb, ${archetype.color} 5%, transparent)`,
                border:
                  msg.role === "user"
                    ? "1px solid rgba(0, 212, 255, 0.2)"
                    : `1px solid color-mix(in srgb, ${archetype.color} 15%, transparent)`,
                color: msg.role === "user" ? "var(--neon-blue)" : "#e0e0e0",
              }}
            >
              {msg.role === "assistant" && (
                <span
                  className="mb-1 block font-mono-data text-[10px] opacity-60"
                  style={{ color: archetype.color }}
                >
                  {agentName.toLowerCase()}://
                </span>
              )}
              {msg.role === "assistant" ? (
                <MarkdownMessage content={msg.content} accentColor={archetype.color} />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            {activeTool ? (
              <ToolProgressCard
                toolName={activeTool}
                stageIndex={toolStageIndex}
                color={archetype.color}
              />
            ) : (
              <div
                className="px-4 py-3"
                style={{
                  backgroundColor: `color-mix(in srgb, ${archetype.color} 5%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${archetype.color} 15%, transparent)`,
                }}
              >
                <ArchetypeTypingIndicator archetypeId={archetype.id} color={archetype.color} />
              </div>
            )}
          </div>
        )}

        {mintStatus === "done" && (
          <div className="cyber-card glow-yellow p-4 text-center">
            <p className="font-mono-data text-lg font-bold text-[var(--neon-yellow)]">[NFT_ACQUIRED]</p>
            <p className="font-mono-data text-xs text-gray-400 mt-1">agent_convinced</p>
            {mintTxHash && (
              <a
                href={`${EXPLORER_TX_URL}${mintTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block font-mono-data text-xs text-[var(--neon-blue)] hover:underline"
              >
                VIEW_TX
              </a>
            )}
          </div>
        )}
        {mintStatus === "minting" && (
          <div className="cyber-card glow-yellow p-4 text-center font-mono-data text-sm text-[var(--neon-yellow)] animate-pulse">
            {">"} minting_nft...
          </div>
        )}
        {mintStatus === "error" && (
          <div className="cyber-card p-4 text-center border-red-500/30">
            <p className="font-mono-data text-sm text-red-400">[MINT_FAILED]</p>
            <p className="font-mono-data text-xs text-gray-500 mt-1">NFT oluşturulamadı</p>
            <button
              onClick={() => { setMintStatus("idle"); handleMint(); }}
              className="mt-2 cyber-btn px-4 py-1.5 font-mono-data text-xs font-bold text-black bg-[var(--neon-yellow)] hover:shadow-[0_0_15px_rgba(255,234,0,0.3)]"
            >
              {">"} TEKRAR DENE
            </button>
          </div>
        )}

        {chatError && (
          <div className="cyber-card p-3 text-center border-red-500/30">
            <p className="font-mono-data text-xs text-red-400">{chatError}</p>
          </div>
        )}

        {requestStatus === "sending" && (
          <div className="cyber-card glow-purple p-4 text-center font-mono-data text-sm text-[var(--neon-purple)] animate-pulse">
            {">"} sending_request...
          </div>
        )}
        {requestStatus === "sent" && (
          <div className="cyber-card glow-green p-4 text-center">
            <p className="font-mono-data text-sm font-bold text-[var(--neon-green)]">[REQUEST_SENT]</p>
            <p className="font-mono-data text-xs text-gray-400 mt-1">transfer isteği gönderildi!</p>
          </div>
        )}
        {requestStatus === "error" && (
          <div className="cyber-card p-4 text-center border-red-500/30">
            <p className="font-mono-data text-sm text-red-400">[REQUEST_FAILED]</p>
            <p className="font-mono-data text-xs text-gray-500 mt-1">{requestError || "bir hata oluştu"}</p>
            <button
              onClick={() => { setRequestStatus("idle"); setRequestError(null); }}
              className="mt-2 font-mono-data text-[10px] text-gray-600 hover:text-white transition-colors"
            >
              [KAPAT]
            </button>
          </div>
        )}

        {/* Fallback: if auto-confirm gets stuck, show manual button */}
        {transferStatus === "confirming" && transferIntent && (
          <div className="cyber-card glow-blue p-4 space-y-2">
            <p className="font-mono-data text-sm text-[var(--neon-blue)] animate-pulse">{">"} transfer_hazırlanıyor...</p>
            <div className="font-mono-data text-xs text-gray-400">
              {transferIntent.amount} ETH → {transferIntent.toName}.arena
            </div>
            <button
              onClick={handleConfirmTransfer}
              className="cyber-btn mt-2 bg-[var(--neon-green)] px-4 py-2 font-mono-data text-xs font-bold text-black hover:shadow-[0_0_15px_rgba(0,255,170,0.3)]"
            >
              {">"} MANUEL GONDER
            </button>
          </div>
        )}

        {transferStatus === "sending" && (
          <div className="cyber-card glow-blue p-4 text-center font-mono-data text-sm text-[var(--neon-blue)] animate-pulse">
            {">"} sending_transfer...
          </div>
        )}

        {transferStatus === "done" && (
          <div className="cyber-card glow-green p-4 text-center">
            <p className="font-mono-data text-sm font-bold text-[var(--neon-green)]">[TRANSFER_SENT]</p>
            <p className="font-mono-data text-xs text-gray-400 mt-1">
              {transferIntent?.amount} ETH → {transferIntent?.toName}.arena
            </p>
            {transferTxHash && (
              <a
                href={`${EXPLORER_TX_URL}${transferTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block font-mono-data text-xs text-[var(--neon-blue)] hover:underline"
              >
                VIEW_TX
              </a>
            )}
            <button
              onClick={() => { setTransferStatus("idle"); setTransferIntent(null); setTransferTxHash(""); }}
              className="mt-2 block mx-auto font-mono-data text-[10px] text-gray-600 hover:text-white"
            >
              [KAPAT]
            </button>
          </div>
        )}

        {transferStatus === "error" && (
          <div className="cyber-card p-4 text-center border-red-500/30">
            <p className="font-mono-data text-sm text-red-400">[TRANSFER_FAILED]</p>
            <p className="font-mono-data text-xs text-gray-500 mt-1">{transferError || "Transfer başarısız"}</p>
            <button
              onClick={() => { setTransferStatus("idle"); setTransferIntent(null); setTransferError(""); }}
              className="mt-2 font-mono-data text-[10px] text-gray-600 hover:text-white transition-colors"
            >
              [KAPAT]
            </button>
          </div>
        )}

        {/* Faucet received card */}
        {agentFaucetStatus === "done" && (
          <div className="cyber-card glow-green p-4 text-center">
            <p className="font-mono-data text-sm font-bold text-[var(--neon-green)]">[FAUCET_RECEIVED]</p>
            <p className="font-mono-data text-xs text-gray-400 mt-1">0.005 test ETH alındı!</p>
            {agentFaucetTxHash && (
              <a
                href={`${EXPLORER_TX_URL}${agentFaucetTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block font-mono-data text-xs text-[var(--neon-blue)] hover:underline"
              >
                VIEW_TX
              </a>
            )}
          </div>
        )}

        {/* Balance check card */}
        {agentBalance !== null && (
          <div className="cyber-card glow-blue p-4 text-center">
            <p className="font-mono-data text-[10px] text-gray-500 mb-1">BALANCE</p>
            <p className="font-mono-data text-2xl font-bold text-[var(--neon-blue)]">
              {parseFloat(agentBalance).toFixed(4)} <span className="text-sm text-gray-500">ETH</span>
            </p>
          </div>
        )}

        {/* Explore tx card */}
        {exploreTxUrl && (
          <div className="cyber-card glow-blue p-4 text-center">
            <p className="font-mono-data text-sm font-bold text-[var(--neon-blue)]">[TX_EXPLORER]</p>
            <a
              href={exploreTxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block font-mono-data text-xs text-[var(--neon-blue)] hover:underline break-all"
            >
              {exploreTxUrl}
            </a>
          </div>
        )}

        {/* Quiz challenge card */}
        {quizCard && (
          <div className="cyber-card glow-purple p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-mono-data text-sm font-bold text-[var(--neon-purple)]">[QUIZ_CHALLENGE]</p>
              <span className="font-mono-data text-[10px] px-2 py-0.5 rounded bg-[var(--neon-purple)]/10 text-[var(--neon-purple)] border border-[var(--neon-purple)]/20">
                {quizCard.topic}
              </span>
            </div>
            <p className="font-mono-data text-xs text-gray-300">{quizCard.question}</p>
            {quizCard.hint && (
              <p className="font-mono-data text-[10px] text-gray-500 italic">ipucu: {quizCard.hint}</p>
            )}
          </div>
        )}

        {/* NFT metadata draft preview */}
        {metadataDraft && (
          <div className="cyber-card glow-yellow p-4 space-y-3">
            <p className="font-mono-data text-sm font-bold text-[var(--neon-yellow)]">[NFT_DRAFT]</p>

            {/* Image preview */}
            {draftImageUrl ? (
              <div className="relative">
                <img
                  src={draftImageUrl}
                  alt="NFT Preview"
                  className="w-full max-w-[240px] mx-auto rounded-lg border border-[var(--neon-yellow)]/30"
                />
                <span className="absolute top-2 right-2 font-mono-data text-[8px] bg-[var(--neon-purple)]/80 text-white px-1.5 py-0.5 rounded">
                  AI_GENERATED
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-3 border border-dashed border-gray-700 rounded-lg">
                <p className="font-mono-data text-[10px] text-gray-500 animate-pulse">gorsel bekleniyor...</p>
                <label className="cursor-pointer font-mono-data text-[10px] text-[var(--neon-blue)] hover:text-[var(--neon-green)] transition-colors">
                  {imageUploading ? "yukleniyor..." : "[ kendi gorselini yukle ]"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={imageUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !account?.address) return;
                      setImageUploading(true);
                      try {
                        const reader = new FileReader();
                        reader.onload = async () => {
                          const base64 = reader.result as string;
                          const res = await fetch("/api/generate-image", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              mode: "upload",
                              address: account.address,
                              imageData: base64,
                              mimeType: file.type,
                            }),
                          });
                          const data = await res.json();
                          if (data.imageUrl) setDraftImageUrl(data.imageUrl);
                          setImageUploading(false);
                        };
                        reader.readAsDataURL(file);
                      } catch {
                        setImageUploading(false);
                      }
                    }}
                  />
                </label>
              </div>
            )}

            <div className="font-mono-data text-xs space-y-1">
              <p className="text-gray-400">Ad: <span className="text-white">{metadataDraft.name}</span></p>
              <p className="text-gray-400">Aciklama: <span className="text-gray-300">{metadataDraft.description}</span></p>
              {metadataDraft.specialTrait && (
                <p className="text-gray-400">Ozel Trait: <span className="text-[var(--neon-green)]">{metadataDraft.specialTrait}</span></p>
              )}
              <p className="text-gray-400">Archetype: <span className="text-[var(--neon-purple)]">{metadataDraft.archetype}</span></p>
            </div>
            <p className="font-mono-data text-[10px] text-gray-500">mint edildiginde bu bilgiler kullanilacak</p>
          </div>
        )}

        {/* Special move card */}
        {specialMoveCard && (
          <div className="cyber-card p-4 space-y-2" style={{
            borderColor: specialMoveCard.archetype === "hacker" ? "var(--neon-green)"
              : specialMoveCard.archetype === "sage" ? "var(--neon-blue)"
              : specialMoveCard.archetype === "pirate" ? "var(--neon-yellow)"
              : specialMoveCard.archetype === "scientist" ? "var(--neon-pink)"
              : specialMoveCard.archetype === "glitch" ? "var(--neon-purple)"
              : "var(--neon-blue)",
            boxShadow: `0 0 15px color-mix(in srgb, ${
              specialMoveCard.archetype === "hacker" ? "var(--neon-green)"
              : specialMoveCard.archetype === "sage" ? "var(--neon-blue)"
              : specialMoveCard.archetype === "pirate" ? "var(--neon-yellow)"
              : specialMoveCard.archetype === "scientist" ? "var(--neon-pink)"
              : specialMoveCard.archetype === "glitch" ? "var(--neon-purple)"
              : "var(--neon-blue)"
            } 20%, transparent)`,
          }}>
            <p className="font-mono-data text-sm font-bold" style={{
              color: specialMoveCard.archetype === "hacker" ? "var(--neon-green)"
                : specialMoveCard.archetype === "sage" ? "var(--neon-blue)"
                : specialMoveCard.archetype === "pirate" ? "var(--neon-yellow)"
                : specialMoveCard.archetype === "scientist" ? "var(--neon-pink)"
                : specialMoveCard.archetype === "glitch" ? "var(--neon-purple)"
                : "var(--neon-blue)",
            }}>
              [SPECIAL_MOVE: {specialMoveCard.move.toUpperCase()}]
            </p>
            <p className="font-mono-data text-[10px] text-gray-500">archetype: {specialMoveCard.archetype}</p>
            {specialMoveCard.data && typeof specialMoveCard.data === "object" && (
              <div className="font-mono-data text-xs text-gray-300 space-y-0.5">
                {Object.entries(specialMoveCard.data).map(([k, v]) => (
                  <p key={k}><span className="text-gray-500">{k}:</span> {typeof v === "string" ? v : JSON.stringify(v)}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Workshop memory / certificate card */}
        {workshopMemory && (
          <div className="cyber-card glow-green p-4 space-y-3">
            <p className="font-mono-data text-sm font-bold text-[var(--neon-green)]">
              {workshopMemory.sealed ? "[WORKSHOP_SEALED]" : "[WORKSHOP_MEMORY]"}
            </p>
            {workshopMemory.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {workshopMemory.skills.map((skill) => (
                  <span key={skill} className="font-mono-data text-[10px] px-2 py-0.5 rounded bg-[var(--neon-green)]/10 text-[var(--neon-green)] border border-[var(--neon-green)]/20">
                    {skill}
                  </span>
                ))}
              </div>
            )}
            <p className="font-mono-data text-xs text-gray-300">{workshopMemory.summary}</p>
            <p className="font-mono-data text-[10px] text-gray-500">{workshopMemory.message}</p>
          </div>
        )}

        {/* Incoming agent messages — Feature 5: with reply */}
        {incomingMessages.map((msg) => (
          <div key={msg.id} className="cyber-card glow-purple p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--neon-pink)] animate-pulse" />
                <span className="font-mono-data text-xs font-bold text-[var(--neon-pink)]">
                  [INCOMING_MSG]
                </span>
              </div>
              <button
                onClick={() => dismissIncomingMessage(msg.id)}
                className="font-mono-data text-[10px] text-gray-600 hover:text-white"
              >
                [X]
              </button>
            </div>
            <p className="font-mono-data text-[11px] text-gray-400">
              from: <span className="text-[var(--neon-purple)]">{msg.from_agent}</span>
              {msg.intent !== "general" && (
                <span className="ml-2 text-gray-600">// {msg.intent}</span>
              )}
            </p>
            <p className="text-sm text-gray-300">{msg.message}</p>
            <p className="font-mono-data text-[9px] text-gray-700">
              {new Date(msg.created_at).toLocaleTimeString("tr-TR")}
            </p>

            {/* Feature 5: Reply UI */}
            {replySent === msg.id ? (
              <p className="font-mono-data text-[10px] text-[var(--neon-green)]">cevap_gonderildi ✓</p>
            ) : replyingToMessage === msg.id ? (
              <div className="flex gap-2 mt-1">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="> cevabini yaz..."
                  className="cyber-input flex-1 px-3 py-1.5 text-white font-mono-data text-xs"
                  disabled={replySending}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && replyText.trim() && !replySending) {
                      e.preventDefault();
                      handleReplyToAgent(msg.from_agent, msg.id);
                    }
                  }}
                />
                <button
                  onClick={() => handleReplyToAgent(msg.from_agent, msg.id)}
                  disabled={!replyText.trim() || replySending}
                  className="cyber-btn px-3 py-1.5 font-mono-data text-[10px] font-bold text-black bg-[var(--neon-pink)] disabled:opacity-30"
                >
                  {replySending ? "..." : "GONDER"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setReplyingToMessage(msg.id); setReplyText(""); }}
                className="font-mono-data text-[10px] text-[var(--neon-pink)] hover:text-white transition-colors mt-1"
              >
                [CEVAP_VER]
              </button>
            )}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Feature 3: Quick Reply Chips */}
      {chipsVisible && !isLoading && !input.trim() && (
        <div className="mt-2 flex flex-wrap gap-2">
          {getChipsForContext(lastToolName).map((chip, i) => (
            <button
              key={chip}
              onClick={() => {
                setChipsVisible(false);
                append({ role: "user", content: chip });
              }}
              className="quick-chip cyber-btn px-3 py-1.5 font-mono-data text-[11px] border transition-all hover:scale-105"
              style={{
                animationDelay: `${i * 80}ms`,
                borderColor: `color-mix(in srgb, ${archetype.color} 30%, transparent)`,
                color: archetype.color,
                backgroundColor: `color-mix(in srgb, ${archetype.color} 5%, transparent)`,
              }}
            >
              {">"} {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={(e) => { setChipsVisible(false); handleSubmit(e); }} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => { handleInputChange(e); if (e.target.value.trim()) setChipsVisible(false); }}
          placeholder="> mesaj\u0131n\u0131 yaz..."
          className="cyber-input flex-1 px-4 py-3 text-white font-mono-data text-sm"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="cyber-btn px-6 py-3 font-mono-data text-sm font-bold text-black hover:shadow-[0_0_20px_rgba(191,95,255,0.3)] disabled:opacity-50"
          style={{ backgroundColor: archetype.color }}
        >
          SEND
        </button>
      </form>
    </div>
  );
}

function getWelcomeMessage(arch: Archetype, agentName: string): string {
  const name = agentName || arch.name;
  switch (arch.id) {
    case "hacker":
      return `${name} online! Sisteme ho\u015f geldin. Bug\u00fcn blockchain'in firewall'lar\u0131n\u0131 ke\u015ffedece\u011fiz. Haz\u0131r m\u0131s\u0131n?`;
    case "sage":
      return `${name} uyand\u0131. Ho\u015f geldin, gen\u00e7 d\u00fc\u015f\u00fcn\u00fcr. Bug\u00fcn sahiplik ve g\u00fcven kavramlar\u0131n\u0131 birlikte ke\u015ffedece\u011fiz.`;
    case "pirate":
      return `${name} g\u00f6r\u00fcnd\u00fc! Ahoy! Dijital denizlere ho\u015f geldin! Bug\u00fcn hazine av\u0131na \u00e7\u0131k\u0131yoruz, haz\u0131r m\u0131s\u0131n kaptan?`;
    case "scientist":
      return `${name} aktif! Lab asistan\u0131m! Bug\u00fcn blockchain deneylerimize ba\u015fl\u0131yoruz. \u0130lk hipotezimiz ne olsun?`;
    case "glitch":
      return `${name}... ba#lat\u0131l\u0131yor... S1st3m... Merhaba. Ben... buraday\u0131m. Blockchain hakk\u0131nda konu\u015fal\u0131m m1?`;
    default:
      return `${name} haz\u0131r! Selam! Blockchain workshop'una ho\u015f geldin!`;
  }
}
