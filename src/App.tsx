import { Routes, Route, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useActiveAccount, useActiveWallet, useDisconnect } from "thirdweb/react";
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import TransferRequests from "./components/TransferRequests";
import { getActivity } from "./lib/api";
import { SESSION_RESET_POLL_INTERVAL } from "./config/constants";
import { brand } from "./config/brand";
import { ArenaProvider } from "./contexts/ArenaContext";

// ─── Lazy-loaded route components ───
const Hub = lazy(() => import("./components/Hub"));
const WalletModule = lazy(() => import("./components/WalletModule"));
const AgentChat = lazy(() => import("./components/AgentChat"));
const ProfilePage = lazy(() => import("./components/ProfilePage"));
const AgentDiscovery = lazy(() => import("./components/AgentDiscovery"));
const MemeArena = lazy(() => import("./components/MemeArena"));
const SignalPulse = lazy(() => import("./components/SignalPulse"));
const LiveFeed = lazy(() => import("./components/LiveFeed"));
const SquadMilestone = lazy(() => import("./components/SquadMilestone"));
const InstructorPanel = lazy(() => import("./components/InstructorPanel"));
const Lobby = lazy(() => import("./components/Lobby"));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="font-mono-data text-[10px] text-[var(--neon-green)] animate-pulse tracking-wider">
        LOADING...
      </div>
    </div>
  );
}

function handleSignOut(disconnect: ReturnType<typeof useDisconnect>["disconnect"], wallet: ReturnType<typeof useActiveWallet>) {
  if (wallet) {
    disconnect(wallet);
  }
  localStorage.removeItem("arena_agent_config");
  localStorage.removeItem("arena_session_id");
  localStorage.removeItem("arena_wallet_done");
  localStorage.removeItem("arena_challenges");
  localStorage.removeItem("arena_handled_reset");
  localStorage.removeItem("arena_workshop_code");
  localStorage.removeItem("arena_faucet_used");
  window.location.href = "/";
}

// ─── Tab Visibility Hook ───
function useIsTabVisible() {
  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  return visible;
}

function HUDHeader() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();

  return (
    <header className="hud-top-bar">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-[var(--neon-green)] animate-pulse" />
        <a href="/" className="font-mono-data text-xs font-bold text-[var(--neon-green)] glitch-hover tracking-widest">
          ARENA_OS //
        </a>
        <span className="font-mono-data text-[9px] text-[var(--neon-green)] opacity-30">v0.1</span>
      </div>

      <div className="flex items-center gap-6 font-mono-data text-[10px]">
        <div className="flex gap-4">
          <span className="text-gray-600 flex items-center gap-1">NET:<span className="text-[var(--neon-blue)] ml-1">{brand.networkShort}</span><svg width="10" height="10" viewBox={brand.logoSvgViewBox} fill="none" className="inline-block"><path d={brand.logoSvgPath} fill="var(--brand-color)" /></svg><span className="text-[9px] text-[var(--brand-color)] opacity-60">{brand.tokenSymbol}</span></span>
          <span className="text-gray-600">SYS:<span className="text-[var(--neon-green)] ml-1">ONLINE</span></span>
        </div>
        <TransferRequests />
        {account && (
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 border border-[rgba(0,255,170,0.2)] bg-[rgba(0,255,170,0.05)]">
              <span className="text-[var(--neon-green)]">{account.address.slice(0, 6)}..{account.address.slice(-4)}</span>
            </div>
            <button
              onClick={() => handleSignOut(disconnect, wallet)}
              className="px-2 py-0.5 border border-[rgba(255,45,124,0.3)] bg-[rgba(255,45,124,0.05)] text-[var(--neon-pink)] hover:bg-[rgba(255,45,124,0.15)] hover:border-[var(--neon-pink)] transition-all"
              title="Cikis Yap"
            >
              SIGN_OUT
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <nav className="sidebar-nav hidden md:flex">
      <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} title="Hub">
        🏠
      </NavLink>
      <NavLink to="/wallet" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} title="Wallet">
        💳
      </NavLink>
      <NavLink to="/meme-arena" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} title="Meme Arena">
        🎨
      </NavLink>
      <NavLink to="/signal-pulse" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} title="Signal Pulse">
        ⚡
      </NavLink>
      <NavLink to="/agents" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} title="Agents">
        🌐
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} title="Profile">
        👤
      </NavLink>
    </nav>
  );
}

function MobileTabBar({ activeTab, onTabChange }: { activeTab: "main" | "chat"; onTabChange: (t: "main" | "chat") => void }) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-[var(--border-dim)] bg-[rgba(13,15,26,0.95)] backdrop-blur-sm">
      <button
        onClick={() => onTabChange("main")}
        className={`flex-1 py-3 font-mono-data text-xs text-center transition-colors ${
          activeTab === "main" ? "text-[var(--neon-green)] bg-[rgba(0,255,170,0.05)]" : "text-gray-600"
        }`}
      >
        🏠 HUB
      </button>
      <button
        onClick={() => onTabChange("chat")}
        className={`flex-1 py-3 font-mono-data text-xs text-center transition-colors ${
          activeTab === "chat" ? "text-[var(--neon-purple)] bg-[rgba(191,95,255,0.05)]" : "text-gray-600"
        }`}
      >
        💬 AGENT
      </button>
    </div>
  );
}

