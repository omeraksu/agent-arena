import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";

const RPC_URL = "https://api.avax-test.network/ext/bc/C/rpc";

export const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(RPC_URL),
});

export function getWalletClient(privateKey: string) {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  return createWalletClient({
    account,
    chain: avalancheFuji,
    transport: http(RPC_URL),
  });
}
