import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabase } from "./_lib/supabase.js";
import { getSessionResetTime } from "./_lib/session-reset-cache.js";

// ─── Types ───

interface Participant {
  address: string;
  username?: string;
  joinedAt: number;
}

interface WorkshopSession {
  code: string;
  status: "waiting" | "countdown" | "started";
  participants: Participant[];
  countdownStartedAt: number | null;
  createdAt: number;
}

// ─── In-memory state ───

let session: WorkshopSession | null = null;
let initialized = false;

const COUNTDOWN_DURATION_MS = 4000; // 3-2-1-GO
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

// ─── Cold start recovery from Supabase ───

async function initFromDB(supabase: ReturnType<typeof getSupabase>) {
  if (initialized || !supabase) return;
  try {
    const resetTime = await getSessionResetTime(supabase);

    // Run remaining two queries in parallel
    const [startResult, createResult] = await Promise.all([
      supabase
        .from("activity_events")
        .select("data, created_at")
        .eq("type", "workshop_started")
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("activity_events")
        .select("data, created_at")
        .eq("type", "workshop_created")
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    // Filter results by resetTime
    const startEvents = resetTime
      ? (startResult.data || []).filter((e) => e.created_at > resetTime)
      : startResult.data || [];

    if (startEvents.length > 0) {
      const startData = startEvents[0].data as Record<string, string>;
      session = {
        code: startData.code || "??????",
        status: "started",
        participants: [],
        countdownStartedAt: null,
        createdAt: new Date(startEvents[0].created_at).getTime(),
      };

      // Load participants
      let joinQuery = supabase
        .from("activity_events")
        .select("address, data, created_at")
        .eq("type", "lobby_joined")
        .order("created_at", { ascending: true });
      if (resetTime) joinQuery = joinQuery.gt("created_at", resetTime);
      const { data: joinEvents } = await joinQuery;

      if (joinEvents) {
        const seen = new Set<string>();
        for (const e of joinEvents) {
          const addr = e.address.toLowerCase();
          if (seen.has(addr)) continue;
          seen.add(addr);
          session.participants.push({
            address: addr,
            username: (e.data as Record<string, string>)?.username || undefined,
            joinedAt: new Date(e.created_at).getTime(),
          });
        }
      }
      initialized = true;
      return;
    }

    // Look for workshop_created event (workshop created but not yet started)
    const createEvents = resetTime
      ? (createResult.data || []).filter((e) => e.created_at > resetTime)
      : createResult.data || [];

    if (createEvents.length > 0) {
      const createData = createEvents[0].data as Record<string, string>;
      session = {
        code: createData.code || "??????",
        status: "waiting",
        participants: [],
        countdownStartedAt: null,
        createdAt: new Date(createEvents[0].created_at).getTime(),
      };

      // Load participants
      let joinQuery = supabase
        .from("activity_events")
        .select("address, data, created_at")
        .eq("type", "lobby_joined")
        .order("created_at", { ascending: true });
      if (resetTime) joinQuery = joinQuery.gt("created_at", resetTime);
      const { data: joinEvents } = await joinQuery;

      if (joinEvents) {
        const seen = new Set<string>();
        for (const e of joinEvents) {
          const addr = e.address.toLowerCase();
          if (seen.has(addr)) continue;
          seen.add(addr);
          session.participants.push({
            address: addr,
            username: (e.data as Record<string, string>)?.username || undefined,
            joinedAt: new Date(e.created_at).getTime(),
          });
        }
      }
    }
  } catch {
    // ignore init errors — fresh start
  }
  initialized = true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabase = getSupabase();
  await initFromDB(supabase);
  const now = Date.now();

  // ─── GET: Poll lobby status ───
  if (req.method === "GET") {
    const code = (req.query.code as string || "").toUpperCase();
    if (!code || !session || session.code !== code) {
      return res.status(200).json({ status: "not_found" });
    }

    // Auto-transition: countdown → started
    let status = session.status;
    if (
      status === "countdown" &&
      session.countdownStartedAt &&
      now - session.countdownStartedAt >= COUNTDOWN_DURATION_MS
    ) {
      session.status = "started";
      status = "started";
    }

    const response: Record<string, unknown> = {
      status,
      participantCount: session.participants.length,
      participants: session.participants.map((p) => ({
        address: p.address,
        username: p.username || null,
      })),
    };

    if (status === "countdown" && session.countdownStartedAt) {
      const elapsed = now - session.countdownStartedAt;
      response.countdownRemainingMs = Math.max(0, COUNTDOWN_DURATION_MS - elapsed);
    }

    return res.status(200).json(response);
  }

  // ─── POST: Actions ───
  if (req.method === "POST") {
    const { action, password, code, address, username } = req.body || {};
    const expectedPassword = process.env.INSTRUCTOR_PASSWORD || "arena2026";

    // ── create_workshop ──
    if (action === "create_workshop") {
      if (password !== expectedPassword) {
        return res.status(401).json({ error: "Yetkisiz" });
      }

      const newCode = generateCode();
      session = {
        code: newCode,
        status: "waiting",
        participants: [],
        countdownStartedAt: null,
        createdAt: now,
      };

      // Persist to Supabase for cold start recovery
      if (supabase) {
        await supabase.from("activity_events").insert({
          id: crypto.randomUUID(),
          type: "workshop_created",
          address: "system",
          data: { code: newCode },
          created_at: new Date().toISOString(),
        });
      }

      return res.status(200).json({ ok: true, code: newCode });
    }

    // ── join ──
    if (action === "join") {
      const joinCode = (code || "").toUpperCase();
      if (!session || session.code !== joinCode) {
        return res.status(200).json({ status: "not_found" });
      }

      // If workshop already started, let them through (late join)
      if (session.status === "started") {
        return res.status(200).json({ status: "started" });
      }

      if (!address) {
        return res.status(400).json({ error: "address gerekli" });
      }

      const addrLower = address.toLowerCase();

      // Idempotent: check if already joined
      const existing = session.participants.find((p) => p.address === addrLower);
      if (!existing) {
        session.participants.push({
          address: addrLower,
          username: username || undefined,
          joinedAt: now,
        });

        // Fire-and-forget: write lobby_joined event to Supabase (in-memory state already updated)
        if (supabase) {
          supabase.from("activity_events").insert({
            id: crypto.randomUUID(),
            type: "lobby_joined",
            address: addrLower,
            data: {
              code: session.code,
              username: username || "",
            },
            created_at: new Date().toISOString(),
          }).then(() => {}).catch(() => {});
        }
      }

      return res.status(200).json({
        status: session.status,
        participantCount: session.participants.length,
      });
    }

    // ── start_workshop ──
    if (action === "start_workshop") {
      if (password !== expectedPassword) {
        return res.status(401).json({ error: "Yetkisiz" });
      }

      if (!session) {
        return res.status(400).json({ error: "Workshop olusturulmamis" });
      }

      if (session.status !== "waiting") {
        return res.status(400).json({ error: "Workshop zaten baslatildi" });
      }

      session.status = "countdown";
      session.countdownStartedAt = now;

      // Write workshop_started event to Supabase
      if (supabase) {
        await supabase.from("activity_events").insert({
          id: crypto.randomUUID(),
          type: "workshop_started",
          address: "system",
          data: {
            code: session.code,
            participantCount: String(session.participants.length),
          },
          created_at: new Date().toISOString(),
        });
      }

      return res.status(200).json({ ok: true });
    }

    // ── reset_lobby ──
    if (action === "reset_lobby") {
      if (password !== expectedPassword) {
        return res.status(401).json({ error: "Yetkisiz" });
      }

      session = null;
      initialized = false;

      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Gecersiz action" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
