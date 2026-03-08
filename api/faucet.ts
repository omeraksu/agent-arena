import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parseEther } from "viem";
import { getSupabase } from "./_lib/supabase.js";
import { getWalletClient } from "./_lib/viem.js";
import { BoundedMap } from "./_lib/bounded-map.js";

const FAUCET_AMOUNT = "0.005";
const MAX_REQUESTS_PER_ADDRESS = 1;

// In-memory fallback for rate limiting
const requestCounts = new BoundedMap<string, number>(200);

async function getRequestCount(supabase: ReturnType<typeof getSupabase>, address: string): Promise<number> {
  if (supabase) {
    try {
      const { data } = await supabase
        .from("rate_limits")
        .select("count")
        .eq("key", `faucet:${address}`)
        .single();
      if (data) return data.count;
    } catch {
      // fallback to in-memory
    }
  }
  return requestCounts.get(address) || 0;
}

async function incrementRequestCount(supabase: ReturnType<typeof getSupabase>, address: string) {
  if (supabase) {
    try {
      const { data } = await supabase
        .from("rate_limits")
        .select("count")
        .eq("key", `faucet:${address}`)
        .single();

      if (data) {
        await supabase
          .from("rate_limits")
          .update({ count: data.count + 1, updated_at: new Date().toISOString() })
          .eq("key", `faucet:${address}`);
      } else {
        await supabase.from("rate_limits").insert({
          key: `faucet:${address}`,
          count: 1,
        });
      }
      return;
    } catch {
      // fallback to in-memory
    }
  }
  requestCounts.set(address, (requestCounts.get(address) || 0) + 1);
}

async function decrementRequestCount(supabase: ReturnType<typeof getSupabase>, address: string) {
  if (supabase) {
    try {
      const { data } = await supabase
        .from("rate_limits")
        .select("count")
        .eq("key", `faucet:${address}`)
        .single();

      if (data && data.count > 0) {
        await supabase
          .from("rate_limits")
          .update({ count: data.count - 1, updated_at: new Date().toISOString() })
          .eq("key", `faucet:${address}`);
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
  if (!address || typeof address !== "string" || !address.startsWith("0x")) {
    return res.status(400).json({ error: "Geçersiz adres" });
  }

  const privateKey = process.env.FUJI_PRIVATE_KEY || process.env.SEPOLIA_PRIVATE_KEY;
  if (!privateKey) {
    return res.status(500).json({ error: "Faucet yapılandırılmamış" });
  }

  const supabase = getSupabase();
  const count = await getRequestCount(supabase, address);
  if (count >= MAX_REQUESTS_PER_ADDRESS) {
    return res.status(429).json({ error: "Faucet hakkını zaten kullandın!" });
  }

  // Increment BEFORE sending TX to prevent race conditions
  await incrementRequestCount(supabase, address);

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
