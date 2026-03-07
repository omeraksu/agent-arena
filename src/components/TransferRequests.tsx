import { useEffect, useState, useRef } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareTransaction, toWei } from "thirdweb";
import { chain, client } from "@/lib/thirdweb";
import {
  getIncomingRequests,
  respondToRequest,
  postActivity,
  type TransferRequest,
} from "@/lib/api";
import { POLL_INTERVAL } from "@/config/constants";

export default function TransferRequests() {
  const account = useActiveAccount();
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [open, setOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { mutateAsync: sendTx } = useSendTransaction();

  // Poll for incoming requests
  useEffect(() => {
    if (!account?.address) return;
    let active = true;

    async function poll() {
      try {
        const data = await getIncomingRequests(account!.address);
        if (active) setRequests(data);
      } catch {
        // ignore
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [account?.address]);

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleAccept(req: TransferRequest) {
    setProcessingId(req.id);
    try {
      const tx = prepareTransaction({
        chain,
        client,
        to: req.from_address as `0x${string}`,
        value: toWei(req.amount),
      });
      const result = await sendTx(tx);

      await respondToRequest(req.id, "accepted");

      await postActivity({
        type: "transfer_request_accepted",
        address: account!.address,
        data: {
          fromName: req.from_name || "",
          fromAddress: req.from_address,
          toName: req.to_name || "",
          amount: req.amount,
          txHash: result.transactionHash,
        },
      });

      // Also log as a regular transfer
      await postActivity({
        type: "transfer",
        address: account!.address,
        data: {
          to: req.from_address,
          toName: req.from_name || "",
          amount: req.amount,
          txHash: result.transactionHash,
        },
      });

      setRequests((prev) => prev.filter((r) => r.id !== req.id));
    } catch {
      // keep request in list on error
    }
    setProcessingId(null);
  }

  async function handleReject(req: TransferRequest) {
    setProcessingId(req.id);
    try {
      await respondToRequest(req.id, "rejected");
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
    } catch {
      // ignore
    }
    setProcessingId(null);
  }

  if (!account) return null;

  const count = requests.length;

  return (
    <div className="relative" ref={panelRef}>
      {/* Badge button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative font-mono-data text-[10px] px-2 py-0.5 border transition-all"
        style={{
          borderColor: count > 0 ? "rgba(191,95,255,0.4)" : "rgba(0,255,170,0.2)",
          backgroundColor: count > 0 ? "rgba(191,95,255,0.1)" : "rgba(0,255,170,0.05)",
          color: count > 0 ? "var(--neon-purple)" : "var(--neon-green)",
        }}
      >
        REQ
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-[var(--neon-purple)] text-black text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
            {count}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-8 z-50 cyber-card glow-purple p-3 w-80 max-h-80 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--neon-purple)] animate-pulse" />
            <span className="font-mono-data text-xs font-bold text-[var(--neon-purple)]">
              TRANSFER_REQUESTS
            </span>
          </div>

          {requests.length === 0 ? (
            <p className="font-mono-data text-[10px] text-gray-600">
              {">"} bekleyen istek yok
            </p>
          ) : (
            <ul className="space-y-2">
              {requests.map((req) => {
                const isProcessing = processingId === req.id;
                const displayFrom = req.from_name
                  ? `${req.from_name}.arena`
                  : `${req.from_address.slice(0, 6)}..${req.from_address.slice(-4)}`;

                return (
                  <li key={req.id} className="cyber-card p-3 space-y-2">
                    <div className="font-mono-data text-xs">
                      <span className="text-[var(--neon-blue)]">{displayFrom}</span>
                      <span className="text-gray-500"> senden </span>
                      <span className="text-[var(--neon-green)] font-bold">{req.amount} AVAX</span>
                      <span className="text-gray-500"> istiyor</span>
                    </div>
                    {req.message && (
                      <p className="font-mono-data text-[10px] text-gray-500 italic">
                        "{req.message}"
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(req)}
                        disabled={isProcessing}
                        className="flex-1 cyber-btn bg-[var(--neon-green)] px-3 py-1.5 font-mono-data text-[10px] font-bold text-black disabled:opacity-50"
                      >
                        {isProcessing ? "..." : "ACCEPT"}
                      </button>
                      <button
                        onClick={() => handleReject(req)}
                        disabled={isProcessing}
                        className="flex-1 px-3 py-1.5 font-mono-data text-[10px] font-bold text-gray-500 border border-gray-700 hover:border-red-500/50 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        REJECT
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
