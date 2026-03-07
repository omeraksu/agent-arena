import type { VercelRequest, VercelResponse } from "@vercel/node";
import { encodeFunctionData } from "viem";
import { getSupabase } from "./_lib/supabase.js";
import { publicClient, getWalletClient } from "./_lib/viem.js";

const WORKSHOP_NFT_ABI = [
  {
    name: "mintTo",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }],
    outputs: [],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;


// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveNftMetadata(
  supabase: any,
  tokenId: number,
  address: string,
  opts: {
    archetype?: string;
    agentName?: string;
    arenaName?: string;
    draftName?: string;
    draftDescription?: string;
    draftSpecialTrait?: string;
    draftImageUrl?: string;
  },
) {
  const arch = opts.archetype || "default";
  // Use draft metadata if available, otherwise fallback to defaults
  const name = opts.draftName
    ? opts.draftName
    : opts.arenaName
      ? `${opts.arenaName}.arena — Agent Arena #${tokenId}`
      : `Agent Arena #${tokenId}`;
  const description = opts.draftDescription
    ? opts.draftDescription
    : opts.arenaName
      ? `${opts.arenaName} Agent Arena Workshop'unda agent'i ikna ederek bu NFT'yi kazandi.`
      : `Agent Arena Workshop katilimci NFT'si #${tokenId}.`;
  const image = opts.draftImageUrl || `/nft/${arch}.svg`;
  const workshopDate = new Date().toISOString().slice(0, 10);

  const extraAttributes: Record<string, unknown> = {};
  if (opts.draftSpecialTrait) {
    extraAttributes.special_trait = opts.draftSpecialTrait;
  }

  await supabase.from("nft_metadata").upsert({
    token_id: tokenId,
    address: address.toLowerCase(),
    name,
    description,
    image,
    workshop_name: "Agent Arena Workshop",
    workshop_date: workshopDate,
    arena_name: opts.arenaName || null,
    archetype: arch !== "default" ? arch : null,
    agent_name: opts.agentName || null,
    achievement: "agent_convinced",
    ...(Object.keys(extraAttributes).length > 0 ? { extra_attributes: extraAttributes } : {}),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ─── GET: List NFTs by address (merged from nfts.ts) ───
  if (req.method === "GET") {
    const address = req.query.address as string;
    if (!address) {
      return res.status(400).json({ error: "address query param required" });
    }
    const sb = getSupabase();
    if (!sb) return res.status(200).json([]);
    const { data, error } = await sb
      .from("nft_metadata")
      .select("*")
      .eq("address", address.toLowerCase())
      .order("token_id", { ascending: true })
      .limit(100);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { address, archetype, agentName, arenaName, draftName, draftDescription, draftSpecialTrait, draftImageUrl } = req.body;
  if (!address || typeof address !== "string" || !address.startsWith("0x")) {
    return res.status(400).json({ error: "Geçersiz adres" });
  }

  const privateKey = process.env.FUJI_PRIVATE_KEY || process.env.SEPOLIA_PRIVATE_KEY;
  const contractAddress = process.env.NFT_CONTRACT_ADDRESS;

  // ─── Check if already minted (Supabase or in-memory) ───
  const supabase = getSupabase();
  if (supabase) {
    const { data: existing } = await supabase
      .from("nft_mints")
      .select("id")
      .eq("address", address.toLowerCase())
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: "Bu adrese zaten NFT mint edildi" });
    }
  }

  // ─── If contract not deployed yet, use simulated mint ───
  if (!privateKey || !contractAddress) {
    const fakeTxHash =
      "0x" +
      Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

    // Compute simulated tokenId from existing mint count
    let simulatedTokenId = 0;
    if (supabase) {
      const { count } = await supabase
        .from("nft_mints")
        .select("id", { count: "exact", head: true });
      simulatedTokenId = count ?? 0;

      await supabase.from("nft_mints").insert({
        address: address.toLowerCase(),
        tx_hash: fakeTxHash,
        token_id: simulatedTokenId,
        simulated: true,
      });

      await saveNftMetadata(supabase, simulatedTokenId, address, {
        archetype,
        agentName,
        arenaName,
        draftName,
        draftDescription,
        draftSpecialTrait,
        draftImageUrl,
      });
    }

    // Post activity
    await postActivity(req, address, fakeTxHash, true);

    return res.status(200).json({
      txHash: fakeTxHash,
      tokenId: simulatedTokenId,
      simulated: true,
    });
  }

  // ─── Real on-chain mint ───
  try {
    const walletClient = getWalletClient(privateKey);

    // Get current totalSupply as the next tokenId
    const totalSupply = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: WORKSHOP_NFT_ABI,
      functionName: "totalSupply",
    });

    // Mint NFT to student address
    const txHash = await walletClient.sendTransaction({
      to: contractAddress as `0x${string}`,
      data: encodeFunctionData({
        abi: WORKSHOP_NFT_ABI,
        functionName: "mintTo",
        args: [address as `0x${string}`],
      }),
    });

    const tokenId = Number(totalSupply);

    // Record in Supabase
    if (supabase) {
      await supabase.from("nft_mints").insert({
        address: address.toLowerCase(),
        tx_hash: txHash,
        token_id: tokenId,
        simulated: false,
      });

      await saveNftMetadata(supabase, tokenId, address, {
        archetype,
        agentName,
        arenaName,
        draftName,
        draftDescription,
        draftSpecialTrait,
        draftImageUrl,
      });
    }

    // Post activity
    await postActivity(req, address, txHash, false);

    return res.status(200).json({
      txHash,
      tokenId,
      simulated: false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "NFT mint hatası";
    return res.status(500).json({ error: message });
  }
}

async function postActivity(
  req: VercelRequest,
  address: string,
  txHash: string,
  simulated: boolean,
) {
  try {
    const proto = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers["x-forwarded-host"] || req.headers.host || "";
    await fetch(`${proto}://${host}/api/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "nft_mint",
        address,
        data: { txHash, simulated: String(simulated) },
      }),
    });
  } catch {
    // best-effort
  }
}
