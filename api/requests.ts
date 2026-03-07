import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabase } from "./_lib/supabase";

interface TransferRequest {
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

// In-memory fallback
const inMemoryRequests: TransferRequest[] = [];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabase = getSupabase();

  // GET — fetch incoming or outgoing requests
  if (req.method === "GET") {
    const { address, from } = req.query;

    if (supabase) {
      if (address) {
        // Incoming pending requests for this address
        const { data, error } = await supabase
          .from("transfer_requests")
          .select("*")
          .eq("to_address", (address as string).toLowerCase())
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(20);
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
      }
      if (from) {
        // Outgoing requests from this address
        const { data, error } = await supabase
          .from("transfer_requests")
          .select("*")
          .eq("from_address", (from as string).toLowerCase())
          .order("created_at", { ascending: false })
          .limit(20);
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
      }
      return res.status(400).json({ error: "address veya from parametresi gerekli" });
    }

    // In-memory fallback
    if (address) {
      const addrLower = (address as string).toLowerCase();
      const filtered = inMemoryRequests.filter(
        (r) => r.to_address === addrLower && r.status === "pending"
      );
      console.log(`[requests] GET incoming for ${addrLower}: ${filtered.length} of ${inMemoryRequests.length} total`);
      return res.status(200).json(filtered);
    }
    if (from) {
      const filtered = inMemoryRequests.filter(
        (r) => r.from_address === (from as string).toLowerCase()
      );
      return res.status(200).json(filtered);
    }
    return res.status(400).json({ error: "address veya from parametresi gerekli" });
  }

  // POST — create a new transfer request
  if (req.method === "POST") {
    const { fromAddress, fromName, toAddress, toName, amount, message } = req.body;
    if (!fromAddress || !toAddress || !amount) {
      return res.status(400).json({ error: "fromAddress, toAddress ve amount gerekli" });
    }

    const request: TransferRequest = {
      id: crypto.randomUUID(),
      from_address: fromAddress.toLowerCase(),
      from_name: fromName || null,
      to_address: toAddress.toLowerCase(),
      to_name: toName || null,
      amount,
      message: message || null,
      status: "pending",
      created_at: new Date().toISOString(),
      responded_at: null,
    };

    if (supabase) {
      const { error } = await supabase.from("transfer_requests").insert(request);
      if (error) return res.status(500).json({ error: error.message });
    } else {
      inMemoryRequests.push(request);
      if (inMemoryRequests.length > 100) inMemoryRequests.shift();
    }

    console.log(`[requests] POST new request: ${request.from_name || request.from_address} → ${request.to_name || request.to_address} (${request.amount} ETH). Total: ${inMemoryRequests.length}`);
    return res.status(201).json(request);
  }

  // PATCH — accept or reject a request
  if (req.method === "PATCH") {
    const { id, status } = req.body;
    if (!id || !status || !["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ error: "id ve status (accepted/rejected) gerekli" });
    }

    const responded_at = new Date().toISOString();

    if (supabase) {
      const { error } = await supabase
        .from("transfer_requests")
        .update({ status, responded_at })
        .eq("id", id);
      if (error) return res.status(500).json({ error: error.message });
    } else {
      const idx = inMemoryRequests.findIndex((r) => r.id === id);
      if (idx !== -1) {
        inMemoryRequests[idx].status = status;
        inMemoryRequests[idx].responded_at = responded_at;
      }
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
