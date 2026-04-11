import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabase } from "./_lib/supabase.js";
import { BoundedMap } from "./_lib/bounded-map.js";
import { getSessionResetTime } from "./_lib/session-reset-cache.js";
import { isValidAddress, safePasswordCompare } from "./_lib/validation.js";

// In-memory state
const signalRateLimit = new BoundedMap<string, number>(500);
let totalSignals = 0;
const userSignalCounts = new BoundedMap<string, number>(500);
let initialized = false;
let batchCounter = 0;

const MILESTONES = [
  { threshold: 100, title: "Sistem Uyaniyor", emoji: "⚡" },
  { threshold: 300, title: "Ag Aktif", emoji: "🔗" },
  { threshold: 500, title: "Mainframe Kirildi!", emoji: "🏆" },
];

const ROUND_RATE_LIMIT_MS = 1000;

// ─── Round State ───
let currentRound: {
  startTime: number;   // epoch ms — when countdown ends / active window starts
  duration: number;    // ms — active window length
  signals: Array<{ address: string; ts: number }>;
  syncScore: number | null;
} | null = null;

function getRoundStatus(now: number): "countdown" | "active" | "ended" | null {
  if (!currentRound) return null;
  if (now < currentRound.startTime) return "countdown";
  if (now < currentRound.startTime + currentRound.duration) return "active";
  return "ended";
}

function computeSyncScore(round: NonNullable<typeof currentRound>): number {
  if (round.signals.length === 0) return 0;

  // Collect unique participants
  const uniqueParticipants = new Set(round.signals.map((s) => s.address));
  const totalParticipants = uniqueParticipants.size;
  if (totalParticipants <= 1) return 100;

  // 1-second buckets
  const buckets = new Map<number, Set<string>>();
  for (const sig of round.signals) {
    const bucketKey = Math.floor(sig.ts / 1000);
    if (!buckets.has(bucketKey)) buckets.set(bucketKey, new Set());
    buckets.get(bucketKey)!.add(sig.address);
  }

  // Find peak bucket
  let peakCount = 0;
  for (const addrs of buckets.values()) {
    if (addrs.size > peakCount) peakCount = addrs.size;
  }

  return Math.round((peakCount / totalParticipants) * 100);
}

function buildRoundResponse(now: number) {
  if (!currentRound) return null;

  const status = getRoundStatus(now)!;

  // Compute sync score on first "ended" query
  if (status === "ended" && currentRound.syncScore === null) {
    currentRound.syncScore = computeSyncScore(currentRound);
  }

  const uniqueParticipants = new Set(currentRound.signals.map((s) => s.address));

  let remainingMs = 0;
  if (status === "countdown") {
    remainingMs = currentRound.startTime - now;
  } else if (status === "active") {
    remainingMs = currentRound.startTime + currentRound.duration - now;
  }

  return {
    status,
    startTime: currentRound.startTime,
    duration: currentRound.duration,
    remainingMs,
    roundSignals: currentRound.signals.length,
    roundParticipants: uniqueParticipants.size,
    syncScore: currentRound.syncScore,
  };
}

async function initFromDB(supabase: ReturnType<typeof getSupabase>) {
  if (initialized || !supabase) return;
  try {
    const resetTime = await getSessionResetTime(supabase);

    let query = supabase
      .from("activity_events")
      .select("data")
      .eq("type", "signal_pulse");
    if (resetTime) query = query.gt("created_at", resetTime);

    const { data: events } = await query;
    if (events) {
      let sum = 0;
      for (const e of events) {
        const count = parseInt((e.data as Record<string, string>)?.count || "0", 10);
        sum += count || 1;
      }
      totalSignals = sum;
    }
    initialized = true;
  } catch {
    // ignore init errors
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabase = getSupabase();
  await initFromDB(supabase);
  const now = Date.now();

  // ─── GET: Current state ───
  if (req.method === "GET") {
    const reachedMilestones = MILESTONES.filter((m) => totalSignals >= m.threshold);
    const nextMilestone = MILESTONES.find((m) => totalSignals < m.threshold) || null;
    const participantCount = userSignalCounts.size;

    return res.status(200).json({
      totalSignals,
      participantCount,
      milestones: reachedMilestones,
      nextMilestone,
      allMilestones: MILESTONES,
      goalReached: totalSignals >= 500,
      round: buildRoundResponse(now),
    });
  }

  // ─── POST ───
  if (req.method === "POST") {
    const { action, address, username, password } = req.body;

    // ─── Start Round ───
    if (action === "start_round") {
      const expectedPassword = process.env.INSTRUCTOR_PASSWORD;
      if (!expectedPassword) {
        return res.status(503).json({ error: "Sistem yapilandirmasi eksik" });
      }
      if (!safePasswordCompare(password || "", expectedPassword)) {
        return res.status(401).json({ error: "Yetkisiz" });
      }

      // Check if there's an active or countdown round
      if (currentRound) {
        const status = getRoundStatus(now);
        if (status === "countdown" || status === "active") {
          return res.status(400).json({ error: "Aktif round var, bitmesini bekleyin" });
        }
      }

      currentRound = {
        startTime: now + 5000,
        duration: 30000,
        signals: [],
        syncScore: null,
      };

      return res.status(200).json({ ok: true, round: buildRoundResponse(Date.now()) });
    }

    // ─── Send Signal ───
    if (!isValidAddress(address)) {
      return res.status(400).json({ error: "Geçersiz adres" });
    }

    // Round check: must have an active round
    const roundStatus = getRoundStatus(now);
    if (!currentRound || roundStatus !== "active") {
      return res.status(400).json({ error: "Round aktif degil" });
    }

    const addrLower = address.toLowerCase();

    // Rate limit (1s during rounds)
    const lastSignal = signalRateLimit.get(addrLower) || 0;
    if (now - lastSignal < ROUND_RATE_LIMIT_MS) {
      const remaining = ROUND_RATE_LIMIT_MS - (now - lastSignal);
      return res.status(429).json({ error: "Cok hizli!", retryAfter: remaining });
    }

    signalRateLimit.set(addrLower, now);

    // Record to round
    currentRound.signals.push({ address: addrLower, ts: now });

    // Also accumulate into global totals (milestones still work across rounds)
    totalSignals++;
    const userCount = (userSignalCounts.get(addrLower) || 0) + 1;
    userSignalCounts.set(addrLower, userCount);
    batchCounter++;

    // Batch activity events
    if (supabase && batchCounter >= 10) {
      batchCounter = 0;
      await supabase.from("activity_events").insert({
        id: crypto.randomUUID(),
        type: "signal_pulse",
        address: addrLower,
        data: {
          count: "10",
          totalSignals: String(totalSignals),
          username: username || "",
        },
        created_at: new Date().toISOString(),
      });
    }

    const justReached = MILESTONES.find((m) => totalSignals === m.threshold);

    return res.status(200).json({
      ok: true,
      totalSignals,
      yourSignals: userCount,
      participantCount: userSignalCounts.size,
      milestoneReached: justReached || null,
      goalReached: totalSignals >= 500,
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
