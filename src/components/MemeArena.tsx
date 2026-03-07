import { useEffect, useState, useRef, useCallback } from "react";
import { useActiveAccount } from "thirdweb/react";
import { getMemes, submitMeme, voteMeme, type Meme } from "@/lib/api";
import { POLL_INTERVAL } from "@/config/constants";

export default function MemeArena() {
  const account = useActiveAccount();
  const [memes, setMemes] = useState<Meme[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [view, setView] = useState<"gallery" | "submit">("gallery");
  const [title, setTitle] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/png");
  const [submitting, setSubmitting] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchMemes = useCallback(async () => {
    const data = await getMemes(account?.address);
    setMemes(data.memes);
    setHasSubmitted(data.hasSubmitted);
  }, [account?.address]);

  useEffect(() => {
    fetchMemes();
    const interval = setInterval(fetchMemes, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMemes]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Dosya en fazla 2MB olmali");
      return;
    }
    setError(null);
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      // Extract base64 part
      const base64 = result.split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!account?.address || !title.trim() || !imageBase64) return;
    setSubmitting(true);
    setError(null);
    const res = await submitMeme({
      address: account.address,
      title: title.trim(),
      imageBase64,
      mimeType,
    });
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setTitle("");
    setImagePreview(null);
    setImageBase64(null);
    setView("gallery");
    fetchMemes();
  };

  const handleVote = async (meme: Meme) => {
    if (!account?.address || votingId) return;
    setVotingId(meme.id);

    // Optimistic update: immediately reflect vote in UI
    setVotedIds((prev) => new Set(prev).add(meme.id));
    setMemes((prev) =>
      prev.map((m) => m.id === meme.id ? { ...m, vote_count: m.vote_count + 1 } : m)
    );

    const res = await voteMeme(meme.id, account.address, meme.title);
    setVotingId(null);
    if (res.error) {
      // Rollback optimistic update
      setVotedIds((prev) => { const next = new Set(prev); next.delete(meme.id); return next; });
      setMemes((prev) =>
        prev.map((m) => m.id === meme.id ? { ...m, vote_count: m.vote_count - 1 } : m)
      );
      setError(res.error);
      setTimeout(() => setError(null), 3000);
      return;
    }
  };

  const winner = memes.find((m) => m.is_winner);

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center">
        <div className="cyber-card glow-pink p-8">
          <h1 className="font-mono-data text-2xl font-bold text-[var(--neon-pink)] mb-2">MEME_ARENA</h1>
          <p className="text-gray-400 text-sm">Once cuzdanini olustur</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--neon-pink)] opacity-20" />
          <h1 className="font-mono-data text-3xl font-black text-[var(--neon-pink)] tracking-tighter glitch-hover">
            MEME_ARENA
          </h1>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--neon-pink)] opacity-20" />
        </div>
        <p className="font-mono-data text-[10px] text-gray-500 text-center uppercase tracking-widest">
          meme yukle // oyla // kazanan NFT olsun
        </p>
      </div>

      {/* Winner Banner */}
      {winner && (
        <div className="mb-6 cyber-card glow-yellow p-4 text-center">
          <p className="font-mono-data text-[10px] text-[var(--neon-yellow)] font-bold tracking-wider mb-1">
            KAZANAN
          </p>
          <p className="font-mono-data text-lg font-bold text-[var(--neon-yellow)]">
            {winner.title}
          </p>
          <p className="font-mono-data text-[10px] text-gray-500 mt-1">
            by {winner.username || winner.address.slice(0, 8)} — {winner.vote_count} oy — NFT #{winner.nft_token_id ?? "?"}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 cyber-card p-3 border-[var(--neon-pink)]/30 bg-[var(--neon-pink)]/5 text-center">
          <p className="font-mono-data text-xs text-[var(--neon-pink)]">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView("gallery")}
          className={`cyber-btn px-4 py-2 font-mono-data text-xs transition-all ${
            view === "gallery"
              ? "text-[var(--neon-pink)] border border-[var(--neon-pink)]/50 bg-[var(--neon-pink)]/10"
              : "text-gray-500 border border-gray-800 hover:text-gray-300"
          }`}
        >
          GALERI ({memes.length})
        </button>
        {!hasSubmitted && (
          <button
            onClick={() => setView("submit")}
            className={`cyber-btn px-4 py-2 font-mono-data text-xs transition-all ${
              view === "submit"
                ? "text-[var(--neon-pink)] border border-[var(--neon-pink)]/50 bg-[var(--neon-pink)]/10"
                : "text-gray-500 border border-gray-800 hover:text-gray-300"
            }`}
          >
            MEME YUKLE
          </button>
        )}
        {hasSubmitted && (
          <span className="font-mono-data text-[10px] text-gray-600 self-center ml-2">
            Meme'ini zaten yukledin
          </span>
        )}
      </div>

      {/* Submit View */}
      {view === "submit" && !hasSubmitted && (
        <div className="cyber-card glow-pink p-6 space-y-4">
          <h2 className="font-mono-data text-sm font-bold text-[var(--neon-pink)]">MEME_UPLOAD</h2>

          {/* File Input */}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="cyber-btn w-full py-3 border border-dashed border-[var(--neon-pink)]/30 text-gray-400 hover:text-[var(--neon-pink)] hover:border-[var(--neon-pink)]/60 font-mono-data text-xs transition-all"
            >
              {imagePreview ? "DEGISTIR" : "RESIM SEC (max 2MB)"}
            </button>
            {imagePreview && (
              <div className="mt-3 flex justify-center">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 rounded border border-[var(--neon-pink)]/20"
                />
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 50))}
              placeholder="Meme basligi (max 50 karakter)"
              className="w-full bg-black/50 border border-[var(--neon-pink)]/20 rounded px-4 py-2 font-mono-data text-sm text-white focus:border-[var(--neon-pink)] focus:outline-none"
            />
            <p className="font-mono-data text-[9px] text-gray-600 mt-1 text-right">{title.length}/50</p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !imageBase64}
            className="cyber-btn w-full py-3 font-mono-data text-sm font-bold text-[var(--neon-pink)] border border-[var(--neon-pink)]/50 hover:bg-[var(--neon-pink)]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? "YUKLENIYOR..." : "GONDER"}
          </button>
        </div>
      )}

      {/* Gallery View */}
      {view === "gallery" && (
        <div className="grid grid-cols-2 gap-4">
          {memes.length === 0 ? (
            <div className="col-span-2 cyber-card p-8 text-center">
              <p className="font-mono-data text-sm text-gray-600">Henuz meme yok. Ilk sen yukle!</p>
            </div>
          ) : (
            memes.map((meme) => {
              const isOwn = meme.address.toLowerCase() === account.address.toLowerCase();
              const alreadyVoted = votedIds.has(meme.id);
              return (
                <div
                  key={meme.id}
                  className={`cyber-card overflow-hidden transition-all ${
                    meme.is_winner ? "glow-yellow" : "glow-pink"
                  }`}
                >
                  {/* Image */}
                  <div className="aspect-square overflow-hidden bg-black/50">
                    <img
                      src={meme.image_url}
                      alt={meme.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-mono-data text-sm font-bold text-white truncate">{meme.title}</h3>
                    <p className="font-mono-data text-[9px] text-gray-500 mt-0.5">
                      by {meme.username || meme.address.slice(0, 8)}
                    </p>

                    <div className="flex items-center justify-between mt-3">
                      <span className="font-mono-data text-lg font-bold text-[var(--neon-pink)]">
                        {meme.vote_count} oy
                      </span>

                      {!isOwn && !alreadyVoted ? (
                        <button
                          onClick={() => handleVote(meme)}
                          disabled={!!votingId}
                          className="cyber-btn px-3 py-1.5 font-mono-data text-[10px] font-bold text-[var(--neon-pink)] border border-[var(--neon-pink)]/40 hover:bg-[var(--neon-pink)]/10 disabled:opacity-30 transition-all"
                        >
                          {votingId === meme.id ? "..." : "OYLA"}
                        </button>
                      ) : isOwn ? (
                        <span className="font-mono-data text-[9px] text-gray-600">senin</span>
                      ) : (
                        <span className="font-mono-data text-[9px] text-[var(--neon-green)]">oy verildi</span>
                      )}
                    </div>

                    {meme.is_winner && (
                      <div className="mt-2 text-center">
                        <span className="font-mono-data text-[10px] text-[var(--neon-yellow)] font-bold">
                          KAZANAN — NFT #{meme.nft_token_id ?? "?"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
