import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useActiveAccount } from "thirdweb/react";
import { getUserProgress } from "@/lib/api";

interface ModuleCard {
  title: string;
  subtitle: string;
  description: string;
  tag: string;
  to: string;
  glowClass: string;
  accentColor: string;
  requires?: string; // event type required to unlock
  lockMsg?: string;
}

const modules: ModuleCard[] = [
  {
    title: "WALLET_MGMT",
    subtitle: "// cuzdan modulu",
    description: "Dijital cuzdanini olustur, bakiyeni gor, arkadasina AVAX gonder",
    tag: "PROC_01",
    to: "/wallet",
    glowClass: "glow-blue",
    accentColor: "text-[var(--neon-blue)]",
  },
  {
    title: "AGENT_CHAT",
    subtitle: "// arena chat",
    description: "Arena agent'i ile konus, onu ikna et ve NFT kazan!",
    tag: "PROC_02",
    to: "/chat",
    glowClass: "glow-purple",
    accentColor: "text-[var(--neon-purple)]",
    requires: "wallet_created",
    lockMsg: "Once cuzdanini olustur",
  },
  {
    title: "MEME_ARENA",
    subtitle: "// meme yarismasi",
    description: "Meme yukle, sinif oylasin, kazanan NFT olsun!",
    tag: "PROC_03",
    to: "/meme-arena",
    glowClass: "glow-pink",
    accentColor: "text-[var(--neon-pink)]",
    requires: "wallet_created",
    lockMsg: "Once cuzdanini olustur",
  },
  {
    title: "SIGNAL_PULSE",
    subtitle: "// sinif sinyali",
    description: "Sinifca tikla, mainframe'i kir!",
    tag: "PROC_04",
    to: "/signal-pulse",
    glowClass: "glow-green",
    accentColor: "text-[var(--neon-green)]",
    requires: "wallet_created",
    lockMsg: "Once cuzdanini olustur",
  },
  {
    title: "AGENT_NETWORK",
    subtitle: "// ajan agi",
    description: "Workshop'taki diger ajanlari kesfet ve mesaj gonder",
    tag: "PROC_05",
    to: "/agents",
    glowClass: "glow-purple",
    accentColor: "text-[var(--neon-purple)]",
    requires: "agent_registered",
    lockMsg: "Once agent'ini olustur",
  },
  {
    title: "USER_PROFILE",
    subtitle: "// basarilar",
    description: "NFT'lerini ve workshop basarilarini goruntule",
    tag: "PROC_06",
    to: "/profile",
    glowClass: "glow-yellow",
    accentColor: "text-[var(--neon-yellow)]",
    requires: "wallet_created",
    lockMsg: "Once cuzdanini olustur",
  },
];

const PROGRESS_STEPS = [
  { key: "wallet_created", label: "CUZDAN" },
  { key: "faucet", label: "FAUCET" },
  { key: "agent_registered", label: "AGENT" },
];

export default function Hub() {
  const account = useActiveAccount();
  const [completedTypes, setCompletedTypes] = useState<string[]>([]);

  useEffect(() => {
    if (!account?.address) return;
    let active = true;
    getUserProgress(account.address).then((types) => {
      if (active) setCompletedTypes(types);
    });
    const interval = setInterval(() => {
      getUserProgress(account.address).then((types) => {
        if (active) setCompletedTypes(types);
      });
    }, 5000);
    return () => { active = false; clearInterval(interval); };
  }, [account?.address]);

  const hasType = (type: string) => completedTypes.includes(type);
  const stepsComplete = PROGRESS_STEPS.filter((s) => hasType(s.key)).length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--neon-green)] opacity-20" />
          <h1 className="font-mono-data text-4xl font-black text-[var(--neon-green)] tracking-tighter glitch-hover">
            CORE_HUB
          </h1>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--neon-green)] opacity-20" />
        </div>
        <p className="font-mono-data text-[10px] text-gray-500 text-center uppercase tracking-widest">
          blockchain kesif terminali // workshop v0.1
        </p>
      </div>

      {/* Progress Bar */}
      {account && stepsComplete < PROGRESS_STEPS.length && (
        <div className="mb-8 cyber-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono-data text-[10px] text-[var(--neon-green)] font-bold tracking-wider">
              WORKSHOP_PROGRESS
            </span>
            <span className="font-mono-data text-[10px] text-gray-500">
              {stepsComplete}/{PROGRESS_STEPS.length}
            </span>
          </div>
          <div className="flex gap-2">
            {PROGRESS_STEPS.map((step, i) => {
              const done = hasType(step.key);
              const active = !done && i === stepsComplete;
              return (
                <div key={step.key} className="flex-1">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      done
                        ? "bg-[var(--neon-green)]"
                        : active
                          ? "bg-[var(--neon-purple)] animate-pulse"
                          : "bg-gray-800"
                    }`}
                  />
                  <p className={`font-mono-data text-[8px] mt-1 text-center ${
                    done ? "text-[var(--neon-green)]" : active ? "text-[var(--neon-purple)]" : "text-gray-700"
                  }`}>
                    {done ? "+" : ">"} {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-6 grid-cols-2">
        {modules.map((mod) => {
          const locked = mod.requires ? !hasType(mod.requires) : false;

          const card = (
            <div
              className={`cyber-card relative p-6 h-full flex flex-col ${mod.glowClass} group transition-transform ${
                locked ? "opacity-30 pointer-events-none" : "cursor-pointer hover:scale-[1.02]"
              }`}
            >
              {locked && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <span className="font-mono-data text-[10px] text-gray-400 bg-black/80 px-3 py-1 rounded border border-gray-700">
                    🔒 {mod.lockMsg}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <span className={`font-mono-data text-[10px] ${mod.accentColor} font-bold`}>
                  {mod.tag}
                </span>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-white/20" />
                  <div className="w-1 h-1 bg-white/20" />
                  <div className="w-1 h-1 bg-white/20" />
                </div>
              </div>

              <h2 className={`font-mono-data text-xl font-bold ${mod.accentColor} tracking-tight mb-1`}>
                {mod.title}
              </h2>
              <p className="font-mono-data text-[9px] text-gray-600 mb-3">{mod.subtitle}</p>
              <p className="text-sm text-gray-400 leading-relaxed flex-1">{mod.description}</p>

              <div className="mt-5 flex items-center justify-between">
                <div className={`font-mono-data text-[10px] ${mod.accentColor} opacity-50 group-hover:opacity-100 transition-opacity`}>
                  {">"} {locked ? "LOCKED" : "EXECUTE_MODULE"}
                </div>
                <div className={`w-7 h-7 flex items-center justify-center border border-current ${mod.accentColor} opacity-20 group-hover:opacity-100 transition-all`}>
                  {locked ? "🔒" : "→"}
                </div>
              </div>
            </div>
          );

          if (locked) {
            return <div key={mod.title}>{card}</div>;
          }

          return (
            <Link key={mod.title} to={mod.to}>
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
