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
  type: "wallet_created" | "transfer" | "nft_mint" | "faucet" | "transfer_request" | "transfer_request_accepted" | "agent_registered" | "agent_message";
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
  const res = await fetch(`/api/nfts?address=${encodeURIComponent(address)}`);
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
