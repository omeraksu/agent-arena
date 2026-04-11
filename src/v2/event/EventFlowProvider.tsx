/**
 * EventFlowProvider — Event Mode local state machine.
 *
 * Faz 5 v1: basit linear state machine, route-based navigation.
 * Faz 5 v2+: instructor toggle + Supabase sync (workshop sonrası).
 *
 * Adımlar:
 *   splash → profiling (opsiyonel) → reveal → chat → reward → celebration → complete
 *
 * Flag: `VITE_EVENT_MODE_ENABLED=true` veya `?event=1` query. Default OFF.
 * Production'da `/v2/event/*` direkt URL ile de erişilebilir (test için).
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

export type EventStep =
  | "splash"
  | "profiling"
  | "reveal"
  | "chat"
  | "reward"
  | "celebration"
  | "complete";

const STEP_ORDER: EventStep[] = [
  "splash",
  "profiling",
  "reveal",
  "chat",
  "reward",
  "celebration",
  "complete",
];

interface EventFlowState {
  step: EventStep;
  /** Profiling cevapları (opsiyonel) */
  profile: {
    experience?: "beginner" | "intermediate" | "advanced";
    intent?: "learn" | "build" | "explore";
  };
  goNext: () => void;
  goBack: () => void;
  goTo: (step: EventStep) => void;
  setProfile: (profile: EventFlowState["profile"]) => void;
  /** Dev: SkipGate'ten çağrılır, bir sonraki adıma instant geçiş */
  skip: () => void;
}

const EventFlowContext = createContext<EventFlowState | null>(null);

export function EventFlowProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<EventStep>("splash");
  const [profile, setProfileState] = useState<EventFlowState["profile"]>({});

  const goTo = useCallback(
    (next: EventStep) => {
      setStep(next);
      navigate(`/v2/event/${next}`);
    },
    [navigate],
  );

  const goNext = useCallback(() => {
    const currentIdx = STEP_ORDER.indexOf(step);
    const next = STEP_ORDER[Math.min(currentIdx + 1, STEP_ORDER.length - 1)];
    goTo(next);
  }, [step, goTo]);

  const goBack = useCallback(() => {
    const currentIdx = STEP_ORDER.indexOf(step);
    const prev = STEP_ORDER[Math.max(currentIdx - 1, 0)];
    goTo(prev);
  }, [step, goTo]);

  const setProfile = useCallback((p: EventFlowState["profile"]) => {
    setProfileState((prev) => ({ ...prev, ...p }));
  }, []);

  const skip = goNext;

  return (
    <EventFlowContext.Provider
      value={{ step, profile, goNext, goBack, goTo, setProfile, skip }}
    >
      {children}
    </EventFlowContext.Provider>
  );
}

export function useEventFlow(): EventFlowState {
  const ctx = useContext(EventFlowContext);
  if (!ctx) {
    throw new Error("useEventFlow must be used within EventFlowProvider");
  }
  return ctx;
}

/**
 * Check if Event Mode is enabled via env or query param.
 * Default OFF — production workshop güvenliği.
 */
export function isEventModeEnabled(): boolean {
  const envFlag = import.meta.env.VITE_EVENT_MODE_ENABLED === "true";
  if (typeof window === "undefined") return envFlag;
  const params = new URLSearchParams(window.location.search);
  const queryFlag = params.get("event") === "1";
  return envFlag || queryFlag;
}
