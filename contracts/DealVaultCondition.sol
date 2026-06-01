// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAccessGate
 * @notice Minimal interface a DealVault condition can compose with. Any external
 *         contract (escrow, KYC registry, prerequisite-vault tracker, DAO, ...)
 *         implementing this can gate a CDR read, making vaults composable with
 *         arbitrary on-chain logic.
 */
interface IAccessGate {
    /// @return true if `caller` is allowed to read the vault identified by `ruleId`.
    function isOpen(bytes32 ruleId, address caller) external view returns (bool);
}

/**
 * @title DealVaultCondition
 * @notice Programmable CDR read/write condition contract for DealVault.
 *         The CDR validator network calls `checkWriteCondition` /
 *         `checkReadCondition` (view) before accepting a write or releasing
 *         partial decryptions, enabling fully on-chain, dynamic access control.
 *
 * @dev `conditionData` is ABI-encoded as:
 *      (uint8   conditionKind,
 *       address creator,
 *       address[] authorizedWallets,
 *       uint256 expiresAt,        // unix secs, 0 = no expiry
 *       address recipient,
 *       uint256 unlockAt,         // unix secs, 0 = immediately
 *       uint256 threshold,        // multi-sig: required approvals (0 = n/a)
 *       address[] signers,        // multi-sig: eligible approvers
 *       address gate)             // composability: external IAccessGate (0 = none)
 *
 *      conditionKind 0 = DEAL_ROOM : creator or an authorized wallet, before expiry.
 *      conditionKind 1 = DEAD_DROP : only the recipient, only at/after unlockAt.
 *      conditionKind 2 = MULTI_SIG : an authorized reader, but ONLY after `threshold`
 *                                    of the `signers` have approved on-chain.
 *
 *      Any kind may additionally require an external `gate` contract to return
 *      true (multi-step / composable access).
 *
 *      Multi-sig approvals are tracked on-chain keyed by the rule hash, so the
 *      same logic is enforced trustlessly by the validator set — no off-chain
 *      coordinator.
 */
contract DealVaultCondition {
    uint8 private constant KIND_DEAL_ROOM = 0;
    uint8 private constant KIND_DEAD_DROP = 1;
    uint8 private constant KIND_MULTI_SIG = 2;

    error UnknownConditionKind(uint8 conditionKind);
    error NotAnEligibleSigner(address caller);

    event ApprovalRecorded(bytes32 indexed ruleId, address indexed signer, uint256 approvals);

    struct Rule {
        uint8 conditionKind;
        address creator;
        address[] authorizedWallets;
        uint256 expiresAt;
        address recipient;
        uint256 unlockAt;
        uint256 threshold;
        address[] signers;
        address gate;
    }

    /// ruleId => signer => approved?
    mapping(bytes32 => mapping(address => bool)) public hasApproved;
    /// ruleId => approval count
    mapping(bytes32 => uint256) public approvalCount;

    /// @notice Deterministic id for a rule (the hash of its encoded conditionData).
    function ruleId(bytes calldata conditionData) public pure returns (bytes32) {
        return keccak256(conditionData);
    }

    /**
     * @notice A multi-sig signer approves release for the rule encoded in
     *         `conditionData`. Idempotent per signer.
     */
    function approve(bytes calldata conditionData) external {
        Rule memory rule = _decode(conditionData);
        if (!_isSigner(rule, msg.sender)) revert NotAnEligibleSigner(msg.sender);

        bytes32 id = keccak256(conditionData);
        if (!hasApproved[id][msg.sender]) {
            hasApproved[id][msg.sender] = true;
            uint256 count = approvalCount[id] + 1;
            approvalCount[id] = count;
            emit ApprovalRecorded(id, msg.sender, count);
        }
    }

    /// @notice How many approvals a rule currently has.
    function approvalsFor(bytes calldata conditionData) external view returns (uint256) {
        return approvalCount[keccak256(conditionData)];
    }

    // --- CDR hooks -------------------------------------------------------

    function checkWriteCondition(
        address caller,
        bytes calldata conditionData,
        bytes calldata
    ) external pure returns (bool) {
        Rule memory rule = _decode(conditionData);
        // Only the creator may write/seal a vault, regardless of kind.
        return caller == rule.creator;
    }

    function checkReadCondition(
        address caller,
        bytes calldata conditionData,
        bytes calldata
    ) external view returns (bool) {
        Rule memory rule = _decode(conditionData);

        // Optional composability gate applies to every kind.
        if (rule.gate != address(0)) {
            if (!IAccessGate(rule.gate).isOpen(keccak256(conditionData), caller)) {
                return false;
            }
        }

        if (rule.conditionKind == KIND_DEAL_ROOM) {
            return _readDealRoom(rule, caller);
        }

        if (rule.conditionKind == KIND_DEAD_DROP) {
            return caller == rule.recipient && block.timestamp >= rule.unlockAt;
        }

        if (rule.conditionKind == KIND_MULTI_SIG) {
            // Must be an authorized reader AND the signer threshold must be met.
            if (rule.expiresAt != 0 && block.timestamp > rule.expiresAt) {
                return false;
            }
            if (approvalCount[keccak256(conditionData)] < rule.threshold) {
                return false;
            }
            return _isAuthorizedReader(rule, caller);
        }

        revert UnknownConditionKind(rule.conditionKind);
    }

    // --- internal --------------------------------------------------------

    function _readDealRoom(Rule memory rule, address caller) private view returns (bool) {
        if (rule.expiresAt != 0 && block.timestamp > rule.expiresAt) {
            return false;
        }
        return _isAuthorizedReader(rule, caller);
    }

    function _isAuthorizedReader(Rule memory rule, address caller) private pure returns (bool) {
        if (caller == rule.creator) return true;
        for (uint256 i = 0; i < rule.authorizedWallets.length; i++) {
            if (caller == rule.authorizedWallets[i]) return true;
        }
        return false;
    }

    function _isSigner(Rule memory rule, address account) private pure returns (bool) {
        for (uint256 i = 0; i < rule.signers.length; i++) {
            if (account == rule.signers[i]) return true;
        }
        return false;
    }

    function _decode(bytes calldata conditionData) private pure returns (Rule memory rule) {
        (
            rule.conditionKind,
            rule.creator,
            rule.authorizedWallets,
            rule.expiresAt,
            rule.recipient,
            rule.unlockAt,
            rule.threshold,
            rule.signers,
            rule.gate
        ) = abi.decode(
            conditionData,
            (uint8, address, address[], uint256, address, uint256, uint256, address[], address)
        );
    }
}