function useSessionReset(isTabVisible: boolean) {
  const didReset = useRef(false);
  const location = useLocation();

  useEffect(() => {
    const interval = setInterval(async () => {
      if (didReset.current) return;
      // Skip polling on lobby and instructor pages
      if (["/lobby", "/instructor"].includes(location.pathname)) return;
      // Skip polling when tab is in background
      if (!isTabVisible) return;
      try {
        const events = await getActivity();
        const resetEvent = events.find((e) => e.type === "session_reset");
        if (resetEvent) {
          const handledId = localStorage.getItem("arena_handled_reset");
          if (handledId === resetEvent.id) return; // already handled
          didReset.current = true;
          localStorage.removeItem("arena_agent_config");
          localStorage.removeItem("arena_session_id");
          localStorage.removeItem("arena_wallet_done");
          localStorage.removeItem("arena_challenges");
          localStorage.removeItem("arena_workshop_code");
          localStorage.removeItem("arena_faucet_used");
          localStorage.setItem("arena_handled_reset", resetEvent.id);
          window.location.reload();
        }
      } catch { /* ignore */ }
    }, SESSION_RESET_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [location.pathname, isTabVisible]);
}

// Lobby gate disabled — users go directly to hub
// eslint-disable-next-line @typescript-eslint/no-empty-function
function useWorkshopGate() {}

export default function App() {
  const [isChatCollapsed, setChatCollapsed] = useState(false);
  const [mobileTab, setMobileTab] = useState<"main" | "chat">("main");
  const location = useLocation();
  const isInstructor = location.pathname === "/instructor";
  const isLobby = location.pathname === "/lobby";
  const isMinimalLayout = isInstructor || isLobby;
  const isTabVisible = useIsTabVisible();

  // Auto-reload when instructor resets the session
  useSessionReset(isTabVisible);

  // Redirect to lobby if no workshop code
  useWorkshopGate();

  return (
    <ArenaProvider>
      <div className="h-screen flex flex-col overflow-hidden bg-[var(--bg-dark)]">
        {!isLobby && <HUDHeader />}

        <div className="flex flex-1 overflow-hidden">
          {!isMinimalLayout && <Sidebar />}

          {/* Main content */}
          <main className={`flex-1 overflow-y-auto p-8 pb-20 md:pb-8 custom-scrollbar min-w-0 ${mobileTab === "chat" ? "hidden md:block" : ""}`}>
            {/* SquadMilestone at top of main content */}
            {!isMinimalLayout && (
              <div className="mb-6 max-w-6xl mx-auto">
                <Suspense fallback={<LoadingSpinner />}>
                  <SquadMilestone />
                </Suspense>
              </div>
            )}

            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Hub />} />
                <Route path="/wallet" element={<WalletModule />} />
                <Route path="/chat" element={<AgentChat />} />
                <Route path="/meme-arena" element={<MemeArena />} />
                <Route path="/signal-pulse" element={<SignalPulse />} />
                <Route path="/agents" element={<AgentDiscovery />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/lobby" element={<Lobby />} />
                <Route path="/instructor" element={<InstructorPanel />} />
              </Routes>
            </Suspense>

            {/* LiveFeed in main content (collapsible) */}
            {!isMinimalLayout && (
              <div className="mt-8 max-w-6xl mx-auto">
                <details className="cyber-card overflow-hidden">
                  <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[rgba(0,255,170,0.02)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-mono-data text-[10px] text-green-500 font-bold">ARENA_FEED</span>
                    <span className="ml-auto font-mono-data text-[9px] text-green-800">LIVE</span>
                  </summary>
                  <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar border-t border-green-900/20">
                    <Suspense fallback={<LoadingSpinner />}>
                      <LiveFeed />
                    </Suspense>
                  </div>
                </details>
              </div>
            )}
          </main>

          {/* Right Chat Panel (desktop) */}
          {!isMinimalLayout && (
            <div className={`right-terminal hidden md:flex ${isChatCollapsed ? "collapsed" : ""}`}>
              <button
                onClick={() => setChatCollapsed(!isChatCollapsed)}
                className="terminal-toggle-right"
              >
                {isChatCollapsed ? "[+]" : "[-]"}
              </button>
              {!isChatCollapsed && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-purple-900/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--neon-purple)] animate-pulse" />
                    <span className="font-mono-data text-[10px] text-[var(--neon-purple)] font-bold">AGENT_CHAT</span>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <Suspense fallback={<LoadingSpinner />}>
                      <AgentChat />
                    </Suspense>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Chat Panel */}
          {!isMinimalLayout && mobileTab === "chat" && (
            <div className="md:hidden flex-1 overflow-y-auto pb-16">
              <Suspense fallback={<LoadingSpinner />}>
                <AgentChat />
              </Suspense>
            </div>
          )}
        </div>

        {/* Mobile Tab Bar */}
        {!isMinimalLayout && (
          <MobileTabBar activeTab={mobileTab} onTabChange={setMobileTab} />
        )}
      </div>
    </ArenaProvider>
  );
}
