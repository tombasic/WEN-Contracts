// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CommunityToken is ERC20, Ownable {
    uint256 private _cap;
    bool public whitelistEnabled;
    mapping(address => bool) public whitelist;

    event WhitelistUpdate(address account, bool enabled);

    constructor(uint256 cap_, string memory name_, string memory symbol_) ERC20(name_, symbol_) public {
        require(cap_ > 0, "ERC20Capped: cap is 0");
        _cap = cap_;
    }

    /**
     * @dev Returns the cap on the token's total supply.
     */
    function cap() public view returns (uint256) {
        return _cap;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    function updateWhitelist(address to, bool flag) public onlyOwner {
        whitelist[to] = flag;

        emit WhitelistUpdate(to, flag);
    }

    function toggleWhitelist() external onlyOwner {
        whitelistEnabled = !whitelistEnabled;
    }

    /**
     * @dev See {ERC20-_beforeTokenTransfer}.
     *
     * Requirements:
     *
     * - minted tokens must not cause the total supply to go over the cap.
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

        if (from == address(0)) { // When minting tokens
            require(totalSupply() + amount <= _cap, "ERC20Capped: cap exceeded");
            return;
        }

        if (to == address(0)) { // when burning tokens
            return;
        }

        if (whitelistEnabled) { // normal operations
            require(whitelist[from], "Only whitelist account are allowed to transfer token");
        }
    }
}