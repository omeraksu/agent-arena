import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useActiveAccount } from "thirdweb/react";
import { resolveAddressToName, getUserProgress } from "@/lib/api";

interface ArenaState {
  userName: string | null;
  completedTypes: string[];
  setUserName: (name: string) => void;
  addCompletedType: (type: string) => void;
  refreshProgress: () => Promise<void>;
}

const ArenaContext = createContext<ArenaState | null>(null);

const BACKGROUND_REFRESH_MS = 15_000;

export function ArenaProvider({ children }: { children: ReactNode }) {
  const account = useActiveAccount();
  const [userName, setUserNameState] = useState<string | null>(null);
  const [completedTypes, setCompletedTypes] = useState<string[]>([]);
  const addressRef = useRef<string | undefined>();

  const refreshProgress = useCallback(async () => {
    const addr = addressRef.current;
    if (!addr) return;
    const types = await getUserProgress(addr);
    setCompletedTypes(types);
  }, []);

  const setUserName = useCallback((name: string) => {
    setUserNameState(name);
  }, []);

  const addCompletedType = useCallback((type: string) => {
    setCompletedTypes((prev) => (prev.includes(type) ? prev : [...prev, type]));
  }, []);

  // Initial fetch when account connects
  useEffect(() => {
    const addr = account?.address;
    addressRef.current = addr;
    if (!addr) {
      setUserNameState(null);
      setCompletedTypes([]);
      return;
    }

    // Parallel initial load
    Promise.all([
      resolveAddressToName(addr).then((name) => {
        if (name) setUserNameState(name);
      }),
      getUserProgress(addr).then((types) => {
        setCompletedTypes(types);
      }),
    ]).catch(() => {});
  }, [account?.address]);

  // Background refresh (safety net)
  useEffect(() => {
    if (!account?.address) return;
    const interval = setInterval(refreshProgress, BACKGROUND_REFRESH_MS);
    return () => clearInterval(interval);
  }, [account?.address, refreshProgress]);

  return (
    <ArenaContext.Provider value={{ userName, completedTypes, setUserName, addCompletedType, refreshProgress }}>
      {children}
    </ArenaContext.Provider>
  );
}

export function useArena(): ArenaState {
  const ctx = useContext(ArenaContext);
  if (!ctx) throw new Error("useArena must be used within ArenaProvider");
  return ctx;
}
