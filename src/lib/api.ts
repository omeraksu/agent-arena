export async function requestFaucet(address: string): Promise<{ txHash?: string; error?: string }> {
  const res = await fetch("/api/faucet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  return res.json();
}

export async function requestMint(address: string): Promise<{ txHash?: string; error?: string }> {
  const res = await fetch("/api/mint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  return res.json();
}

export interface ActivityEvent {
  id: string;
  type: "wallet_created" | "transfer" | "nft_mint" | "faucet" | "transfer_request" | "transfer_request_accepted" | "agent_registered" | "agent_message" | "instructor_broadcast" | "freeze" | "unfreeze" | "workshop_ended" | "quiz_completed" | "session_reset" | "meme_submitted" | "meme_voted" | "meme_winner" | "signal_pulse" | "lobby_joined" | "workshop_started" | "workshop_created";
  address: string;
  data: Record<string, string>;
  created_at: string;
}

export async function getActivity(): Promise<ActivityEvent[]> {
  const res = await fetch("/api/activity");
  if (!res.ok) return [];
  return res.json();
}

export async function postActivity(
  event: Omit<ActivityEvent, "id" | "created_at">
): Promise<void> {
  await fetch("/api/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
}

// ─── User Progress ───

export async function getUserProgress(address: string): Promise<string[]> {
  const res = await fetch(`/api/activity?progress=true&address=${encodeURIComponent(address)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.types || [];
}

// ─── Squad Stats ───

export interface SquadMilestone {
  xp: number;
  title: string;
  emoji: string;
}

export interface SquadStats {
  totalXP: number;
  counts: Record<string, number>;
  milestones: Array<SquadMilestone>;
  allMilestones: Array<SquadMilestone>;
}

export async function getSquadStats(): Promise<SquadStats> {
  const res = await fetch("/api/activity?stats=squad");
  if (!res.ok) return { totalXP: 0, counts: {}, milestones: [], allMilestones: [] };
  return res.json();
}

// ─── Instructor ───

export async function sendBroadcast(password: string, message: string): Promise<{ ok?: boolean; error?: string }> {
  const res = await fetch("/api/instructor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "broadcast", password, message }),
  });
  return res.json();
}

export async function setFreeze(password: string, freeze: boolean): Promise<{ ok?: boolean; error?: string }> {
  const res = await fetch("/api/instructor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: freeze ? "freeze" : "unfreeze", password }),
  });
  return res.json();
}

export async function getWorkshopStats(password: string): Promise<Record<string, unknown>> {
  const res = await fetch("/api/instructor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "stats", password }),
  });
  return res.json();
}

// ─── End Workshop ───

export async function endWorkshop(password: string): Promise<{ ok?: boolean; error?: string }> {
  const res = await fetch("/api/instructor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "end_workshop", password }),
  });
  return res.json();
}

// ─── Session Export / Reset ───

export async function exportSession(password: string): Promise<void> {
  const res = await fetch("/api/instructor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "export_session", password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Export basarisiz");
  }
  const data = await res.json();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `agent-arena-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function resetSession(password: string): Promise<{ ok?: boolean; deleted?: Record<string, number>; error?: string }> {
  const res = await fetch("/api/instructor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "reset_session", password, confirm: "SIFIRLA" }),
  });
  return res.json();
}

// ─── Oracle Recap ───

export interface OracleRecap {
  title: string;
  description: string;
  traits: string[];
  emoji: string;
}

export async function generateRecap(address: string): Promise<{ recap?: OracleRecap; error?: string }> {
  const res = await fetch("/api/instructor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "recap", address }),
  });
  return res.json();
}

// ─── NFT Metadata ───

export interface NftAttribute {
  trait_type: string;
  value: string;
}

export interface NftMetadata {
  name: string;
  description: string;
  image: string;
  attributes: NftAttribute[];
}

export async function getNftMetadata(tokenId: number): Promise<NftMetadata | null> {
  const res = await fetch(`/api/metadata/${tokenId}`);
  if (!res.ok) return null;
  return res.json();
}

export interface NftRecord {
  token_id: number;
  address: string;
  name: string;
  description: string;
  image: string;
  workshop_name: string;
  workshop_date: string;
  arena_name: string | null;
  archetype: string | null;
  agent_name: string | null;
  achievement: string;
  extra_attributes: Record<string, string> | null;
}

export async function getNftsByAddress(address: string): Promise<NftRecord[]> {
  const res = await fetch(`/api/mint?address=${encodeURIComponent(address)}`);
  if (!res.ok) return [];
  return res.json();
}

// ─── NFT Image Generation / Upload ───

export async function uploadNftImage(
  address: string,
  imageData: string,
  mimeType: string,
): Promise<{ imageUrl?: string; error?: string }> {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "upload", address, imageData, mimeType }),
  });
  return res.json();
}

