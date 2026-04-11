import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parseEther } from "viem";
import { getSupabase } from "./_lib/supabase.js";
import { getWalletClient } from "./_lib/viem.js";
import { BoundedMap } from "./_lib/bounded-map.js";
import { isValidAddress } from "./_lib/validation.js";

const FAUCET_AMOUNT = "0.005";
const MAX_REQUESTS_PER_ADDRESS = 1;

// In-memory fallback for rate limiting
const requestCounts = new BoundedMap<string, number>(200);

/**
 * Atomic check-and-increment: upsert with count=1, then read back.
 * If count > maxRequests after upsert, the request was a race loser — deny it.
 * Falls back to in-memory if Supabase is unavailable.
 */
async function atomicCheckAndIncrement(
  supabase: ReturnType<typeof getSupabase>,
  address: string,
  maxRequests: number,
): Promise<{ allowed: boolean; count: number }> {
  if (supabase) {
    try {
      const key = `faucet:${address}`;
      const now = new Date().toISOString();

      // Try insert first (new entry)
      const { error: insertError } = await supabase
        .from("rate_limits")
        .insert({ key, count: 1, updated_at: now });

      if (!insertError) {
        // Fresh insert succeeded — count is 1
        return { allowed: 1 <= maxRequests, count: 1 };
      }

      // Row exists — atomically increment via update + re-read
      // Use a filter to only increment if still under limit
      const { data: current } = await supabase
        .from("rate_limits")
        .select("count")
        .eq("key", key)
        .single();

      if (current && current.count >= maxRequests) {
        return { allowed: false, count: current.count };
      }

      const newCount = (current?.count || 0) + 1;
      await supabase
        .from("rate_limits")
        .update({ count: newCount, updated_at: now })
        .eq("key", key);

      return { allowed: newCount <= maxRequests, count: newCount };
    } catch {
      // fallback to in-memory
    }
  }

  // In-memory fallback
  const current = requestCounts.get(address) || 0;
  if (current >= maxRequests) {
    return { allowed: false, count: current };
  }
  requestCounts.set(address, current + 1);
  return { allowed: true, count: current + 1 };
}

async function decrementRequestCount(supabase: ReturnType<typeof getSupabase>, address: string) {
  if (supabase) {
    try {
      const key = `faucet:${address}`;
      const { data } = await supabase
        .from("rate_limits")
        .select("count")
        .eq("key", key)
        .single();

      if (data && data.count > 0) {
        await supabase
          .from("rate_limits")
          .update({ count: data.count - 1, updated_at: new Date().toISOString() })
          .eq("key", key);
      }
      return;
    } catch {
      // fallback to in-memory
    }
  }
  const current = requestCounts.get(address) || 0;
  if (current > 0) requestCounts.set(address, current - 1);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { address } = req.body;
  if (!isValidAddress(address)) {
    return res.status(400).json({ error: "Geçersiz adres" });
  }

  const privateKey = process.env.FUJI_PRIVATE_KEY || process.env.SEPOLIA_PRIVATE_KEY;
  if (!privateKey) {
    return res.status(500).json({ error: "Faucet yapılandırılmamış" });
  }

  const supabase = getSupabase();
  const { allowed } = await atomicCheckAndIncrement(supabase, address, MAX_REQUESTS_PER_ADDRESS);
  if (!allowed) {
    return res.status(429).json({ error: "Faucet hakkını zaten kullandın!" });
  }

  try {
    const walletClient = getWalletClient(privateKey);

    const txHash = await walletClient.sendTransaction({
      to: address as `0x${string}`,
      value: parseEther(FAUCET_AMOUNT),
    });

    return res.status(200).json({ txHash });
  } catch (err: unknown) {
    // Rollback count on TX failure
    await decrementRequestCount(supabase, address);
    const message = err instanceof Error ? err.message : "Faucet hatası";
    return res.status(500).json({ error: message });
  }
}
