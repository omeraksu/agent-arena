import { expect } from "chai";
import { ethers } from "hardhat";
import { WorkshopNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("WorkshopNFT", function () {
  let nft: WorkshopNFT;
  let owner: SignerWithAddress;
  let other: SignerWithAddress;

  beforeEach(async function () {
    [owner, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("WorkshopNFT");
    nft = await Factory.deploy("https://example.com/metadata/");
    await nft.waitForDeployment();
  });

  it("should deploy with correct name and symbol", async function () {
    expect(await nft.name()).to.equal("Agent Arena Workshop");
    expect(await nft.symbol()).to.equal("ARENA");
  });

  it("should allow owner to mint", async function () {
    await nft.mintTo(other.address);
    expect(await nft.ownerOf(0)).to.equal(other.address);
    expect(await nft.totalSupply()).to.equal(1);
  });

  it("should reject mint from non-owner", async function () {
    await expect(
      nft.connect(other).mintTo(other.address)
    ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
  });

  it("should increment totalSupply on each mint", async function () {
    await nft.mintTo(owner.address);
    await nft.mintTo(other.address);
    expect(await nft.totalSupply()).to.equal(2);
  });

  it("should allow owner to set baseURI", async function () {
    await nft.setBaseURI("https://new-uri.com/");
    await nft.mintTo(owner.address);
    expect(await nft.tokenURI(0)).to.equal("https://new-uri.com/0");
  });
});
