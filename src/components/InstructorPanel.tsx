import { useCallback, useEffect, useState } from "react";
import { sendBroadcast, setFreeze, getWorkshopStats, endWorkshop, exportSession, resetSession, finalizeMeme, getSignalPulse, startPulseRound, createWorkshop, startWorkshop, getLobbyStatus, resetLobby, type SignalPulseRound } from "@/lib/api";

export default function InstructorPanel() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [frozen, setFrozen] = useState(false);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [pulseRound, setPulseRound] = useState<SignalPulseRound | null>(null);
  const [lobbyCode, setLobbyCode] = useState<string | null>(null);
  const [lobbyStatus, setLobbyStatus] = useState<"none" | "waiting" | "countdown" | "started">("none");
  const [lobbyParticipantCount, setLobbyParticipantCount] = useState(0);

  const addLog = (msg: string) => setLog((prev) => [`[${new Date().toLocaleTimeString("tr-TR")}] ${msg}`, ...prev].slice(0, 50));

  const fetchStats = useCallback(async () => {
    if (!authed) return;
    const data = await getWorkshopStats(password);
    if (data.ok) {
      setStats(data.stats as Record<string, unknown>);
      setFrozen(!!data.frozen);
    }
    // Also fetch pulse round state
    const pulse = await getSignalPulse();
    setPulseRound(pulse.round);
    // Also fetch lobby state
    if (lobbyCode) {
      const lobby = await getLobbyStatus(lobbyCode);
      if (lobby.status !== "not_found") {
        setLobbyStatus(lobby.status);
        setLobbyParticipantCount(lobby.participantCount || 0);
      }
    }
  }, [authed, password, lobbyCode]);

  useEffect(() => {
    if (!authed) return;
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [authed, fetchStats]);

  const handleLogin = async () => {
    const data = await getWorkshopStats(password);
    if (data.error) {
      addLog("Giris basarisiz: " + data.error);
      return;
    }
    setAuthed(true);
    setStats(data.stats as Record<string, unknown>);
    addLog("Giris basarili");
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    const result = await sendBroadcast(password, broadcastMsg);
    if (result.ok) {
      addLog(`Broadcast: "${broadcastMsg}"`);
      setBroadcastMsg("");
    } else {
      addLog("Broadcast hatasi: " + (result.error || ""));
    }
  };

  const handleFreeze = async () => {
    const result = await setFreeze(password, !frozen);
    if (result.ok) {
      setFrozen(!frozen);
      addLog(frozen ? "Workshop acildi" : "Workshop donduruldu");
    }
  };

  if (!authed) {
    return (
      <div className="mx-auto max-w-md mt-20">
        <div className="cyber-card glow-red p-8 text-center space-y-4">
          <h1 className="font-mono-data text-xl font-bold text-red-400 tracking-wider">COMMAND_CENTER</h1>
          <p className="font-mono-data text-[10px] text-gray-500">// egitmen erisimi</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Sifre..."
            className="w-full bg-black/50 border border-red-900/30 rounded px-4 py-2 font-mono-data text-sm text-white focus:border-red-500 focus:outline-none"
          />
          <button
            onClick={handleLogin}
            className="cyber-btn w-full py-2 text-red-400 border-red-500/30 hover:bg-red-500/10"
          >
            AUTHENTICATE
          </button>
        </div>
      </div>
    );
  }

  const s = (stats || {}) as Record<string, number>;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-red-400" />
        <h1 className="font-mono-data text-xl font-bold text-red-400 tracking-wider">COMMAND_CENTER</h1>
        {frozen && (
          <span className="font-mono-data text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded animate-pulse">
            FROZEN
          </span>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "PARTICIPANTS", value: s.participants || 0, color: "text-[var(--neon-blue)]" },
          { label: "TRANSFERS", value: s.transfers || 0, color: "text-[var(--neon-green)]" },
          { label: "NFT_MINTS", value: s.nftMints || 0, color: "text-[var(--neon-yellow)]" },
          { label: "TOTAL_XP", value: s.totalXP || 0, color: "text-[var(--neon-purple)]" },
        ].map((stat) => (
          <div key={stat.label} className="cyber-card p-3 text-center">
            <p className={`font-mono-data text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="font-mono-data text-[8px] text-gray-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Extended Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "WALLETS", value: s.walletsCreated || 0 },
          { label: "FAUCET", value: s.faucetDrips || 0 },
          { label: "AGENTS", value: s.agentsRegistered || 0 },
          { label: "MEMES", value: s.memesSubmitted || 0 },
          { label: "SIGNALS", value: s.signalPulses || 0 },
        ].map((stat) => (
          <div key={stat.label} className="cyber-card p-3 text-center">
            <p className="font-mono-data text-lg font-bold text-gray-300">{stat.value}</p>
            <p className="font-mono-data text-[8px] text-gray-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Lobby Control */}
      <div className="cyber-card glow-blue p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[var(--neon-blue)]" />
          <h2 className="font-mono-data text-sm font-bold text-[var(--neon-blue)]">LOBBY_CONTROL</h2>
        </div>
        {lobbyStatus === "none" ? (
          <div className="space-y-3">
            <p className="font-mono-data text-[10px] text-gray-500">
              Workshop odasini olustur. Ogrenciler kodu girerek lobiye katilir.
            </p>
            <button
              onClick={async () => {
                addLog("Workshop olusturuluyor...");
                const result = await createWorkshop(password);
                if (result.ok && result.code) {
                  setLobbyCode(result.code);
                  setLobbyStatus("waiting");
                  addLog(`Workshop olusturuldu — Kod: ${result.code}`);
                } else {
                  addLog("Hata: " + (result.error || ""));
                }
              }}
              className="cyber-btn w-full py-2 text-sm font-bold text-[var(--neon-blue)] border-[var(--neon-blue)]/30 hover:bg-[var(--neon-blue)]/10"
            >
              WORKSHOP OLUSTUR
            </button>
          </div>
        ) : lobbyStatus === "waiting" ? (
          <div className="space-y-3">
            <div className="text-center py-2">
              <p className="font-mono-data text-[10px] text-gray-600 mb-1">ODA KODU</p>
              <p className="font-mono-data text-4xl font-black text-white tracking-[0.3em]">
                {lobbyCode}
              </p>
            </div>
            <div className="flex justify-between items-center px-2">
              <span className="font-mono-data text-[10px] text-gray-500">KATILIMCI</span>
              <span className="font-mono-data text-lg font-bold text-[var(--neon-blue)]">{lobbyParticipantCount}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={async () => {
                  if (lobbyParticipantCount === 0 && !window.confirm("Henuz kimse katilmadi. Yine de baslatmak istiyor musun?")) return;
                  addLog("Workshop baslatiliyor — geri sayim...");
                  const result = await startWorkshop(password);
                  if (result.ok) {
                    setLobbyStatus("countdown");
                    addLog("Workshop baslatildi — 3-2-1!");
                    setTimeout(() => setLobbyStatus("started"), 4500);
                  } else {
                    addLog("Hata: " + (result.error || ""));
                  }
                }}
                className="cyber-btn py-2 text-sm font-bold text-[var(--neon-green)] border-[var(--neon-green)]/30 hover:bg-[var(--neon-green)]/10"
              >
                BASLAT
              </button>
              <button
                onClick={async () => {
                  if (!window.confirm("Lobi sifirlanacak. Emin misin?")) return;
                  await resetLobby(password);
                  setLobbyCode(null);
                  setLobbyStatus("none");
                  setLobbyParticipantCount(0);
                  addLog("Lobi sifirlandi");
                }}
                className="cyber-btn py-2 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
              >
                SIFIRLA
              </button>
            </div>
          </div>
        ) : lobbyStatus === "countdown" ? (
          <div className="space-y-3 text-center">
            <p className="font-mono-data text-4xl font-black text-[var(--neon-yellow)] animate-pulse tracking-[0.3em]">
              {lobbyCode}
            </p>
            <p className="font-mono-data text-sm text-[var(--neon-yellow)] animate-pulse">
              GERI SAYIM...
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-center">
            <p className="font-mono-data text-2xl font-black text-[var(--neon-green)] tracking-[0.3em]">
              {lobbyCode}
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[var(--neon-green)] animate-pulse" />
              <span className="font-mono-data text-xs text-[var(--neon-green)]">BASLATILDI</span>
            </div>
            <p className="font-mono-data text-[10px] text-gray-500">{lobbyParticipantCount} katilimci</p>
            <button
              onClick={async () => {
                if (!window.confirm("Lobi sifirlanacak. Emin misin?")) return;
                await resetLobby(password);
                setLobbyCode(null);
                setLobbyStatus("none");
                setLobbyParticipantCount(0);
                addLog("Lobi sifirlandi");
              }}
              className="cyber-btn w-full py-1.5 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 mt-2"
            >
              LOBIYI SIFIRLA
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-5 gap-4">
        {/* Broadcast */}
        <div className="cyber-card p-4 space-y-3">
          <h2 className="font-mono-data text-sm font-bold text-red-400">BROADCAST</h2>
          <input
            type="text"
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleBroadcast()}
            placeholder="Feed'e mesaj gonder..."
            className="w-full bg-black/50 border border-red-900/30 rounded px-3 py-2 font-mono-data text-xs text-white focus:border-red-500 focus:outline-none"
          />
          <button
            onClick={handleBroadcast}
            className="cyber-btn w-full py-1.5 text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs"
          >
            SEND_BROADCAST
          </button>
        </div>

        {/* Freeze */}
        <div className="cyber-card p-4 space-y-3">
          <h2 className="font-mono-data text-sm font-bold text-yellow-400">FREEZE_CONTROL</h2>
          <p className="font-mono-data text-[10px] text-gray-500">
            {frozen
              ? "Workshop donduruldu. Ogrenciler bekliyor."
              : "Workshop aktif. Tum moduller acik."}
          </p>
          <button
            onClick={handleFreeze}
            className={`cyber-btn w-full py-1.5 text-xs ${
              frozen
                ? "text-green-400 border-green-500/30 hover:bg-green-500/10"
                : "text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10"
            }`}
          >
            {frozen ? "UNFREEZE" : "FREEZE_ALL"}
          </button>
        </div>

        {/* End Workshop */}
        <div className="cyber-card p-4 space-y-3">
          <h2 className="font-mono-data text-sm font-bold text-amber-400">END_WORKSHOP</h2>
          <p className="font-mono-data text-[10px] text-gray-500">
            Workshop'u bitir ve Oracle analizlerini aktif et.
          </p>
          <button
            onClick={async () => {
              if (!window.confirm("Workshop'u bitirmek istediginize emin misiniz? Bu islem geri alinamaz.")) return;
              const result = await endWorkshop(password);
              if (result.ok) {
                addLog("Workshop sonlandirildi — Oracle aktif");
              } else {
                addLog("Hata: " + (result.error || ""));
              }
            }}
            className="cyber-btn w-full py-1.5 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
            style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.05), rgba(251,146,60,0.05))" }}
          >
            FINISH_WORKSHOP
          </button>
        </div>

        {/* Meme Finale */}
        <div className="cyber-card p-4 space-y-3">
          <h2 className="font-mono-data text-sm font-bold text-[var(--neon-pink)]">MEME_FINALE</h2>
          <p className="font-mono-data text-[10px] text-gray-500">
            En cok oylanan meme'i NFT olarak mint et.
          </p>
          <button
            onClick={async () => {
              if (!window.confirm("En cok oy alan meme icin NFT mint edilecek. Devam?")) return;
              addLog("Meme finalize baslatiliyor...");
              const result = await finalizeMeme(password);
              if (result.ok && result.winner) {
                addLog(`Meme kazanan: "${result.winner.title}" (${result.winner.voteCount} oy) — NFT #${result.winner.tokenId ?? "?"}`);
              } else {
                addLog("Meme finale hatasi: " + (result.error || ""));
              }
            }}
            className="cyber-btn w-full py-1.5 text-xs text-[var(--neon-pink)] border-[var(--neon-pink)]/30 hover:bg-[var(--neon-pink)]/10"
          >
            MINT_WINNER
          </button>
        </div>

        {/* Pulse Round */}
        <div className="cyber-card p-4 space-y-3">
          <h2 className="font-mono-data text-sm font-bold text-[var(--neon-blue)]">PULSE_ROUND</h2>
          {pulseRound && (pulseRound.status === "countdown" || pulseRound.status === "active") ? (
            <>
              <p className="font-mono-data text-[10px] text-gray-500">
                {pulseRound.status === "countdown" ? "Geri sayim..." : `Aktif — ${Math.ceil(pulseRound.remainingMs / 1000)}s kaldi`}
              </p>
              <div className="flex justify-between font-mono-data text-xs text-gray-400">
                <span>Sinyal: {pulseRound.roundSignals}</span>
                <span>Kisi: {pulseRound.roundParticipants}</span>
              </div>
              <div className={`w-full py-1.5 text-center font-mono-data text-xs rounded ${
                pulseRound.status === "countdown" ? "bg-yellow-500/10 text-yellow-400" : "bg-[var(--neon-blue)]/10 text-[var(--neon-blue)]"
              }`}>
                {pulseRound.status === "countdown" ? "COUNTDOWN..." : "ACTIVE"}
              </div>
            </>
          ) : (
            <>
              <p className="font-mono-data text-[10px] text-gray-500">
                {pulseRound?.status === "ended"
                  ? `Son round: %${pulseRound.syncScore ?? 0} sync`
                  : "Yeni round baslatmak icin tikla."}
              </p>
              <button
                onClick={async () => {
                  addLog("Pulse round baslatiliyor...");
                  const result = await startPulseRound(password);
                  if (result.ok) {
                    addLog("Pulse round baslatildi — 5sn geri sayim");
                    fetchStats();
                  } else {
                    addLog("Pulse round hatasi: " + (result.error || ""));
                  }
                }}
                className="cyber-btn w-full py-1.5 text-xs text-[var(--neon-blue)] border-[var(--neon-blue)]/30 hover:bg-[var(--neon-blue)]/10"
              >
                START_ROUND
              </button>
            </>
          )}
        </div>
      </div>

      {/* Session Management */}
      <div className="cyber-card glow-red p-4 space-y-3">
        <h2 className="font-mono-data text-sm font-bold text-red-400">OTURUM_YONETIMI</h2>
        <p className="font-mono-data text-[10px] text-gray-500">
          Mevcut oturumu disa aktar veya sifirla. Sifirlama tum tablolari temizler (nft-images bucket'i haric).
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={async () => {
              addLog("Export baslatiliyor...");
              try {
                await exportSession(password);
                addLog("Export tamamlandi — dosya indirildi");
              } catch (err) {
                addLog("Export hatasi: " + (err instanceof Error ? err.message : "bilinmeyen"));
              }
            }}
            className="cyber-btn py-2 text-xs text-[var(--neon-blue)] border-[var(--neon-blue)]/30 hover:bg-[var(--neon-blue)]/10"
          >
            EXPORT_DATA
          </button>
          <button
            onClick={async () => {
              if (!window.confirm("Tum oturum verileri silinecek. Devam etmek istiyor musunuz?")) return;
              const input = window.prompt("Onaylamak icin 'SIFIRLA' yazin:");
              if (input !== "SIFIRLA") {
                addLog("Sifirlama iptal edildi");
                return;
              }
              addLog("Sifirlama baslatiliyor...");
              const result = await resetSession(password);
              if (result.ok) {
                const summary = Object.entries(result.deleted || {})
                  .map(([t, n]) => `${t}: ${n}`)
                  .join(", ");
                addLog("Sifirlama tamamlandi — " + summary);
                fetchStats();
              } else {
                addLog("Sifirlama hatasi: " + (result.error || ""));
              }
            }}
            className="cyber-btn py-2 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
          >
            RESET_SESSION
          </button>
        </div>
      </div>

      {/* Activity Log */}
      <div className="cyber-card p-4">
        <h2 className="font-mono-data text-sm font-bold text-gray-400 mb-2">COMMAND_LOG</h2>
        <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-0.5">
          {log.length === 0 ? (
            <p className="font-mono-data text-[10px] text-gray-700">{">"} awaiting_commands...</p>
          ) : (
            log.map((entry, i) => (
              <p key={i} className="font-mono-data text-[10px] text-gray-500">{entry}</p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
