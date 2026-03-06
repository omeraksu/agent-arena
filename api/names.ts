import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// In-memory fallback
const nameRegistry = new Map<string, string>(); // address → username
const nameToAddress = new Map<string, string>(); // username → address

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET /api/names?address=0x... → resolve address to name
  // GET /api/names?name=kivanc → resolve name to address
  // GET /api/names?all=1 → get all mappings (for client cache)
  // POST /api/names { address, username } → register name
  if (req.method === "GET") {
    const { address, name, all } = req.query;

    if (all) {
      // Return all name mappings
      if (supabase) {
        const { data } = await supabase.from("arena_names").select("address, username");
        return res.json(data || []);
      }
      const entries = Array.from(nameRegistry.entries()).map(([addr, uname]) => ({
        address: addr,
        username: uname,
      }));
      return res.json(entries);
    }

    if (address && typeof address === "string") {
      if (supabase) {
        const { data } = await supabase
          .from("arena_names")
          .select("username")
          .eq("address", address.toLowerCase())
          .single();
        return res.json({ username: data?.username || null });
      }
      return res.json({ username: nameRegistry.get(address.toLowerCase()) || null });
    }

    if (name && typeof name === "string") {
      const cleanName = name.toLowerCase().replace(/\.arena$/, "");
      if (supabase) {
        const { data } = await supabase
          .from("arena_names")
          .select("address")
          .eq("username", cleanName)
          .single();
        return res.json({ address: data?.address || null });
      }
      return res.json({ address: nameToAddress.get(cleanName) || null });
    }

    return res.status(400).json({ error: "address, name, or all parameter required" });
  }

  if (req.method === "POST") {
    const { address, username } = req.body;

    if (!address || !username) {
      return res.status(400).json({ error: "address and username required" });
    }

    // Validate username: 3-16 chars, alphanumeric + underscore
    const clean = username.toLowerCase().replace(/\.arena$/, "");
    if (!/^[a-z0-9_]{3,16}$/.test(clean)) {
      return res.status(400).json({ error: "İsim 3-16 karakter, harf/rakam/alt çizgi olmalı" });
    }

    const addr = address.toLowerCase();

    if (supabase) {
      // Check if name is taken
      const { data: existing } = await supabase
        .from("arena_names")
        .select("address")
        .eq("username", clean)
        .single();

      if (existing && existing.address !== addr) {
        return res.status(409).json({ error: "Bu isim zaten alınmış" });
      }

      // Upsert
      const { error } = await supabase.from("arena_names").upsert(
        { address: addr, username: clean },
        { onConflict: "address" }
      );

      if (error) {
        return res.status(500).json({ error: error.message });
      }
    } else {
      // In-memory
      const existingAddr = nameToAddress.get(clean);
      if (existingAddr && existingAddr !== addr) {
        return res.status(409).json({ error: "Bu isim zaten alınmış" });
      }
      // Remove old name if re-registering
      const oldName = nameRegistry.get(addr);
      if (oldName) nameToAddress.delete(oldName);

      nameRegistry.set(addr, clean);
      nameToAddress.set(clean, addr);
    }

    return res.json({ ok: true, username: clean, display: `${clean}.arena` });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