// ─── Arena Names ───

export interface ArenaName {
  address: string;
  username: string;
}

export async function registerName(
  address: string,
  username: string
): Promise<{ ok?: boolean; username?: string; display?: string; error?: string }> {
  const res = await fetch("/api/names", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, username }),
  });
  return res.json();
}

export async function resolveNameToAddress(name: string): Promise<string | null> {
  const res = await fetch(`/api/names?name=${encodeURIComponent(name)}`);
  const data = await res.json();
  return data.address || null;
}

export async function resolveAddressToName(address: string): Promise<string | null> {
  const res = await fetch(`/api/names?address=${encodeURIComponent(address)}`);
  const data = await res.json();
  return data.username || null;
}

export async function getAllNames(): Promise<ArenaName[]> {
  const res = await fetch("/api/names?all=1");
  if (!res.ok) return [];
  return res.json();
}

// ─── Transfer Requests ───

export interface TransferRequest {
  id: string;
  from_address: string;
  from_name: string | null;
  to_address: string;
  to_name: string | null;
  amount: string;
  message: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  responded_at: string | null;
}

export async function getIncomingRequests(address: string): Promise<TransferRequest[]> {
  const res = await fetch(`/api/requests?address=${encodeURIComponent(address)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getOutgoingRequests(from: string): Promise<TransferRequest[]> {
  const res = await fetch(`/api/requests?from=${encodeURIComponent(from)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function createTransferRequest(data: {
  fromAddress: string;
  fromName?: string;
  toAddress: string;
  toName?: string;
  amount: string;
  message?: string;
}): Promise<TransferRequest> {
  const res = await fetch("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function respondToRequest(
  id: string,
  status: "accepted" | "rejected"
): Promise<{ ok?: boolean; error?: string }> {
  const res = await fetch("/api/requests", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status }),
  });
  return res.json();
}

// ─── Agent Registry ───

export interface AgentRecord {
  session_id: string;
  agent_name: string;
  archetype: string;
  sliders: object;
  owner_address: string;
  owner_name: string | null;
  last_seen: string;
}

export interface AgentMessage {
  id: string;
  from_agent: string;
  to_agent: string;
  message: string;
  intent: string;
  is_read: boolean;
  created_at: string;
}

export async function registerAgent(data: {
  session_id: string;
  agent_name: string;
  archetype: string;
  sliders: object;
  owner_address: string;
  owner_name?: string;
}): Promise<{ ok?: boolean; agent?: AgentRecord; error?: string }> {
  const res = await fetch("/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getAgents(): Promise<AgentRecord[]> {
  const res = await fetch("/api/agents");
  if (!res.ok) return [];
  const data = await res.json();
  return data.agents || [];
}

export async function sendAgentMessage(
  fromAgent: string,
  toAgent: string,
  message: string,
  intent?: string
): Promise<{ ok?: boolean; error?: string }> {
  const res = await fetch("/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "message",
      from_agent: fromAgent,
      to_agent: toAgent,
      message,
      intent: intent || "general",
    }),
  });
  return res.json();
}

