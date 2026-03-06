-- Supabase table schema for Agent Arena
-- Run this in the Supabase SQL editor
-- Network: Ethereum Sepolia Testnet

create table if not exists activity_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  address text not null,
  data jsonb default '{}',
  created_at timestamptz default now()
);

-- Index for faster polling queries
create index if not exists idx_activity_created_at on activity_events (created_at desc);

-- Enable RLS
alter table activity_events enable row level security;

-- Allow anonymous reads
create policy "Anyone can read events"
  on activity_events for select
  using (true);

-- Only service key can insert (via API)
create policy "Service key can insert"
  on activity_events for insert
  with check (true);

-- Chat history table
create table if not exists chat_sessions (
  id text primary key,
  address text,
  archetype text default 'hacker',
  sliders jsonb default '{"technical":50,"tone":30,"detail":40}',
  messages jsonb default '[]',
  updated_at timestamptz default now()
);

alter table chat_sessions enable row level security;

create policy "Anyone can read own sessions"
  on chat_sessions for select using (true);

create policy "Anyone can insert sessions"
  on chat_sessions for insert with check (true);

create policy "Anyone can update sessions"
  on chat_sessions for update using (true);

-- Arena Names (ENS-like naming system)
create table if not exists arena_names (
  address text primary key,
  username text unique not null,
  created_at timestamptz default now()
);

create index if not exists idx_arena_names_username on arena_names (username);

alter table arena_names enable row level security;

create policy "Anyone can read names"
  on arena_names for select using (true);

create policy "Service can insert names"
  on arena_names for insert with check (true);

create policy "Service can update names"
  on arena_names for update using (true);

-- Transfer Requests (P2P ETH request system)
create table if not exists transfer_requests (
  id uuid default gen_random_uuid() primary key,
  from_address text not null,
  from_name text,
  to_address text not null,
  to_name text,
  amount text not null,
  message text,
  status text default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz default now(),
  responded_at timestamptz
);

create index if not exists idx_transfer_requests_to on transfer_requests (to_address, status);
create index if not exists idx_transfer_requests_from on transfer_requests (from_address);

alter table transfer_requests enable row level security;

create policy "Anyone can read requests"
  on transfer_requests for select using (true);

create policy "Service can insert requests"
  on transfer_requests for insert with check (true);

create policy "Service can update requests"
  on transfer_requests for update using (true);

-- ─── Rate Limits (persistent, survives server restarts) ─────────────────

create table if not exists rate_limits (
  key text primary key,              -- "faucet:0xABC..." or "chat:session123"
  count integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table rate_limits enable row level security;

create policy "Service can read rate_limits"
  on rate_limits for select using (true);

create policy "Service can insert rate_limits"
  on rate_limits for insert with check (true);

create policy "Service can update rate_limits"
  on rate_limits for update using (true);

-- ─── NFT Mints (tracks who minted, prevents duplicates) ────────────────

create table if not exists nft_mints (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  tx_hash text not null,
  token_id integer,
  simulated boolean default false,
  created_at timestamptz default now()
);

create unique index if not exists idx_nft_mints_address on nft_mints (address);

alter table nft_mints enable row level security;

create policy "Anyone can read mints"
  on nft_mints for select using (true);

create policy "Service can insert mints"
  on nft_mints for insert with check (true);

-- ─── Agent Registry (workshop agents) ──────────────────────────────────

create table if not exists agent_registry (
  agent_name text primary key,
  session_id text,
  archetype text default 'hacker',
  sliders jsonb default '{}',
  owner_address text not null,
  owner_name text,
  last_seen timestamptz default now()
);

alter table agent_registry enable row level security;

create policy "Anyone can read agents"
  on agent_registry for select using (true);

create policy "Service can insert agents"
  on agent_registry for insert with check (true);

create policy "Service can update agents"
  on agent_registry for update using (true);

create policy "Service can delete agents"
  on agent_registry for delete using (true);

-- ─── Agent Messages (inter-agent messaging) ────────────────────────────

create table if not exists agent_messages (
  id uuid primary key default gen_random_uuid(),
  from_agent text not null,
  to_agent text not null,
  message text not null,
  intent text default 'general',
  is_read boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_agent_messages_to on agent_messages (to_agent, created_at desc);

alter table agent_messages enable row level security;

create policy "Anyone can read messages"
  on agent_messages for select using (true);

create policy "Service can insert messages"
  on agent_messages for insert with check (true);

create policy "Service can delete messages"
  on agent_messages for delete using (true);

-- ─── NFT Metadata (on-chain NFT metadata stored off-chain) ──────────────

create table if not exists nft_metadata (
  token_id integer primary key,
  address text not null,
  name text not null,
  description text,
  image text,
  workshop_name text default 'Agent Arena Workshop',
  workshop_date text,
  arena_name text,
  archetype text,
  agent_name text,
  achievement text default 'participant',
  extra_attributes jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_nft_metadata_address on nft_metadata (address);

alter table nft_metadata enable row level security;

create policy "Anyone can read nft_metadata"
  on nft_metadata for select using (true);

create policy "Service can insert nft_metadata"
  on nft_metadata for insert with check (true);

create policy "Service can update nft_metadata"
  on nft_metadata for update using (true);

-- ─── NFT Metadata Drafts (pre-mint draft, agent creates) ────────────────

create table if not exists nft_metadata_drafts (
  address text primary key,
  name text,
  description text,
  special_trait text,
  image_url text,
  archetype text,
  agent_name text,
  arena_name text,
  updated_at timestamptz default now()
);

alter table nft_metadata_drafts enable row level security;

create policy "Anyone can read drafts"
  on nft_metadata_drafts for select using (true);

create policy "Service can insert drafts"
  on nft_metadata_drafts for insert with check (true);

create policy "Service can update drafts"
  on nft_metadata_drafts for update using (true);

-- ─── Supabase Storage: nft-images bucket public read ────────────────────
-- NOTE: Bucket must be created via Dashboard → Storage → New Bucket → "nft-images" (public)
-- Then run this policy to allow public reads:

create policy "Public read nft-images"
  on storage.objects for select
  using (bucket_id = 'nft-images');
