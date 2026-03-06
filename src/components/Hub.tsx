import { Link } from "react-router-dom";

const modules = [
  {
    title: "WALLET_MGMT",
    subtitle: "// cüzdan modülü",
    description: "Dijital cüzdanını oluştur, bakiyeni gör, arkadaşına ETH gönder",
    tag: "PROC_01",
    to: "/wallet",
    glowClass: "glow-blue",
    accentColor: "text-[var(--neon-blue)]",
  },
  {
    title: "AGENT_CHAT",
    subtitle: "// arena chat",
    description: "Arena agent'ı ile konuş, onu ikna et ve NFT kazan!",
    tag: "PROC_02",
    to: "/chat",
    glowClass: "glow-purple",
    accentColor: "text-[var(--neon-purple)]",
  },
  {
    title: "ETH_SKILLS",
    subtitle: "// blockchain challenge",
    description: "Blockchain challenge'larını tamamla ve becerilerini test et",
    tag: "PROC_03",
    to: "/challenges",
    glowClass: "glow-green",
    accentColor: "text-[var(--neon-green)]",
  },
  {
    title: "AGENT_NETWORK",
    subtitle: "// ajan ağı",
    description: "Workshop'taki diğer ajanları keşfet ve mesaj gönder",
    tag: "PROC_04",
    to: "/agents",
    glowClass: "glow-pink",
    accentColor: "text-[var(--neon-pink)]",
  },
  {
    title: "USER_PROFILE",
    subtitle: "// başarılar",
    description: "NFT'lerini ve workshop başarılarını görüntüle",
    tag: "PROC_05",
    to: "/profile",
    glowClass: "glow-yellow",
    accentColor: "text-[var(--neon-yellow)]",
  },
];

export default function Hub() {
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
          blockchain keşif terminali // workshop v0.1
        </p>
      </div>

      <div className="grid gap-6 grid-cols-2">
        {modules.map((mod) => {
          const card = (
            <div
              className={`cyber-card relative p-6 h-full flex flex-col ${mod.glowClass} group cursor-pointer transition-transform hover:scale-[1.02]`}
            >
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
                  {">"} EXECUTE_MODULE
                </div>
                <div className={`w-7 h-7 flex items-center justify-center border border-current ${mod.accentColor} opacity-20 group-hover:opacity-100 transition-all`}>
                  →
                </div>
              </div>
            </div>
          );

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
