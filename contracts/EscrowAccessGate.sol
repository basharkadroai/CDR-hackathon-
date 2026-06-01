// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EscrowAccessGate
 * @notice Example composability gate for DealVault CDR conditions. Demonstrates
 *         "composable vault systems interacting with other contracts": a CDR
 *         read condition (DealVaultCondition) can require this external contract
 *         to return true before the validator set releases partial decryptions.
 *
 *         Here, a buyer funds escrow against a vault's ruleId; the vault's data
 *         only becomes readable once escrow is funded (pay → unlock). Real
 *         trustless data exchange using a CDR vault gated by on-chain payment.
 *
 *         Implements the IAccessGate interface consumed by DealVaultCondition:
 *           function isOpen(bytes32 ruleId, address caller) view returns (bool)
 */
contract EscrowAccessGate {
    struct Deal {
        address seller;     // who set up the vault / receives funds
        address buyer;      // who must pay to unlock (address(0) = anyone may pay)
        uint256 price;      // wei of native IP required
        bool funded;        // set true once paid
        address payer;      // who actually paid (gains read access)
    }

    /// ruleId => deal terms
    mapping(bytes32 => Deal) public deals;

    event DealListed(bytes32 indexed ruleId, address indexed seller, uint256 price);
    event DealFunded(bytes32 indexed ruleId, address indexed payer, uint256 amount);

    error AlreadyListed();
    error NotListed();
    error WrongBuyer();
    error WrongPrice();
    error AlreadyFunded();
    error TransferFailed();

    /// @notice Seller lists a vault (by its CDR ruleId) for sale at `price`.
    function list(bytes32 ruleId, address buyer, uint256 price) external {
        if (deals[ruleId].seller != address(0)) revert AlreadyListed();
        deals[ruleId] = Deal({
            seller: msg.sender,
            buyer: buyer,
            price: price,
            funded: false,
            payer: address(0)
        });
        emit DealListed(ruleId, msg.sender, price);
    }

    /// @notice Buyer pays the listed price; funds forward to the seller and the
    ///         payer gains read access via `isOpen`.
    function fund(bytes32 ruleId) external payable {
        Deal storage deal = deals[ruleId];
        if (deal.seller == address(0)) revert NotListed();
        if (deal.funded) revert AlreadyFunded();
        if (deal.buyer != address(0) && msg.sender != deal.buyer) revert WrongBuyer();
        if (msg.value != deal.price) revert WrongPrice();

        deal.funded = true;
        deal.payer = msg.sender;

        (bool ok, ) = deal.seller.call{value: msg.value}('');
        if (!ok) revert TransferFailed();

        emit DealFunded(ruleId, msg.sender, msg.value);
    }

    /// @notice IAccessGate hook called by DealVaultCondition during a CDR read.
    ///         Open only after funding, and only to the payer (and seller).
    function isOpen(bytes32 ruleId, address caller) external view returns (bool) {
        Deal storage deal = deals[ruleId];
        if (!deal.funded) return false;
        return caller == deal.payer || caller == deal.seller;
    }
}
