import { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { ConnectButton } from "thirdweb/react";
import { client, wallets, chain } from "@/lib/thirdweb";
import { getActivity, getNftsByAddress, generateRecap, type ActivityEvent, type NftRecord, type OracleRecap } from "@/lib/api";
import { EXPLORER_TX_URL, EXPLORER_ADDRESS_URL } from "@/config/constants";

function shortenAddr(addr: string) {
  return `${addr.slice(0, 6)}..${addr.slice(-4)}`;
}

export default function ProfilePage() {
  const account = useActiveAccount();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [nfts, setNfts] = useState<NftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recap, setRecap] = useState<OracleRecap | null>(null);
  const [recapLoading, setRecapLoading] = useState(false);
  const [recapError, setRecapError] = useState<string | null>(null);
  const [workshopEnded, setWorkshopEnded] = useState(false);

  useEffect(() => {
    if (!account) return;
    Promise.all([
      getActivity().then((all) => {
        if (all.some((e) => e.type === "workshop_ended")) {
          setWorkshopEnded(true);
        }
        return all.filter((e) => e.address.toLowerCase() === account.address.toLowerCase());
      }),
      getNftsByAddress(account.address),
    ])
      .then(([mine, nftData]) => {
        setEvents(mine);
        setNfts(nftData);
      })
      .finally(() => setLoading(false));
  }, [account]);

  // Poll for workshop_ended
  useEffect(() => {
    if (workshopEnded) return;
    const interval = setInterval(async () => {
      const all = await getActivity();
      if (all.some((e) => e.type === "workshop_ended")) {
        setWorkshopEnded(true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [workshopEnded]);

  if (!account) {
    return (
      <div className="mx-auto max-w-lg text-center space-y-6">
        <h1 className="font-mono-data text-xl font-bold text-[var(--neon-yellow)] tracking-wider">PROFILE_MODULE</h1>
        <p className="font-mono-data text-sm text-gray-500">{">"} auth_required // connect wallet</p>
        <div className="cyber-card glow-yellow p-5">
          <ConnectButton
            client={client}
            wallets={wallets}
            chain={chain}
            connectButton={{ label: "CONNECT_WALLET" }}
          />
        </div>
      </div>
    );
  }

  const transfers = events.filter((e) => e.type === "transfer");
  const hasNFT = nfts.length > 0;

  return (
    <div className="mx-auto max-w-lg space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-[var(--neon-yellow)]" />
        <h1 className="font-mono-data text-xl font-bold text-[var(--neon-yellow)] tracking-wider">PROFILE</h1>
        <span className="font-mono-data text-[10px] text-gray-600 ml-auto">[PROC_04]</span>
      </div>

      {/* Identity card */}
      <div className="cyber-card glow-yellow p-5 text-center">
        <div className="font-mono-data text-4xl mb-3">{hasNFT ? "◆" : "◇"}</div>
        <code className="font-mono-data text-lg text-[var(--neon-yellow)]">{shortenAddr(account.address)}</code>
        <div className="mt-2">
          <a
            href={`${EXPLORER_ADDRESS_URL}${account.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono-data text-[10px] text-gray-500 hover:text-[var(--neon-blue)] transition-colors"
          >
            VIEW_ON_ETHERSCAN
          </a>
        </div>
      </div>

      {/* NFT Collection */}
      {hasNFT && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--neon-green)]" />
            <h2 className="font-mono-data text-sm font-bold text-[var(--neon-green)]">MY_NFTS [{nfts.length}]</h2>
          </div>
          {nfts.map((nft) => {
            const imgSrc = nft.image
              ? nft.image.startsWith("http")
                ? nft.image
                : nft.image.startsWith("/")
                  ? nft.image
                  : undefined
              : undefined;
            const archColor =
              nft.archetype === "hacker" ? "var(--neon-green)" :
              nft.archetype === "sage" ? "var(--neon-blue)" :
              nft.archetype === "pirate" ? "var(--neon-yellow)" :
              nft.archetype === "scientist" ? "var(--neon-pink)" :
              nft.archetype === "glitch" ? "var(--neon-purple)" :
              "var(--neon-green)";
            return (
              <div key={nft.token_id} className="cyber-card p-4 space-y-3" style={{ borderColor: `${archColor}33` }}>
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={nft.name}
                    className="w-full max-w-[280px] mx-auto rounded-lg border object-cover"
                    style={{ borderColor: `${archColor}40` }}
                    onError={(e) => {
                      // Fallback to archetype icon on load error
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : nft.archetype ? (
                  <div className="w-full max-w-[280px] mx-auto h-40 rounded-lg border border-dashed flex items-center justify-center"
                    style={{ borderColor: `${archColor}40` }}>
                    <span className="font-mono-data text-3xl opacity-40">
                      {nft.archetype === "hacker" ? ">" :
                       nft.archetype === "sage" ? "∞" :
                       nft.archetype === "pirate" ? "☠" :
                       nft.archetype === "scientist" ? "⚗" :
                       nft.archetype === "glitch" ? "▓" : "◆"}
                    </span>
                  </div>
                ) : null}

                <div className="text-center space-y-1">
                  <p className="font-mono-data text-sm font-bold text-white">{nft.name}</p>
                  <p className="font-mono-data text-[11px] text-gray-400 max-w-xs mx-auto">{nft.description}</p>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {nft.archetype && (
                    <span className="font-mono-data text-[9px] px-2 py-0.5 rounded border" style={{ color: archColor, borderColor: `${archColor}40` }}>
                      {nft.archetype.toUpperCase()}
                    </span>
                  )}
                  {nft.agent_name && (
                    <span className="font-mono-data text-[9px] text-gray-500 px-2 py-0.5 rounded border border-gray-800">
                      {nft.agent_name}
                    </span>
                  )}
                  {nft.extra_attributes?.special_trait && (
                    <span className="font-mono-data text-[9px] text-[var(--neon-yellow)] px-2 py-0.5 rounded border border-[var(--neon-yellow)]/30">
                      {nft.extra_attributes.special_trait}
                    </span>
                  )}
                  <span className="font-mono-data text-[9px] text-gray-600 px-2 py-0.5 rounded border border-gray-800">
                    #{nft.token_id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "TX_COUNT", value: events.length, color: "text-[var(--neon-blue)]" },
          { label: "TRANSFERS", value: transfers.length, color: "text-[var(--neon-green)]" },
          { label: "NFT_COUNT", value: nfts.length, color: "text-[var(--neon-yellow)]" },
        ].map((stat) => (
          <div key={stat.label} className="cyber-card p-4 text-center">
            <p className={`font-mono-data text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="font-mono-data text-[9px] text-gray-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Oracle's Recap */}
      <div className="cyber-card p-4 space-y-3" style={{ borderColor: "rgba(168,85,247,0.2)" }}>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--neon-purple)]" />
          <h2 className="font-mono-data text-sm font-bold text-[var(--neon-purple)]">ORACLE_ANALYSIS</h2>
        </div>

        {recap ? (
          <div className="space-y-3">
            <div className="text-center">
              <span className="text-3xl">{recap.emoji}</span>
              <p className="font-mono-data text-lg font-bold text-[var(--neon-purple)] mt-1">{recap.title}</p>
            </div>
            <p className="font-mono-data text-xs text-gray-300 text-center leading-relaxed">{recap.description}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {recap.traits.map((trait) => (
                <span
                  key={trait}
                  className="font-mono-data text-[10px] px-2 py-0.5 rounded border border-[var(--neon-purple)]/30 text-[var(--neon-purple)] bg-[var(--neon-purple)]/5"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <p className="font-mono-data text-[10px] text-gray-500">
              {workshopEnded
                ? "Oracle, workshop aktivitelerini analiz edip sana ozel bir karakter karti olusturur."
                : "Egitmen workshop'u bitirince Oracle aktif olacak."}
            </p>
            {recapError && (
              <p className="font-mono-data text-[10px] text-red-400">{recapError}</p>
            )}
            <button
              onClick={async () => {
                if (!account) return;
                setRecapLoading(true);
                setRecapError(null);
                const result = await generateRecap(account.address);
                setRecapLoading(false);
                if (result.recap) {
                  setRecap(result.recap);
                } else {
                  setRecapError(result.error || "Analiz olusturulamadi");
                }
              }}
              disabled={recapLoading || !workshopEnded}
              className="cyber-btn px-4 py-2 font-mono-data text-xs font-bold text-[var(--neon-purple)] border-[var(--neon-purple)]/30 hover:bg-[var(--neon-purple)]/10 disabled:opacity-50"
            >
              {recapLoading ? (
                <span className="animate-pulse">Oracle dusunuyor...</span>
              ) : !workshopEnded ? (
                "BEKLENIYOR..."
              ) : (
                "ANALIZ_ISTE"
              )}
            </button>
          </div>
        )}
      </div>

      {/* TX history */}
      <div className="cyber-card p-4">
        <div className="flex items-center gap-2 mb-3 border-b border-[var(--border-dim)] pb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--neon-green)]" />
          <h2 className="font-mono-data text-sm font-bold text-[var(--neon-green)]">TX_HISTORY</h2>
        </div>
        {loading ? (
          <p className="font-mono-data text-xs text-gray-600 animate-pulse">{">"} loading_...</p>
        ) : events.length === 0 ? (
          <p className="font-mono-data text-xs text-gray-600">{">"} no_transactions_found</p>
        ) : (
          <ul className="space-y-1">
            {events.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between font-mono-data text-xs py-1"
              >
                <span className={
                  e.type === "transfer" ? "text-[var(--neon-green)]" :
                  e.type === "nft_mint" ? "text-[var(--neon-yellow)]" :
                  e.type === "faucet" ? "text-[var(--neon-purple)]" :
                  "text-[var(--neon-blue)]"
                }>
                  [{e.type.toUpperCase()}]
                </span>
                {e.data.txHash && (
                  <a
                    href={`${EXPLORER_TX_URL}${e.data.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-[var(--neon-blue)] transition-colors"
                  >
                    {e.data.txHash.slice(0, 10)}..
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
