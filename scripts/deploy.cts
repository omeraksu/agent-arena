import { ethers } from "hardhat";

async function main() {
  const baseURI = process.env.NFT_BASE_URI ?? "";

  const WorkshopNFT = await ethers.getContractFactory("WorkshopNFT");
  const nft = await WorkshopNFT.deploy(baseURI);
  await nft.waitForDeployment();

  const address = await nft.getAddress();
  console.log(`WorkshopNFT deployed to: ${address}`);
  console.log(`Set NFT_CONTRACT_ADDRESS=${address} in your .env`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
