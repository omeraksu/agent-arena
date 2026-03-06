import { getContract } from "thirdweb";
import { client, chain } from "./thirdweb";

export function getWorkshopNFTContract(address: string) {
  return getContract({
    client,
    chain,
    address,
  });
}
