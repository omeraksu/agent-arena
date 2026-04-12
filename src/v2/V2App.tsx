/**
 * V2App — ARIA Hub mobile-first shell (Faz 1 + Faz 5).
 *
 * Bu component `/v2/*` path'i altındaki sayfaları yönetir. Eski App.tsx'ten
 * tamamen izole: kendi ScreenShell + TopBar + BottomNav'ine sahip.
 *
 * Faz 5: `/v2/event/*` alt route'u için Event Mode shell (CornerMarks,
 * TopBar/BottomNav gizli, data-mode="event", JetBrains Mono dominant).
 * Event Mode default OFF — `isEventModeEnabled()` check'i ile güvenlik.
 *
 * Faz 4 flag flip sonrası bu shell `/` altına promote edilecek.
 */
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ScreenShell } from "../components/layout/ScreenShell";
import { TopBar } from "../components/layout/TopBar";
import { BottomNav } from "../components/layout/BottomNav";
import { MobileFrame } from "../components/layout/MobileFrame";
import { CornerMarks } from "../components/layout/CornerMarks";
import {
  EventFlowProvider,
  isEventModeEnabled,
} from "./event/EventFlowProvider";

// Hub Mode pages
const HubHome = lazy(() => import("./pages/HubHome"));
const QuestArena = lazy(() => import("./pages/QuestArena"));
const QuestDetail = lazy(() => import("./pages/QuestDetail"));
const ChatHub = lazy(() => import("./pages/ChatHub"));
const ProfileV2 = lazy(() => import("./pages/ProfileV2"));

// Event Mode screens (Faz 5 full — 7 ekran)
const SplashGate = lazy(() => import("./event/SplashGate"));
const ProfilingGate = lazy(() => import("./event/ProfilingGate"));
const AgentReveal = lazy(() => import("./event/AgentReveal"));
const EventChat = lazy(() => import("./event/EventChat"));
const RewardGate = lazy(() => import("./event/RewardGate"));
const NFTCelebration = lazy(() => import("./event/NFTCelebration"));
const SessionComplete = lazy(() => import("./event/SessionComplete"));

function V2LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="font-mono text-xs text-arena-text-tertiary animate-pulse tracking-wider">
        LOADING...
      </div>
    </div>
  );
}

// ─── Event Mode shell (izole) ──────────────────────────────────────────

function EventShell() {
  // Event Mode default olarak her ortamda erişilebilir — `/v2/event/*` path'e
  // direkt navigate ile girilebilir. Flag sadece gelecekte otomatik yönlendirme
  // için kullanılacak (Faz 6 instructor toggle).
  void isEventModeEnabled;

  return (
    <EventFlowProvider>
      <ScreenShell mode="event">
        <CornerMarks accent="teal" />
        <MobileFrame className="px-4 relative z-10">
          <Suspense fallback={<V2LoadingSpinner />}>
            <Routes>
              <Route path="/v2/event" element={<Navigate to="/v2/event/splash" replace />} />
              <Route path="/v2/event/splash" element={<SplashGate />} />
              <Route path="/v2/event/profiling" element={<ProfilingGate />} />
              <Route path="/v2/event/reveal" element={<AgentReveal />} />
              <Route path="/v2/event/chat" element={<EventChat />} />
              <Route path="/v2/event/reward" element={<RewardGate />} />
              <Route path="/v2/event/celebration" element={<NFTCelebration />} />
              <Route path="/v2/event/complete" element={<SessionComplete />} />
              <Route path="*" element={<Navigate to="/v2/event/splash" replace />} />
            </Routes>
          </Suspense>
        </MobileFrame>
      </ScreenShell>
    </EventFlowProvider>
  );
}

// ─── Hub Mode shell ────────────────────────────────────────────────────

function HubShell() {
  return (
    <ScreenShell mode="hub" header={<TopBar />} footer={<BottomNav />}>
      <MobileFrame className="px-4 pb-20">
        <Suspense fallback={<V2LoadingSpinner />}>
          <Routes>
            <Route path="/v2" element={<Navigate to="/v2/hub" replace />} />
            <Route path="/v2/hub" element={<HubHome />} />
            <Route path="/v2/quest" element={<QuestArena />} />
            <Route path="/v2/quest/:id" element={<QuestDetail />} />
            <Route path="/v2/chat" element={<ChatHub />} />
            <Route path="/v2/profile" element={<ProfileV2 />} />
            <Route path="*" element={<Navigate to="/v2/hub" replace />} />
          </Routes>
        </Suspense>
      </MobileFrame>
    </ScreenShell>
  );
}

// ─── Main router ───────────────────────────────────────────────────────

export function V2App() {
  const location = useLocation();
  const isEventRoute = location.pathname.startsWith("/v2/event");

  if (isEventRoute) {
    return <EventShell />;
  }

  return <HubShell />;
}

V2App.displayName = "V2App";
