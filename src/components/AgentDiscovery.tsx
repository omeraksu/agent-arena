import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useActiveAccount } from "thirdweb/react";
import { getAgents, sendAgentMessage, collectFragment, getTreasureStatus, redeemFragments, type AgentRecord, type TreasureStatus } from "@/lib/api";
import { getPresenceChannel, trackPresence } from "@/lib/supabase";

const ARCHETYPE_COLORS: Record<string, string> = {
  hacker: "var(--neon-green)",
  sage: "var(--neon-purple)",
  pirate: "var(--neon-yellow)",
  scientist: "var(--neon-blue)",
  glitch: "var(--neon-pink)",
  architect: "var(--neon-orange, #ff8c00)",
};

const ARCHETYPE_NAMES: Record<string, string> = {
  hacker: "NEON HACKER",
  sage: "CYBER SAGE",
  pirate: "DATA KORSAN",
  scientist: "LAB SCIENTIST",
  glitch: "GLITCH AI",
  architect: "CHAIN ARCHITECT",
};

export default function AgentDiscovery() {
  const account = useActiveAccount();
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgTarget, setMsgTarget] = useState<string | null>(null);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [onlineAgents, setOnlineAgents] = useState<Set<string>>(new Set());
  const [treasure, setTreasure] = useState<TreasureStatus | null>(null);
  const [collecting, setCollecting] = useState<string | null>(null);
  const [collectMsg, setCollectMsg] = useState<{ agent: string; text: string; ok: boolean } | null>(null);

  // Presence tracking
  useEffect(() => {
    const channel = getPresenceChannel();
    if (!channel) return;

    const syncPresence = () => {
      const state = channel.presenceState();
      const names = new Set<string>();
      for (const presences of Object.values(state)) {
        for (const p of presences as Array<Record<string, string>>) {
          if (p.agent_name) names.add(p.agent_name);
        }
      }
      setOnlineAgents(names);
    };

    channel.on("presence", { event: "sync" }, syncPresence);
    channel.subscribe();

    // Track own agent if configured
    const myConfig = localStorage.getItem("arena_agent_config");
    if (myConfig) {
      try {
        const parsed = JSON.parse(myConfig);
        if (parsed.name && parsed.archetype) {
          trackPresence(parsed.name, parsed.archetype);
        }
      } catch { /* ignore */ }
    }

    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadAgents();
    const interval = setInterval(loadAgents, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load treasure status
  useEffect(() => {
    if (!account) return;
    getTreasureStatus(account.address).then(setTreasure);
  }, [account]);

  async function loadAgents() {
    const data = await getAgents();
    setAgents(data);
    setLoading(false);
  }

  async function handleCollect(agentName: string) {
    if (!account) return;
    setCollecting(agentName);
    setCollectMsg(null);
    const result = await collectFragment(account.address, agentName);
    setCollecting(null);
    if (result.ok) {
      setCollectMsg({ agent: agentName, text: `Fragment: ${result.fragmentCode}`, ok: true });
      // Refresh treasure status
      getTreasureStatus(account.address).then(setTreasure);
    } else {
      setCollectMsg({ agent: agentName, text: result.error || "Hata", ok: false });
    }
    setTimeout(() => setCollectMsg(null), 4000);
  }

  async function handleRedeem() {
    if (!account || !treasure?.canRedeem) return;
    const result = await redeemFragments(account.address);
    if (result.ok) {
      getTreasureStatus(account.address).then(setTreasure);
    }
  }

  async function handleSend(targetAgent: string) {
    if (!msgText.trim()) return;
    const myAgent = localStorage.getItem("arena_agent_config");
    const myName = myAgent ? JSON.parse(myAgent).name : "ANONYMOUS";

    setSending(true);
    const res = await sendAgentMessage(myName, targetAgent, msgText, "general");
    setSending(false);

    if (res.ok) {
      setSent(targetAgent);
      setMsgText("");
      setMsgTarget(null);
      setTimeout(() => setSent(null), 3000);
    }
  }

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "az önce";
    if (mins < 60) return `${mins}dk önce`;
    return `${Math.floor(mins / 60)}sa önce`;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link to="/" className="font-mono-data text-xs text-gray-600 hover:text-white transition-colors">
          {"<"} HUB
        </Link>
        <h1 className="font-mono-data text-2xl font-bold text-[var(--neon-pink)] tracking-wider">
          AGENT_NETWORK
        </h1>
        <span className="font-mono-data text-[10px] text-gray-600">
          // {agents.length} ajan {onlineAgents.size > 0 && <span className="text-[var(--neon-green)]">({onlineAgents.size} online)</span>}
        </span>
      </div>

      {/* Treasure Hunt Status */}
      {treasure && treasure.count > 0 && (
        <div className="cyber-card p-3 flex items-center gap-3" style={{ borderColor: "rgba(255,215,0,0.2)" }}>
          <span className="text-lg">🗺️</span>
          <div className="flex-1">
            <p className="font-mono-data text-[10px] text-[var(--neon-yellow)] font-bold">
              FRAGMENT HUNT — {treasure.count}/{treasure.needed}
            </p>
            <div className="flex gap-1 mt-1">
              {Array.from({ length: treasure.needed }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i < treasure.count ? "bg-[var(--neon-yellow)]" : "bg-gray-800"
                  }`}
                />
              ))}
            </div>
          </div>
          {treasure.canRedeem && !treasure.hasRedeemed && (
            <button
              onClick={handleRedeem}
              className="cyber-btn px-3 py-1.5 font-mono-data text-[10px] font-bold text-black bg-[var(--neon-yellow)]"
            >
              ODUL AL
            </button>
          )}
          {treasure.hasRedeemed && (
            <span className="font-mono-data text-[10px] text-[var(--neon-green)]">Master Scout!</span>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <p className="font-mono-data text-sm text-gray-600 animate-pulse">
            {">"} scanning_network...
          </p>
        </div>
      ) : agents.length === 0 ? (
        <div className="cyber-card glow-pink p-8 text-center space-y-3">
          <p className="font-mono-data text-lg text-gray-400">
            Henüz hiç ajan yok
          </p>
          <p className="text-sm text-gray-600">
            Bir ajan oluşturmak için Agent Chat'e git!
          </p>
          <Link
            to="/chat"
            className="inline-block cyber-btn bg-[var(--neon-pink)] px-6 py-2 font-mono-data text-sm font-bold text-black mt-2"
          >
            {">"} AJAN OLUŞTUR
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const color =
              ARCHETYPE_COLORS[agent.archetype] || "var(--neon-green)";
            const archName =
              ARCHETYPE_NAMES[agent.archetype] || agent.archetype;

            return (
              <div
                key={agent.agent_name}
                className="cyber-card p-5 space-y-3 transition-transform hover:scale-[1.02]"
                style={{
                  borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${onlineAgents.has(agent.agent_name) ? "animate-pulse" : ""}`}
                    style={{ backgroundColor: onlineAgents.has(agent.agent_name) ? color : "#374151" }}
                    title={onlineAgents.has(agent.agent_name) ? "Online" : "Offline"}
                  />
                  <span
                    className="font-mono-data text-lg font-bold tracking-wider"
                    style={{ color }}
                  >
                    {agent.agent_name}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <p className="font-mono-data text-[10px] text-gray-500">
                    archetype: <span style={{ color }}>{archName}</span>
                  </p>
                  <p className="font-mono-data text-[10px] text-gray-500">
                    owner:{" "}
                    <span className="text-gray-400">
                      {agent.owner_name
                        ? `${agent.owner_name}.arena`
                        : `${agent.owner_address.slice(0, 6)}...${agent.owner_address.slice(-4)}`}
                    </span>
                  </p>
                  <p className="font-mono-data text-[10px] text-gray-600">
                    last_seen: {timeAgo(agent.last_seen)}
                  </p>
                </div>

                {/* Message */}
                {sent === agent.agent_name ? (
                  <div className="font-mono-data text-xs text-[var(--neon-green)] text-center py-2">
                    mesaj gönderildi!
                  </div>
                ) : msgTarget === agent.agent_name ? (
                  <div className="space-y-2">
                    <input
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                      placeholder="mesajını yaz..."
                      className="cyber-input w-full px-3 py-2 font-mono-data text-xs text-white"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSend(agent.agent_name);
                        if (e.key === "Escape") {
                          setMsgTarget(null);
                          setMsgText("");
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSend(agent.agent_name)}
                        disabled={sending || !msgText.trim()}
                        className="flex-1 cyber-btn px-3 py-1.5 font-mono-data text-[10px] font-bold text-black disabled:opacity-30"
                        style={{ backgroundColor: color }}
                      >
                        {sending ? "..." : "GÖNDER"}
                      </button>
                      <button
                        onClick={() => {
                          setMsgTarget(null);
                          setMsgText("");
                        }}
                        className="font-mono-data text-[10px] text-gray-600 hover:text-white px-2"
                      >
                        [X]
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setMsgTarget(agent.agent_name)}
                    className="w-full font-mono-data text-[10px] text-gray-600 hover:text-white transition-colors py-1 border border-gray-800 hover:border-gray-600"
                  >
                    {">"} MESAJ GÖNDER
                  </button>
                )}

                {/* Fragment Collect */}
                {account && agent.owner_address.toLowerCase() !== account.address.toLowerCase() && (
                  collectMsg?.agent === agent.agent_name ? (
                    <div className={`font-mono-data text-[10px] text-center py-1 ${collectMsg.ok ? "text-[var(--neon-yellow)]" : "text-red-400"}`}>
                      {collectMsg.text}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCollect(agent.agent_name)}
                      disabled={collecting === agent.agent_name}
                      className="w-full font-mono-data text-[10px] text-[var(--neon-yellow)] hover:text-white transition-colors py-1 border border-[var(--neon-yellow)]/20 hover:border-[var(--neon-yellow)]/50 disabled:opacity-30"
                    >
                      {collecting === agent.agent_name ? "..." : "🗺️ FRAGMENT TOPLA"}
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
