import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";

const RPC_URL = "https://api.avax-test.network/ext/bc/C/rpc";

export const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(RPC_URL),
});

export function getWalletClient(privateKey: string) {
  // Strip quotes, whitespace, and ensure 0x prefix
  const cleaned = privateKey.replace(/['"\\s\r\n]+/g, "").trim();
  const key = cleaned.startsWith("0x") ? cleaned : `0x${cleaned}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(`invalid private key, length=${key.length}, starts=${key.slice(0, 6)}`);
  }
  const account = privateKeyToAccount(key as `0x${string}`);
  return createWalletClient({
    account,
    chain: avalancheFuji,
    transport: http(RPC_URL),
  });
}
