import { useEffect, useState, useCallback, useRef } from "react";
import { useActiveAccount } from "thirdweb/react";
import { getSignalPulse, sendSignal, type SignalPulseState } from "@/lib/api";
import { SIGNAL_MILESTONES, SIGNAL_ROUND_RATE_LIMIT_MS } from "@/config/constants";

const GOAL = 500;
const POLL_MS = 1000;

type Phase = "waiting" | "countdown" | "active" | "ended";

export default function SignalPulse() {
  const account = useActiveAccount();
  const [state, setState] = useState<SignalPulseState | null>(null);
  const [mySignals, setMySignals] = useState(0);
  const [cooldown, setCooldown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [milestoneFlash, setMilestoneFlash] = useState<string | null>(null);

  // Local high-frequency timer state
  const [localRemainingMs, setLocalRemainingMs] = useState(0);
  const roundStartTimeRef = useRef<number | null>(null);
  const roundDurationRef = useRef<number>(30000);

  const fetchState = useCallback(async () => {
    const data = await getSignalPulse();
    setState(data);
    // Sync round timing from server
    if (data.round) {
      roundStartTimeRef.current = data.round.startTime;
      roundDurationRef.current = data.round.duration;
    } else {
      roundStartTimeRef.current = null;
    }
  }, []);

  // Poll server
  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchState]);

  // Local 100ms timer for smooth countdown/active display
  useEffect(() => {
    const tick = setInterval(() => {
      if (!roundStartTimeRef.current) {
        setLocalRemainingMs(0);
        return;
      }
      const now = Date.now();
      const start = roundStartTimeRef.current;
      const dur = roundDurationRef.current;

      if (now < start) {
        // countdown phase
        setLocalRemainingMs(start - now);
      } else if (now < start + dur) {
        // active phase
        setLocalRemainingMs(start + dur - now);
      } else {
        setLocalRemainingMs(0);
      }
    }, 100);
    return () => clearInterval(tick);
  }, []);

  const handleSignal = async () => {
    if (!account?.address || cooldown) return;
    setCooldown(true);
    setError(null);

    const res = await sendSignal(account.address);
    if (res.error) {
      setError(res.error);
      if (res.retryAfter) {
        setTimeout(() => setCooldown(false), res.retryAfter);
      } else {
        setCooldown(false);
      }
      return;
    }

    if (res.totalSignals !== undefined) {
      setState((prev) =>
        prev
          ? {
              ...prev,
              totalSignals: res.totalSignals!,
              participantCount: res.participantCount ?? prev.participantCount,
              goalReached: res.goalReached ?? prev.goalReached,
            }
          : prev
      );
    }
    if (res.yourSignals !== undefined) setMySignals(res.yourSignals);

    if (res.milestoneReached) {
      setMilestoneFlash(`${res.milestoneReached.emoji} ${res.milestoneReached.title}`);
      setTimeout(() => setMilestoneFlash(null), 3000);
    }

    setTimeout(() => setCooldown(false), SIGNAL_ROUND_RATE_LIMIT_MS);
  };

  // Derive phase from server state
  const phase: Phase = (() => {
    if (!state?.round) return "waiting";
    return state.round.status;
  })();

  const totalSignals = state?.totalSignals || 0;
  const progressPct = Math.min((totalSignals / GOAL) * 100, 100);
  const round = state?.round;

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center">
        <div className="cyber-card glow-blue p-8">
          <h1 className="font-mono-data text-2xl font-bold text-[var(--neon-blue)] mb-2">SIGNAL_PULSE</h1>
          <p className="text-gray-400 text-sm">Once cuzdanini olustur</p>
        </div>
      </div>
    );
  }

  // Countdown number (big display)
  const countdownSeconds = phase === "countdown" ? Math.ceil(localRemainingMs / 1000) : 0;
  // Active remaining
  const activeRemainingSeconds = phase === "active" ? Math.ceil(localRemainingMs / 1000) : 0;
  const activeProgressPct = phase === "active" && roundDurationRef.current > 0
    ? (localRemainingMs / roundDurationRef.current) * 100
    : 0;

  // Sync score label
  const syncLabel = (score: number): string => {
    if (score >= 80) return "Mukemmel Senkronizasyon!";
    if (score >= 50) return "Iyi Senkronizasyon";
    return "Daginik";
  };
  const syncColor = (score: number): string => {
    if (score >= 80) return "text-[var(--neon-green)]";
    if (score >= 50) return "text-[var(--neon-yellow)]";
    return "text-[var(--neon-pink)]";
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--neon-blue)] opacity-20" />
          <h1 className="font-mono-data text-3xl font-black text-[var(--neon-blue)] tracking-tighter glitch-hover">
            SIGNAL_PULSE
          </h1>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--neon-blue)] opacity-20" />
        </div>
        <p className="font-mono-data text-[10px] text-gray-500 text-center uppercase tracking-widest">
          {phase === "waiting" && "egitmen round baslatacak..."}
          {phase === "countdown" && "hazirlan!"}
          {phase === "active" && "sinifca tikla!"}
          {phase === "ended" && "round sonuclandi"}
        </p>
      </div>

      {/* Milestone Flash */}
      {milestoneFlash && (
        <div className="mb-4 cyber-card glow-green p-4 text-center" style={{ animation: "slideDown 0.3s ease-out" }}>
          <p className="font-mono-data text-lg font-bold text-[var(--neon-green)]">{milestoneFlash}</p>
        </div>
      )}

      {/* ── COUNTDOWN PHASE ── */}
      {phase === "countdown" && (
        <div className="mb-6 flex flex-col items-center">
          <div className="relative w-56 h-56 flex items-center justify-center">
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-full border-2 border-[var(--neon-blue)]/30 animate-ping" />
            <div className="absolute inset-4 rounded-full border border-[var(--neon-blue)]/20 animate-pulse" />
            <span className="font-mono-data text-8xl font-black text-[var(--neon-blue)] tabular-nums" style={{ textShadow: "0 0 40px rgba(0,212,255,0.6)" }}>
              {countdownSeconds}
            </span>
          </div>
          <p className="font-mono-data text-sm text-gray-400 mt-4 animate-pulse">
            Round basliyor...
          </p>
        </div>
      )}

      {/* ── ACTIVE PHASE ── */}
      {phase === "active" && (
        <>
          {/* Remaining time progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono-data text-[10px] text-[var(--neon-yellow)] font-bold tracking-wider">
                KALAN_SURE
              </span>
              <span className="font-mono-data text-sm font-bold text-[var(--neon-yellow)] tabular-nums">
                {activeRemainingSeconds}s
              </span>
            </div>
            <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-[var(--neon-yellow)]/20">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${activeProgressPct}%`,
                  background: `linear-gradient(90deg, rgba(255,200,0,0.4), rgba(255,200,0,0.8))`,
                  boxShadow: "0 0 10px rgba(255,200,0,0.3)",
                }}
              />
            </div>
          </div>

          {/* MASH Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={handleSignal}
              disabled={cooldown}
              className={`relative w-48 h-48 rounded-full font-mono-data text-lg font-black tracking-wider transition-all
                ${cooldown
                  ? "signal-btn-cooldown border-2 border-gray-700 text-gray-600 cursor-not-allowed"
                  : "border-2 border-[var(--neon-blue)] text-[var(--neon-blue)] hover:bg-[var(--neon-blue)]/10 hover:shadow-[0_0_40px_rgba(0,212,255,0.3)] active:scale-95"
                }
                ${!cooldown ? "signal-pulse-btn" : ""}
              `}
            >
              <span className="relative z-10">
                {cooldown ? "BEKLE..." : "SEND\nSIGNAL"}
              </span>
            </button>
          </div>

          {/* Live round stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="cyber-card p-3 text-center">
              <p className="font-mono-data text-2xl font-bold text-[var(--neon-blue)] tabular-nums">{round?.roundSignals || 0}</p>
              <p className="font-mono-data text-[8px] text-gray-600 mt-1">ROUND SINYAL</p>
            </div>
            <div className="cyber-card p-3 text-center">
              <p className="font-mono-data text-2xl font-bold text-[var(--neon-green)] tabular-nums">{round?.roundParticipants || 0}</p>
              <p className="font-mono-data text-[8px] text-gray-600 mt-1">KATILIMCI</p>
            </div>
          </div>
        </>
      )}

      {/* ── ENDED PHASE ── */}
      {phase === "ended" && round && (
        <div className="mb-6">
          <div className="cyber-card glow-blue p-6 text-center space-y-3">
            <p className="font-mono-data text-[10px] text-gray-500 uppercase tracking-widest">SYNC SKORU</p>
            <p className={`font-mono-data text-6xl font-black tabular-nums ${syncColor(round.syncScore ?? 0)}`} style={{ textShadow: "0 0 30px currentColor" }}>
              %{round.syncScore ?? 0}
            </p>
            <p className={`font-mono-data text-sm font-bold ${syncColor(round.syncScore ?? 0)}`}>
              {syncLabel(round.syncScore ?? 0)}
            </p>
            <div className="flex justify-center gap-6 mt-3">
              <div>
                <p className="font-mono-data text-lg font-bold text-[var(--neon-blue)]">{round.roundSignals}</p>
                <p className="font-mono-data text-[8px] text-gray-600">SINYAL</p>
              </div>
              <div>
                <p className="font-mono-data text-lg font-bold text-[var(--neon-green)]">{round.roundParticipants}</p>
                <p className="font-mono-data text-[8px] text-gray-600">KATILIMCI</p>
              </div>
            </div>
          </div>
          <p className="font-mono-data text-[10px] text-gray-600 text-center mt-3 animate-pulse">
            Sonraki round bekleniyor...
          </p>
        </div>
      )}

      {/* ── WAITING PHASE ── */}
      {phase === "waiting" && (
        <div className="mb-6 flex flex-col items-center">
          <div className="w-48 h-48 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center">
            <span className="font-mono-data text-sm text-gray-600 text-center px-4">
              Egitmen round baslatacak...
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 text-center">
          <p className="font-mono-data text-xs text-[var(--neon-pink)]">{error}</p>
        </div>
      )}

      {/* Global Progress Bar */}
      <div className="cyber-card p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono-data text-[10px] text-[var(--neon-blue)] font-bold tracking-wider">
            TOPLAM_SINYAL
          </span>
          <span className="font-mono-data text-sm font-bold text-[var(--neon-blue)]">
            {totalSignals} / {GOAL}
          </span>
        </div>

        <div className="relative h-8 bg-black/60 rounded overflow-hidden border border-[var(--neon-blue)]/20">
          <div
            className="absolute inset-y-0 left-0 transition-all duration-500 rounded"
            style={{
              width: `${progressPct}%`,
              background: `linear-gradient(90deg, rgba(0,212,255,0.3), rgba(0,212,255,0.6))`,
              boxShadow: "0 0 20px rgba(0,212,255,0.3)",
            }}
          />
          {SIGNAL_MILESTONES.map((m) => {
            const pos = (m.threshold / GOAL) * 100;
            const reached = totalSignals >= m.threshold;
            return (
              <div key={m.threshold} className="absolute top-0 bottom-0 flex items-center" style={{ left: `${pos}%` }}>
                <div className={`w-px h-full ${reached ? "bg-[var(--neon-green)]" : "bg-gray-600"}`} />
                <span
                  className={`absolute -top-5 -translate-x-1/2 font-mono-data text-[8px] whitespace-nowrap ${
                    reached ? "text-[var(--neon-green)]" : "text-gray-600"
                  }`}
                >
                  {m.emoji} {m.threshold}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="cyber-card p-4 text-center">
          <p className="font-mono-data text-2xl font-bold text-[var(--neon-blue)]">{totalSignals}</p>
          <p className="font-mono-data text-[8px] text-gray-600 mt-1">TOPLAM SINYAL</p>
        </div>
        <div className="cyber-card p-4 text-center">
          <p className="font-mono-data text-2xl font-bold text-[var(--neon-green)]">{state?.participantCount || 0}</p>
          <p className="font-mono-data text-[8px] text-gray-600 mt-1">KATILIMCI</p>
        </div>
        <div className="cyber-card p-4 text-center">
          <p className="font-mono-data text-2xl font-bold text-[var(--neon-purple)]">{mySignals}</p>
          <p className="font-mono-data text-[8px] text-gray-600 mt-1">SENIN SINYALLERIN</p>
        </div>
      </div>

      {/* Milestones List */}
      <div className="mt-6 cyber-card p-4">
        <h2 className="font-mono-data text-[10px] text-[var(--neon-blue)] font-bold tracking-wider mb-3">
          MILESTONES
        </h2>
        <div className="space-y-2">
          {SIGNAL_MILESTONES.map((m) => {
            const reached = totalSignals >= m.threshold;
            return (
              <div
                key={m.threshold}
                className={`flex items-center gap-3 px-3 py-2 rounded transition-all ${
                  reached
                    ? "bg-[var(--neon-green)]/5 border border-[var(--neon-green)]/20"
                    : "bg-black/20 border border-gray-800/50"
                }`}
              >
                <span className="text-lg">{m.emoji}</span>
                <div className="flex-1">
                  <p className={`font-mono-data text-xs font-bold ${reached ? "text-[var(--neon-green)]" : "text-gray-500"}`}>
                    {m.title}
                  </p>
                  <p className="font-mono-data text-[9px] text-gray-600">{m.threshold} sinyal</p>
                </div>
                {reached && (
                  <span className="font-mono-data text-[10px] text-[var(--neon-green)]">TAMAMLANDI</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
