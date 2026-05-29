// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DealRoom.sol";

/**
 * @title DealRoomFactory
 * @notice Factory contract for creating and managing DealRoom instances
 * @dev Implements advanced access control patterns for CDR Hackathon
 */
contract DealRoomFactory {
    // Events
    event DealRoomCreated(
        uint256 indexed dealRoomId,
        address indexed creator,
        address dealRoomAddress,
        DealRoomType dealType
    );
    
    event DealRoomCompleted(uint256 indexed dealRoomId, uint256 completedAt);
    event DealRoomRevoked(uint256 indexed dealRoomId, address indexed revoker);
    
    // Enums
    enum DealRoomType { MA, FUNDRAISING, PARTNERSHIP, CUSTOM }
    enum DealStatus { ACTIVE, COMPLETED, REVOKED, EXPIRED }
    
    // Structs
    struct DealRoomInfo {
        uint256 id;
        address dealRoomAddress;
        address creator;
        DealRoomType dealType;
        DealStatus status;
        uint256 createdAt;
        uint256 expiresAt;
        string metadataURI;
    }
    
    // State variables
    uint256 public dealRoomCounter;
    mapping(uint256 => DealRoomInfo) public dealRooms;
    mapping(address => uint256[]) public userDealRooms;
    
    // Modifiers
    modifier onlyDealRoomCreator(uint256 dealRoomId) {
        require(
            dealRooms[dealRoomId].creator == msg.sender,
            "Not deal room creator"
        );
        _;
    }
    
    /**
     * @notice Create a new deal room with advanced access control
     * @param dealType Type of deal (M&A, Fundraising, etc.)
     * @param authorizedParties Addresses allowed to access the deal room
     * @param expiryDuration How long the deal room remains active (in seconds)
     * @param metadataURI IPFS URI containing deal room metadata
     * @return dealRoomId The ID of the newly created deal room
     */
    function createDealRoom(
        DealRoomType dealType,
        address[] memory authorizedParties,
        uint256 expiryDuration,
        string memory metadataURI
    ) external returns (uint256 dealRoomId) {
        dealRoomId = ++dealRoomCounter;
        
        // Deploy new DealRoom contract
        DealRoom newDealRoom = new DealRoom(
            msg.sender,
            authorizedParties,
            block.timestamp + expiryDuration
        );
        
        // Store deal room info
        dealRooms[dealRoomId] = DealRoomInfo({
            id: dealRoomId,
            dealRoomAddress: address(newDealRoom),
            creator: msg.sender,
            dealType: dealType,
            status: DealStatus.ACTIVE,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + expiryDuration,
            metadataURI: metadataURI
        });
        
        // Track user's deal rooms
        userDealRooms[msg.sender].push(dealRoomId);
        
        emit DealRoomCreated(dealRoomId, msg.sender, address(newDealRoom), dealType);
    }
    
    /**
     * @notice Mark a deal room as completed
     * @param dealRoomId The ID of the deal room to complete
     */
    function completeDealRoom(uint256 dealRoomId) 
        external 
        onlyDealRoomCreator(dealRoomId) 
    {
        require(
            dealRooms[dealRoomId].status == DealStatus.ACTIVE,
            "Deal room not active"
        );
        
        dealRooms[dealRoomId].status = DealStatus.COMPLETED;
        emit DealRoomCompleted(dealRoomId, block.timestamp);
    }
    
    /**
     * @notice Revoke access to a deal room (emergency kill switch)
     * @param dealRoomId The ID of the deal room to revoke
     */
    function revokeDealRoom(uint256 dealRoomId) 
        external 
        onlyDealRoomCreator(dealRoomId) 
    {
        require(
            dealRooms[dealRoomId].status == DealStatus.ACTIVE,
            "Deal room not active"
        );
        
        dealRooms[dealRoomId].status = DealStatus.REVOKED;
        
        // Revoke access in the DealRoom contract
        DealRoom dealRoom = DealRoom(dealRooms[dealRoomId].dealRoomAddress);
        dealRoom.revokeAllAccess();
        
        emit DealRoomRevoked(dealRoomId, msg.sender);
    }
    
    /**
     * @notice Get all deal rooms created by a user
     * @param user The address of the user
     * @return Array of deal room IDs
     */
    function getUserDealRooms(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userDealRooms[user];
    }
    
    /**
     * @notice Get detailed info about a deal room
     * @param dealRoomId The ID of the deal room
     * @return DealRoomInfo struct with all details
     */
    function getDealRoomInfo(uint256 dealRoomId) 
        external 
        view 
        returns (DealRoomInfo memory) 
    {
        return dealRooms[dealRoomId];
    }
    
    /**
     * @notice Check if a deal room is still active
     * @param dealRoomId The ID of the deal room
     * @return bool True if active, false otherwise
     */
    function isDealRoomActive(uint256 dealRoomId) 
        external 
        view 
        returns (bool) 
    {
        DealRoomInfo memory info = dealRooms[dealRoomId];
        
        if (info.status != DealStatus.ACTIVE) {
            return false;
        }
        
        if (block.timestamp > info.expiresAt) {
            return false;
        }
        
        return true;
    }
}
