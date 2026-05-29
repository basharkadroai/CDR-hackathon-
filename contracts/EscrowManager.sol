// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EscrowManager
 * @notice Smart escrow that releases funds when deal conditions are met
 * @dev Integrates with DealRoom for automatic fund release
 */
contract EscrowManager {
    // Events
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 dealRoomId
    );
    
    event FundsDeposited(uint256 indexed escrowId, address indexed depositor, uint256 amount);
    event FundsReleased(uint256 indexed escrowId, address indexed recipient, uint256 amount);
    event EscrowRefunded(uint256 indexed escrowId, address indexed buyer, uint256 amount);
    event EscrowCancelled(uint256 indexed escrowId);
    
    // Enums
    enum EscrowStatus { PENDING, FUNDED, COMPLETED, REFUNDED, CANCELLED }
    
    // Structs
    struct Escrow {
        uint256 id;
        address buyer;
        address seller;
        uint256 amount;
        uint256 dealRoomId;
        EscrowStatus status;
        uint256 createdAt;
        uint256 releaseConditionMet;
        bool autoRelease;
    }
    
    // State variables
    uint256 public escrowCounter;
    mapping(uint256 => Escrow) public escrows;
    mapping(uint256 => uint256) public dealRoomToEscrow; // dealRoomId => escrowId
    
    address public dealRoomFactory;
    
    // Modifiers
    modifier onlyBuyer(uint256 escrowId) {
        require(escrows[escrowId].buyer == msg.sender, "Only buyer");
        _;
    }
    
    modifier onlySeller(uint256 escrowId) {
        require(escrows[escrowId].seller == msg.sender, "Only seller");
        _;
    }
    
    constructor(address _dealRoomFactory) {
        dealRoomFactory = _dealRoomFactory;
    }
    
    /**
     * @notice Create an escrow for a deal room
     * @param seller The seller's address
     * @param dealRoomId The associated deal room ID
     * @param autoRelease Whether to auto-release when conditions are met
     * @return escrowId The ID of the created escrow
     */
    function createEscrow(
        address seller,
        uint256 dealRoomId,
        bool autoRelease
    ) external payable returns (uint256 escrowId) {
        require(msg.value > 0, "Must deposit funds");
        require(seller != address(0), "Invalid seller");
        
        escrowId = ++escrowCounter;
        
        escrows[escrowId] = Escrow({
            id: escrowId,
            buyer: msg.sender,
            seller: seller,
            amount: msg.value,
            dealRoomId: dealRoomId,
            status: EscrowStatus.FUNDED,
            createdAt: block.timestamp,
            releaseConditionMet: 0,
            autoRelease: autoRelease
        });
        
        dealRoomToEscrow[dealRoomId] = escrowId;
        
        emit EscrowCreated(escrowId, msg.sender, seller, msg.value, dealRoomId);
        emit FundsDeposited(escrowId, msg.sender, msg.value);
    }
    
    /**
     * @notice Mark release condition as met (called by oracle or authorized party)
     * @param escrowId The escrow ID
     */
    function markConditionMet(uint256 escrowId) external {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.FUNDED, "Escrow not funded");
        require(
            msg.sender == escrow.buyer || msg.sender == escrow.seller,
            "Not authorized"
        );
        
        escrow.releaseConditionMet = block.timestamp;
        
        // Auto-release if enabled
        if (escrow.autoRelease) {
            _releaseFunds(escrowId);
        }
    }
    
    /**
     * @notice Release funds to seller
     * @param escrowId The escrow ID
     */
    function releaseFunds(uint256 escrowId) external onlyBuyer(escrowId) {
        _releaseFunds(escrowId);
    }
    
    /**
     * @notice Internal function to release funds
     * @param escrowId The escrow ID
     */
    function _releaseFunds(uint256 escrowId) internal {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.FUNDED, "Escrow not funded");
        
        escrow.status = EscrowStatus.COMPLETED;
        
        // Transfer funds to seller
        (bool success, ) = escrow.seller.call{value: escrow.amount}("");
        require(success, "Transfer failed");
        
        emit FundsReleased(escrowId, escrow.seller, escrow.amount);
    }
    
    /**
     * @notice Refund buyer if deal falls through
     * @param escrowId The escrow ID
     */
    function refundBuyer(uint256 escrowId) external {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.FUNDED, "Escrow not funded");
        require(
            msg.sender == escrow.buyer || msg.sender == escrow.seller,
            "Not authorized"
        );
        
        escrow.status = EscrowStatus.REFUNDED;
        
        // Transfer funds back to buyer
        (bool success, ) = escrow.buyer.call{value: escrow.amount}("");
        require(success, "Refund failed");
        
        emit EscrowRefunded(escrowId, escrow.buyer, escrow.amount);
    }
    
    /**
     * @notice Cancel escrow (only if not funded)
     * @param escrowId The escrow ID
     */
    function cancelEscrow(uint256 escrowId) external onlyBuyer(escrowId) {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.PENDING, "Cannot cancel funded escrow");
        
        escrow.status = EscrowStatus.CANCELLED;
        emit EscrowCancelled(escrowId);
    }
    
    /**
     * @notice Get escrow details
     * @param escrowId The escrow ID
     * @return Escrow struct
     */
    function getEscrow(uint256 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }
    
    /**
     * @notice Get escrow by deal room ID
     * @param dealRoomId The deal room ID
     * @return Escrow struct
     */
    function getEscrowByDealRoom(uint256 dealRoomId) 
        external 
        view 
        returns (Escrow memory) 
    {
        uint256 escrowId = dealRoomToEscrow[dealRoomId];
        return escrows[escrowId];
    }
}
