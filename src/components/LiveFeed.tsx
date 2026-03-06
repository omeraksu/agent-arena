import { useEffect, useState } from "react";
import { getActivity, getAllNames, type ActivityEvent, type ArenaName } from "@/lib/api";
import { POLL_INTERVAL } from "@/config/constants";

function timestamp(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function LiveFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [nameMap, setNameMap] = useState<Map<string, string>>(new Map());

  // Load names
  useEffect(() => {
    async function loadNames() {
      const names = await getAllNames();
      const map = new Map<string, string>();
      names.forEach((n: ArenaName) => map.set(n.address.toLowerCase(), n.username));
      setNameMap(map);
    }
    loadNames();
    const interval = setInterval(loadNames, POLL_INTERVAL * 5); // Refresh names less frequently
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const data = await getActivity();
        if (active) setEvents(data);
      } catch {
        // ignore polling errors
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  function displayAddr(addr: string): string {
    const name = nameMap.get(addr.toLowerCase());
    if (name) return `${name}.arena`;
    return addr.slice(0, 6) + ".." + addr.slice(-4);
  }

  const EVENT_CONFIG: Record<string, { tag: string; color: string; msg: (e: ActivityEvent) => string }> = {
    wallet_created: {
      tag: "INIT",
      color: "text-cyan-400",
      msg: (e) => `wallet_create(${displayAddr(e.address)}) => OK`,
    },
    transfer: {
      tag: "TX",
      color: "text-green-400",
      msg: (e) => {
        const toDisplay = e.data.toName
          ? `${e.data.toName}.arena`
          : displayAddr(e.data.to || "?");
        return `transfer(${displayAddr(e.address)} => ${toDisplay}, ${e.data.amount || "?"} ETH)`;
      },
    },
    nft_mint: {
      tag: "MINT",
      color: "text-yellow-400",
      msg: (e) => `nft_mint(${displayAddr(e.address)}) => NFT_ACQUIRED!`,
    },
    faucet: {
      tag: "FAUCET",
      color: "text-purple-400",
      msg: (e) => `faucet_drip(${displayAddr(e.address)}) => 0.005 ETH`,
    },
    transfer_request: {
      tag: "REQ",
      color: "text-fuchsia-400",
      msg: (e) => {
        const fromDisplay = e.data.fromName
          ? `${e.data.fromName}.arena`
          : displayAddr(e.address);
        const toDisplay = e.data.toName
          ? `${e.data.toName}.arena`
          : displayAddr(e.data.toAddress || "?");
        return `request(${fromDisplay} => ${toDisplay}, ${e.data.amount || "?"} ETH)`;
      },
    },
    transfer_request_accepted: {
      tag: "ACCEPT",
      color: "text-emerald-400",
      msg: (e) => {
        const toDisplay = e.data.toName
          ? `${e.data.toName}.arena`
          : displayAddr(e.data.toAddress || "?");
        const fromDisplay = e.data.fromName
          ? `${e.data.fromName}.arena`
          : displayAddr(e.data.fromAddress || "?");
        return `accept_request(${displayAddr(e.address)} => ${fromDisplay}, ${e.data.amount || "?"} ETH)`;
      },
    },
    agent_registered: {
      tag: "AGENT",
      color: "text-pink-400",
      msg: (e) => {
        const ownerDisplay = e.data.ownerName
          ? `${e.data.ownerName}.arena`
          : displayAddr(e.address);
        return `agent_deploy(${e.data.agentName || "?"} by ${ownerDisplay}) => ONLINE`;
      },
    },
    agent_message: {
      tag: "MSG",
      color: "text-orange-400",
      msg: (e) => `agent_msg(${e.data.fromAgent || "?"} => ${e.data.toAgent || "?"})`,
    },
  };

  return (
    <div className="h-full font-mono-data text-[11px] overflow-y-auto custom-scrollbar">
      {events.length === 0 ? (
        <div>
          <p className="text-green-700">{">"} awaiting_events...</p>
          <span className="inline-block w-2 h-3.5 bg-green-500 animate-pulse" />
        </div>
      ) : (
        <ul className="space-y-1">
          {events.map((event) => {
            const config = EVENT_CONFIG[event.type] || {
              tag: "LOG",
              color: "text-gray-400",
              msg: () => `event(${displayAddr(event.address)})`,
            };
            return (
              <li key={event.id} className="leading-relaxed">
                <span className="text-green-800">[{timestamp(event.created_at)}]</span>{" "}
                <span className={`font-bold ${config.color}`}>[{config.tag}]</span>{" "}
                <span className="text-green-300">{config.msg(event)}</span>
              </li>
            );
          })}
          {/* Blinking cursor */}
          <li>
            <span className="text-green-700">{">"}</span>{" "}
            <span className="inline-block w-2 h-3.5 bg-green-500 animate-pulse" />
          </li>
        </ul>
      )}
    </div>
  );
}
