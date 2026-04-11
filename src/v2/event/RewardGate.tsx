/**
 * RewardGate — NFT claim screen after persuasion %70+.
 *
 * Figma: RewardGate (85:104)
 *
 * Yapı:
 *   - [MISSION_COMPLETE] terminal header
 *   - PERSUASION_SCORE card (92% PASSED) + rainbow gradient bar
 *   - // NFT_REWARD section + big NFT preview card (amber border)
 *   - // CLAIM_NFT section + description
 *   - CLAIM NFT amber outline primary
 *   - "> thirdweb wallet'ta kal" footnote
 *   - Builder Hub kaydol link card
 */
import { Link, useNavigate } from "react-router-dom";
import { useActiveAccount } from "thirdweb/react";
import { SkipGate } from "../../components/ui";
import { useEventFlow } from "./EventFlowProvider";
import { cn } from "../../lib/cn";

// ─── NFT preview (ARIA #0042) ──────────────────────────────────────────

function NFTPreview() {
  return (
    <div className="mx-auto w-[180px] aspect-square relative">
      {/* Corner brackets */}
      <span className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-arena-amber" aria-hidden />
      <span className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-arena-amber" aria-hidden />
      <span className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-arena-amber" aria-hidden />
      <span className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-arena-amber" aria-hidden />
      {/* Content */}
      <div className="absolute inset-3 flex flex-col items-center justify-center gap-2 rounded-sm bg-arena-bg-deep border border-arena-amber/30">
        <span className="font-mono text-5xl font-bold text-arena-amber" aria-hidden>
          &gt;_&lt;
        </span>
        <span className="font-mono text-[10px] font-bold tracking-wider text-arena-amber">
          ARIA #0042
        </span>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────

export default function RewardGate() {
  const { goNext } = useEventFlow();
  const account = useActiveAccount();
  const navigate = useNavigate();

  const handleClaim = () => {
    if (!account) {
      // Cüzdan yok — legacy wallet route'u üzerinden connect
      navigate("/wallet");
      return;
    }
    // Cüzdan bağlıysa NFTCelebration'a geç
    goNext();
  };

  return (
    <div className="flex flex-col gap-7 pt-12 pb-8">
      {/* Terminal header */}
      <section className="font-mono text-[11px] leading-relaxed px-2">
        <div className="text-arena-amber font-bold">[MISSION_COMPLETE]</div>
        <div className="text-arena-text-secondary mt-1">&gt; ödülün hazır.</div>
      </section>

      {/* Persuasion score card */}
      <section className="mx-2 p-4 rounded-sm border border-arena-teal/40 bg-arena-bg-surface/60">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] tracking-wider text-arena-text-tertiary">
            PERSUASION_SCORE
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[44px] leading-none font-black tabular-nums text-arena-teal">
            92%
          </span>
          <span className="font-mono text-[11px] font-bold tracking-wider text-arena-teal">
            PASSED ✓
          </span>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-arena-bg-elevated overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-arena-purple via-arena-amber to-arena-teal"
            style={{ width: "92%" }}
          />
        </div>
      </section>

      {/* NFT reward */}
      <section className="mx-2">
        <div className="font-mono text-[10px] tracking-wider text-arena-text-tertiary mb-3">
          // NFT_REWARD
        </div>
        <NFTPreview />
      </section>

      {/* Claim section */}
      <section className="mx-2">
        <div className="font-mono text-[10px] tracking-wider text-arena-text-tertiary mb-3">
          // CLAIM_NFT
        </div>
        <p className="text-[15px] text-arena-text-primary leading-relaxed">
          NFT&apos;ni almak için Core Wallet bağla.
        </p>
        <p className="font-mono text-[10px] text-arena-text-tertiary mt-1">
          30 saniyede oluştur, gasless.
        </p>

        <button
          type="button"
          onClick={handleClaim}
          className={cn(
            "mt-4 inline-flex items-center h-10 px-6 rounded-sm border-2",
            "border-arena-amber text-arena-amber font-mono text-[12px] font-bold tracking-wider",
            "hover:bg-arena-amber/15 transition-colors",
          )}
        >
          CLAIM NFT
        </button>

        <div className="mt-3 font-mono text-[10px] text-arena-text-tertiary">
          &gt; thirdweb wallet&apos;ta kal (NFT gelmez)
        </div>
      </section>

      {/* Builder Hub external card */}
      <section className="mx-2">
        <a
          href="https://build.avax.network"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between p-3 rounded-sm border border-arena-blue/40 bg-arena-bg-surface/40 hover:border-arena-blue/80 transition-colors"
        >
          <span className="font-mono text-[11px] font-bold text-arena-blue">
            &gt; Builder Hub&apos;a kaydol
          </span>
          <span className="font-mono text-[9px] text-arena-text-tertiary">
            build.avax.network
          </span>
        </a>
      </section>

      <SkipGate onSkip={goNext} label="[dev] skip → celebration" />
    </div>
  );
}
