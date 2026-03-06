// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WorkshopNFT is ERC721, Ownable {
    uint256 private _nextTokenId;
    string private _baseTokenURI;

    constructor(string memory baseURI) ERC721("Agent Arena Workshop", "ARENA") Ownable(msg.sender) {
        _baseTokenURI = baseURI;
    }

    function mintTo(address to) external onlyOwner {
        _safeMint(to, _nextTokenId);
        _nextTokenId++;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }
}
