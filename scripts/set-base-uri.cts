import { ethers } from "hardhat";

const WORKSHOP_NFT_ABI = [
  "function setBaseURI(string memory baseURI) external",
  "function owner() external view returns (address)",
];

async function main() {
  const contractAddress = process.env.NFT_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("NFT_CONTRACT_ADDRESS env var is required");
  }

  const baseURI = process.env.NFT_BASE_URI;
  if (!baseURI) {
    throw new Error("NFT_BASE_URI env var is required (e.g. https://agent-arena.vercel.app/api/metadata/)");
  }

  const [signer] = await ethers.getSigners();
  const contract = new ethers.Contract(contractAddress, WORKSHOP_NFT_ABI, signer);

  console.log(`Setting baseURI to: ${baseURI}`);
  console.log(`Contract: ${contractAddress}`);
  console.log(`Signer: ${signer.address}`);

  const tx = await contract.setBaseURI(baseURI);
  console.log(`TX hash: ${tx.hash}`);
  await tx.wait();
  console.log("baseURI updated successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
