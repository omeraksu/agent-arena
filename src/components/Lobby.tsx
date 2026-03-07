import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client, wallets, chain } from "@/lib/thirdweb";
import { joinLobby, getLobbyStatus, type LobbyParticipant } from "@/lib/api";
import { resolveAddressToName } from "@/lib/api";

const POLL_MS = 3000;
const CODE_LENGTH = 6;

export default function Lobby() {
  const account = useActiveAccount();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<"code" | "waiting" | "countdown">("code");
  const [codeChars, setCodeChars] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [codeError, setCodeError] = useState("");
  const [participants, setParticipants] = useState<LobbyParticipant[]>([]);
  const [countdownNum, setCountdownNum] = useState(3);
  const [workshopCode, setWorkshopCode] = useState("");
  const [myName, setMyName] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const countdownEndRef = useRef<number>(0);

  // Check if we already have a workshop code in localStorage (browser refresh)
  useEffect(() => {
    const savedCode = localStorage.getItem("arena_workshop_code");
    if (savedCode) {
      setWorkshopCode(savedCode);
      setPhase("waiting");
    }
  }, []);

  // Resolve our arena name
  useEffect(() => {
    if (!account?.address) return;
    resolveAddressToName(account.address).then(setMyName);
  }, [account?.address]);

  // ─── Code Entry ───

  const handleCharChange = (index: number, value: string) => {
    const char = value.toUpperCase().slice(-1);
    const next = [...codeChars];
    next[index] = char;
    setCodeChars(next);
    setCodeError("");

    // Auto-advance
    if (char && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (char && index === CODE_LENGTH - 1 && next.every((c) => c)) {
      submitCode(next.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !codeChars[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      const code = codeChars.join("");
      if (code.length === CODE_LENGTH) submitCode(code);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, CODE_LENGTH);
    const next = [...codeChars];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setCodeChars(next);
    if (pasted.length === CODE_LENGTH) {
      submitCode(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
    }
  };

  const submitCode = async (code: string) => {
    if (!account?.address) return;
    const result = await joinLobby(code, account.address, myName || undefined);

    if (result.status === "not_found") {
      setCodeError("KOD BULUNAMADI");
      return;
    }

    // Workshop already started — go straight to Hub
    if (result.status === "started") {
      localStorage.setItem("arena_workshop_code", code);
      navigate("/");
      return;
    }

    localStorage.setItem("arena_workshop_code", code);
    setWorkshopCode(code);
    setPhase("waiting");
  };

  // ─── Waiting Room Polling ───

  const handlePollResult = useCallback(
    (data: ReturnType<typeof getLobbyStatus> extends Promise<infer T> ? T : never) => {
      if (data.status === "not_found") return;

      if (data.participants) {
        setParticipants(data.participants);
      }

      if (data.status === "countdown") {
        setPhase("countdown");
        // Calculate local end time from server's remaining ms
        countdownEndRef.current = Date.now() + (data.countdownRemainingMs || 0);
      }

      if (data.status === "started") {
        navigate("/");
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (phase !== "waiting" || !workshopCode) return;
    let active = true;

    // Also re-join on mount (idempotent) for browser refresh
    if (account?.address) {
      joinLobby(workshopCode, account.address, myName || undefined).then((r) => {
        if (active) handlePollResult(r);
      });
    }

    const interval = setInterval(async () => {
      if (!active) return;
      const data = await getLobbyStatus(workshopCode);
      if (active) handlePollResult(data);
    }, POLL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [phase, workshopCode, account?.address, myName, handlePollResult]);

  // ─── Countdown Timer ───

  useEffect(() => {
    if (phase !== "countdown") return;
    let active = true;

    const tick = () => {
      if (!active) return;
      const remaining = countdownEndRef.current - Date.now();
      if (remaining <= 0) {
        navigate("/");
        return;
      }
      const secs = Math.ceil(remaining / 1000);
      setCountdownNum(secs > 3 ? 3 : secs);
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    return () => {
      active = false;
    };
  }, [phase, navigate]);

  // Also keep polling during countdown for status=started fallback
  useEffect(() => {
    if (phase !== "countdown" || !workshopCode) return;
    const interval = setInterval(async () => {
      const data = await getLobbyStatus(workshopCode);
      if (data.status === "started") navigate("/");
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [phase, workshopCode, navigate]);

  const shortAddr = (addr: string) => addr.slice(0, 6) + ".." + addr.slice(-4);

  // ─── RENDER ───

  // Phase: Countdown overlay
  if (phase === "countdown") {
    const label = countdownNum <= 0 ? "GO!" : String(countdownNum);
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg-dark)]">
        <div key={countdownNum} className="count-pulse text-center">
          <span
            className="font-mono-data font-black tracking-widest"
            style={{
              fontSize: "min(30vw, 200px)",
              color: countdownNum <= 0 ? "var(--neon-green)" : "var(--neon-blue)",
              textShadow: `0 0 60px ${countdownNum <= 0 ? "var(--neon-green)" : "var(--neon-blue)"}`,
            }}
          >
            {label}
          </span>
        </div>
        {/* Subtle grid in background */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "linear-gradient(rgba(0,255,170,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,170,0.1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
      </div>
    );
  }

  // Phase: Waiting room
  if (phase === "waiting") {
    return (
      <div className="mx-auto max-w-md mt-12 space-y-6">
        <div className="cyber-card p-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[var(--neon-blue)] animate-pulse" />
            <h1 className="font-mono-data text-lg font-bold text-[var(--neon-blue)] tracking-wider">
              LOBBY
            </h1>
          </div>

          {/* Room Code Display */}
          <div className="py-3">
            <p className="font-mono-data text-[10px] text-gray-600 mb-2">ODA KODU</p>
            <p className="font-mono-data text-3xl font-black text-white tracking-[0.3em]">
              {workshopCode}
            </p>
          </div>

          {/* Participant List */}
          <div className="border-t border-[var(--border-dim)] pt-4">
            <p className="font-mono-data text-[10px] text-gray-600 mb-3">
              KATILIMCILAR ({participants.length})
            </p>
            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
              {participants.map((p) => {
                const isMe = account?.address?.toLowerCase() === p.address.toLowerCase();
                return (
                  <div
                    key={p.address}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded font-mono-data text-xs ${
                      isMe
                        ? "bg-[rgba(0,255,170,0.1)] border border-[rgba(0,255,170,0.2)] text-[var(--neon-green)]"
                        : "text-gray-400"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isMe ? "bg-[var(--neon-green)]" : "bg-gray-600"}`} />
                    <span>
                      {p.username ? `${p.username}.arena` : shortAddr(p.address)}
                    </span>
                    {isMe && <span className="ml-auto text-[9px] text-[var(--neon-green)] opacity-60">SEN</span>}
                  </div>
                );
              })}
              {participants.length === 0 && (
                <p className="text-gray-700 text-[10px]">Henuz kimse katilmadi...</p>
              )}
            </div>
          </div>

          {/* Waiting Indicator */}
          <div className="pt-2">
            <p className="font-mono-data text-[10px] text-[var(--neon-blue)] animate-pulse tracking-wider">
              BASLATMA BEKLENIYOR...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Phase: Code Entry
  return (
    <div className="mx-auto max-w-md mt-20 space-y-6">
      <div className="cyber-card p-8 text-center space-y-6">
        <div className="space-y-2">
          <h1 className="font-mono-data text-xl font-bold text-[var(--neon-green)] tracking-wider">
            AGENT ARENA
          </h1>
          <p className="font-mono-data text-[10px] text-gray-500">
            // workshop kodunu gir
          </p>
        </div>

        {/* Wallet connect — must connect before entering code */}
        {!account ? (
          <div className="space-y-4">
            <p className="font-mono-data text-xs text-gray-400">
              Once cuzdanini olustur
            </p>
            <div className="flex justify-center">
              <ConnectButton
                client={client}
                wallets={wallets}
                chain={chain}
                connectButton={{
                  label: "GIRIS YAP",
                  style: {
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "14px",
                    fontWeight: "bold",
                    letterSpacing: "0.1em",
                  },
                }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* PIN-style code input */}
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {codeChars.map((char, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="text"
                  maxLength={1}
                  value={char}
                  onChange={(e) => handleCharChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center font-mono-data text-2xl font-bold bg-black/50 border border-[var(--border-dim)] rounded text-white focus:border-[var(--neon-green)] focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,170,0.2)] transition-all uppercase"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {codeError && (
              <p className="font-mono-data text-xs text-red-400 animate-pulse">{codeError}</p>
            )}

            <button
              onClick={() => {
                const code = codeChars.join("");
                if (code.length === CODE_LENGTH) submitCode(code);
              }}
              disabled={codeChars.some((c) => !c)}
              className="cyber-btn w-full py-3 font-mono-data text-sm font-bold text-[var(--neon-green)] border border-[var(--neon-green)]/30 hover:bg-[var(--neon-green)]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              KATIL
            </button>
          </>
        )}
      </div>
    </div>
  );
}
