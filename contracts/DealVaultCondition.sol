// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DealVaultCondition
 * @notice CDR read/write condition contract for DealVault hackathon vaults.
 * @dev The CDR network calls these view functions before accepting writes or
 *      releasing partial decryptions. `conditionData` is ABI encoded as:
 *      (uint8 conditionKind, address creator, address[] authorizedWallets,
 *       uint256 expiresAt, address recipient, uint256 unlockAt)
 *
 *      conditionKind 0 = Deal Room: creator or authorized wallet before expiry.
 *      conditionKind 1 = Dead Drop: creator may write; recipient can read only
 *      at/after unlockAt. Creator is intentionally not granted read access after
 *      sealing unless they are also the recipient.
 */
contract DealVaultCondition {
    uint8 private constant KIND_DEAL_ROOM = 0;
    uint8 private constant KIND_DEAD_DROP = 1;

    error UnknownConditionKind(uint8 conditionKind);

    struct Rule {
        uint8 conditionKind;
        address creator;
        address[] authorizedWallets;
        uint256 expiresAt;
        address recipient;
        uint256 unlockAt;
    }

    function checkWriteCondition(
        address caller,
        bytes calldata conditionData,
        bytes calldata
    ) external pure returns (bool) {
        Rule memory rule = _decode(conditionData);
        return caller == rule.creator;
    }

    function checkReadCondition(
        address caller,
        bytes calldata conditionData,
        bytes calldata
    ) external view returns (bool) {
        Rule memory rule = _decode(conditionData);

        if (rule.conditionKind == KIND_DEAL_ROOM) {
            if (rule.expiresAt != 0 && block.timestamp > rule.expiresAt) {
                return false;
            }

            if (caller == rule.creator) {
                return true;
            }

            for (uint256 i = 0; i < rule.authorizedWallets.length; i++) {
                if (caller == rule.authorizedWallets[i]) {
                    return true;
                }
            }

            return false;
        }

        if (rule.conditionKind == KIND_DEAD_DROP) {
            return caller == rule.recipient && block.timestamp >= rule.unlockAt;
        }

        revert UnknownConditionKind(rule.conditionKind);
    }

    function _decode(bytes calldata conditionData) private pure returns (Rule memory rule) {
        (
            rule.conditionKind,
            rule.creator,
            rule.authorizedWallets,
            rule.expiresAt,
            rule.recipient,
            rule.unlockAt
        ) = abi.decode(conditionData, (uint8, address, address[], uint256, address, uint256));
    }
}
