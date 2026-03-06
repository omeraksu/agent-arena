import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAgents, sendAgentMessage, type AgentRecord } from "@/lib/api";

const ARCHETYPE_COLORS: Record<string, string> = {
  hacker: "var(--neon-green)",
  sage: "var(--neon-purple)",
  pirate: "var(--neon-yellow)",
  scientist: "var(--neon-blue)",
  glitch: "var(--neon-pink)",
};

const ARCHETYPE_NAMES: Record<string, string> = {
  hacker: "NEON HACKER",
  sage: "CYBER SAGE",
  pirate: "DATA KORSAN",
  scientist: "LAB SCIENTIST",
  glitch: "GLITCH AI",
};

export default function AgentDiscovery() {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgTarget, setMsgTarget] = useState<string | null>(null);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
    const interval = setInterval(loadAgents, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadAgents() {
    const data = await getAgents();
    setAgents(data);
    setLoading(false);
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
          // {agents.length} aktif ajan
        </span>
      </div>

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
                    className="h-2 w-2 rounded-full animate-pulse"
                    style={{ backgroundColor: color }}
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
