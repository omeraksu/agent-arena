import { useState, useEffect } from "react";
import { useSendTransaction } from "thirdweb/react";
import { prepareTransaction, toWei } from "thirdweb";
import { chain, client } from "@/lib/thirdweb";
import { postActivity, resolveNameToAddress } from "@/lib/api";
import { DEFAULT_TRANSFER_AMOUNT, EXPLORER_TX_URL } from "@/config/constants";

interface Props {
  senderAddress: string;
  onSuccess?: () => void;
}

export default function TransferForm({ senderAddress, onSuccess }: Props) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState(DEFAULT_TRANSFER_AMOUNT);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  // Name resolution
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const isArenaName = to.includes(".arena") || (!to.startsWith("0x") && to.length >= 3 && /^[a-z0-9_]+$/.test(to));

  // Resolve .arena names
  useEffect(() => {
    if (!isArenaName || to.length < 3) {
      setResolvedAddress(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setResolving(true);
      const addr = await resolveNameToAddress(to.replace(/\.arena$/, ""));
      setResolvedAddress(addr);
      setResolving(false);
    }, 400);

    return () => clearTimeout(timeout);
  }, [to, isArenaName]);

  const { mutateAsync: sendTx, isPending } = useSendTransaction();

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setTxHash("");

    // Determine target address
    let targetAddress = to;
    if (isArenaName) {
      if (!resolvedAddress) {
        setError("Bu .arena ismi bulunamadı");
        return;
      }
      targetAddress = resolvedAddress;
    }

    if (!targetAddress.startsWith("0x") || targetAddress.length !== 42) {
      setError("Geçersiz adres — 0x adresi veya .arena ismi gir");
      return;
    }

    try {
      const tx = prepareTransaction({
        chain,
        client,
        to: targetAddress as `0x${string}`,
        value: toWei(amount),
      });
      const result = await sendTx(tx);
      setTxHash(result.transactionHash);
      await postActivity({
        type: "transfer",
        address: senderAddress,
        data: {
          to: targetAddress,
          toName: isArenaName ? to.replace(/\.arena$/, "") : "",
          amount,
          txHash: result.transactionHash,
        },
      });
      setTo("");
      setResolvedAddress(null);
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transfer başarısız");
    }
  }

  return (
    <div className="cyber-card glow-green p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-1.5 w-1.5 rounded-full bg-[var(--neon-green)]" />
        <h2 className="font-mono-data text-sm font-bold text-[var(--neon-green)] tracking-wider">TRANSFER_ETH</h2>
      </div>

      <form onSubmit={handleSend} className="space-y-3">
        <div>
          <label className="font-mono-data text-[10px] text-gray-600 mb-1 block">TARGET — ADRES VEYA .ARENA İSMİ</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value.toLowerCase())}
            placeholder="kivanc.arena veya 0x..."
            className="cyber-input w-full px-4 py-3 text-white font-mono-data text-sm"
          />
          {/* Resolution feedback */}
          {isArenaName && to.length >= 3 && (
            <div className="mt-1.5 font-mono-data text-xs">
              {resolving ? (
                <span className="text-gray-500">Çözümleniyor...</span>
              ) : resolvedAddress ? (
                <span className="text-[var(--neon-green)]">
                  ✓ {to.replace(/\.arena$/, "")}.arena → {resolvedAddress.slice(0, 6)}..{resolvedAddress.slice(-4)}
                </span>
              ) : (
                <span className="text-[var(--neon-pink)]">✗ Bu isim kayıtlı değil</span>
              )}
            </div>
          )}
        </div>
        <div>
          <label className="font-mono-data text-[10px] text-gray-600 mb-1 block">AMOUNT_ETH</label>
          <input
            type="number"
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="cyber-input w-full px-4 py-3 text-white font-mono-data text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || (isArenaName && !resolvedAddress)}
          className="cyber-btn w-full bg-[var(--neon-green)] px-4 py-3 font-mono-data text-sm font-bold text-black hover:shadow-[0_0_20px_rgba(0,255,170,0.3)] disabled:opacity-50"
        >
          {isPending ? "PROCESSING..." : "> SEND_TX"}
        </button>
      </form>

      {error && <p className="mt-3 font-mono-data text-xs text-[var(--neon-pink)]">{error}</p>}
      {txHash && (
        <div className="mt-3 cyber-card glow-green p-3 font-mono-data text-xs">
          <span className="text-[var(--neon-green)]">[OK]</span>{" "}
          <span className="text-gray-400">TX_CONFIRMED</span>{" "}
          <a
            href={`${EXPLORER_TX_URL}${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--neon-blue)] hover:underline"
          >
            VIEW_ON_ETHERSCAN
          </a>
        </div>
      )}
    </div>
  );
}
