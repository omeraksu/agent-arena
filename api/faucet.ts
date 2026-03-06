import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { createClient } from "@supabase/supabase-js";

const FAUCET_AMOUNT = "0.005";
const MAX_REQUESTS_PER_ADDRESS = 3;
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

// In-memory fallback for rate limiting
const requestCounts = new Map<string, number>();

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

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
    return res.status(429).json({ error: "Maksimum faucet isteğine ulaştın (3)" });
  }

  try {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(RPC_URL),
    });

    const txHash = await walletClient.sendTransaction({
      to: address as `0x${string}`,
      value: parseEther(FAUCET_AMOUNT),
    });

    await incrementRequestCount(supabase, address);

    return res.status(200).json({ txHash });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Faucet hatası";
    return res.status(500).json({ error: message });
  }
}