export async function getAgentMessages(agentName: string): Promise<AgentMessage[]> {
  const res = await fetch(`/api/agents?messages=${encodeURIComponent(agentName)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.messages || [];
}

// ─── Meme Arena ───

export interface Meme {
  id: string;
  address: string;
  username: string | null;
  title: string;
  image_url: string;
  vote_count: number;
  is_winner: boolean;
  nft_token_id: number | null;
  created_at: string;
}

export async function getMemes(address?: string): Promise<{ memes: Meme[]; hasSubmitted: boolean }> {
  const params = address ? `?address=${encodeURIComponent(address)}` : "";
  const res = await fetch(`/api/memes${params}`);
  if (!res.ok) return { memes: [], hasSubmitted: false };
  return res.json();
}

export async function submitMeme(data: {
  address: string;
  username?: string;
  title: string;
  imageBase64: string;
  mimeType: string;
}): Promise<{ ok?: boolean; memeId?: string; imageUrl?: string; error?: string }> {
  const res = await fetch("/api/memes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function voteMeme(
  memeId: string,
  voterAddress: string,
  memeTitle?: string
): Promise<{ ok?: boolean; newVoteCount?: number; error?: string }> {
  const res = await fetch("/api/memes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "vote", memeId, voterAddress, memeTitle }),
  });
  return res.json();
}

export async function finalizeMeme(password: string): Promise<{ ok?: boolean; winner?: { id: string; title: string; address: string; voteCount: number; tokenId?: number }; error?: string }> {
  const res = await fetch("/api/instructor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "finalize_meme", password }),
  });
  return res.json();
}

// ─── Signal Pulse ───

export interface SignalPulseRound {
  status: "countdown" | "active" | "ended";
  startTime: number;
  duration: number;
  remainingMs: number;
  roundSignals: number;
  roundParticipants: number;
  syncScore: number | null;
}

export interface SignalPulseState {
  totalSignals: number;
  participantCount: number;
  milestones: Array<{ threshold: number; title: string; emoji: string }>;
  nextMilestone: { threshold: number; title: string; emoji: string } | null;
  allMilestones: Array<{ threshold: number; title: string; emoji: string }>;
  goalReached: boolean;
  round: SignalPulseRound | null;
}

export async function getSignalPulse(): Promise<SignalPulseState> {
  const res = await fetch("/api/signal-pulse");
  if (!res.ok) return { totalSignals: 0, participantCount: 0, milestones: [], nextMilestone: null, allMilestones: [], goalReached: false, round: null };
  return res.json();
}

export async function startPulseRound(password: string): Promise<{ ok?: boolean; error?: string }> {
  const res = await fetch("/api/signal-pulse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "start_round", password }),
  });
  return res.json();
}

export async function sendSignal(
  address: string,
  username?: string
): Promise<{ ok?: boolean; totalSignals?: number; yourSignals?: number; participantCount?: number; milestoneReached?: { threshold: number; title: string; emoji: string } | null; goalReached?: boolean; error?: string; retryAfter?: number }> {
  const res = await fetch("/api/signal-pulse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, username }),
  });
  return res.json();
}

// ─── Lobby ───

export interface LobbyParticipant {
  address: string;
  username: string | null;
}

export interface LobbyStatus {
  status: "waiting" | "countdown" | "started" | "not_found";
  participants?: LobbyParticipant[];
  participantCount?: number;
  countdownRemainingMs?: number;
}

export async function createWorkshop(password: string): Promise<{ ok?: boolean; code?: string; error?: string }> {
  const res = await fetch("/api/lobby", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create_workshop", password }),
  });
  return res.json();
}

export async function startWorkshop(password: string): Promise<{ ok?: boolean; error?: string }> {
  const res = await fetch("/api/lobby", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "start_workshop", password }),
  });
  return res.json();
}

export async function joinLobby(
  code: string,
  address: string,
  username?: string
): Promise<LobbyStatus> {
  const res = await fetch("/api/lobby", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "join", code, address, username }),
  });
  return res.json();
}

export async function getLobbyStatus(code: string): Promise<LobbyStatus> {
  const res = await fetch(`/api/lobby?code=${encodeURIComponent(code)}`);
  if (!res.ok) return { status: "not_found" };
  return res.json();
}

export async function resetLobby(password: string): Promise<{ ok?: boolean; error?: string }> {
  const res = await fetch("/api/lobby", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "reset_lobby", password }),
  });
  return res.json();
}
