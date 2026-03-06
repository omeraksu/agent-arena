import { Routes, Route, NavLink } from "react-router-dom";
import { useActiveAccount } from "thirdweb/react";
import { useState } from "react";
import Hub from "./components/Hub";
import WalletModule from "./components/WalletModule";
import AgentChat from "./components/AgentChat";
import ProfilePage from "./components/ProfilePage";
import AgentDiscovery from "./components/AgentDiscovery";
import ChallengeModule from "./components/ChallengeModule";
import LiveFeed from "./components/LiveFeed";
import TransferRequests from "./components/TransferRequests";

function HUDHeader() {
  const account = useActiveAccount();

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
          <span className="text-gray-600">NET:<span className="text-[var(--neon-blue)] ml-1">SEPOLIA</span></span>
          <span className="text-gray-600">SYS:<span className="text-[var(--neon-green)] ml-1">ONLINE</span></span>
        </div>
        <TransferRequests />
        {account && (
          <div className="px-2 py-0.5 border border-[rgba(0,255,170,0.2)] bg-[rgba(0,255,170,0.05)]">
            <span className="text-[var(--neon-green)]">{account.address.slice(0, 6)}..{account.address.slice(-4)}</span>
          </div>
        )}
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <nav className="sidebar-nav">
      <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} title="Hub">
        🏠
      </NavLink>
      <NavLink to="/wallet" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} title="Wallet">
        💳
      </NavLink>
      <NavLink to="/chat" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} title="Chat">
        🤖
      </NavLink>
      <NavLink to="/challenges" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} title="Challenges">
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

export default function App() {
  const [isTerminalCollapsed, setTerminalCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--bg-dark)]">
      <HUDHeader />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar min-w-0">
          <Routes>
            <Route path="/" element={<Hub />} />
            <Route path="/wallet" element={<WalletModule />} />
            <Route path="/chat" element={<AgentChat />} />
            <Route path="/challenges" element={<ChallengeModule />} />
            <Route path="/agents" element={<AgentDiscovery />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>

        {/* Right Feed Panel */}
        <div className={`right-terminal ${isTerminalCollapsed ? "collapsed" : ""}`}>
          <button
            onClick={() => setTerminalCollapsed(!isTerminalCollapsed)}
            className="terminal-toggle-right"
          >
            {isTerminalCollapsed ? "[+]" : "[-]"}
          </button>
          {!isTerminalCollapsed && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 border-b border-green-900/20">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="font-mono-data text-[10px] text-green-500 font-bold">ARENA_FEED</span>
                <span className="ml-auto font-mono-data text-[9px] text-green-800">LIVE</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                <LiveFeed />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
