// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DealRoom
 * @notice Individual deal room with multi-sig and conditional access control
 * @dev Implements advanced CDR access patterns for hackathon technical track
 */
contract DealRoom {
    // Events
    event DocumentAdded(uint256 indexed documentId, string cdrVaultId, address indexed uploader);
    event DocumentAccessed(uint256 indexed documentId, address indexed accessor, uint256 timestamp);
    event SignatureAdded(uint256 indexed documentId, address indexed signer);
    event AccessRevoked(address indexed party);
    event ConditionalAccessSet(uint256 indexed documentId, uint256 requiredDocumentId);
    
    // Structs
    struct Document {
        uint256 id;
        string cdrVaultId;      // CDR vault identifier
        string dataUrl;          // Encrypted data location
        address uploader;
        uint256 uploadedAt;
        uint256 accessCount;
        bool requiresMultiSig;
        uint256 requiredSignatures;
        uint256 currentSignatures;
        mapping(address => bool) hasSigned;
        uint256 conditionalDocumentId; // Must access this doc first (0 = no condition)
    }
    
    struct AccessLog {
        address accessor;
        uint256 timestamp;
        uint256 documentId;
    }
    
    // State variables
    address public creator;
    uint256 public expiresAt;
    bool public isRevoked;
    
    mapping(address => bool) public authorizedParties;
    mapping(uint256 => Document) public documents;
    uint256 public documentCounter;
    
    AccessLog[] public accessLogs;
    address[] public authorizedPartiesList;
    
    // Modifiers
    modifier onlyCreator() {
        require(msg.sender == creator, "Only creator");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedParties[msg.sender] || msg.sender == creator, "Not authorized");
        _;
    }
    
    modifier notRevoked() {
        require(!isRevoked, "Access revoked");
        _;
    }
    
    modifier notExpired() {
        require(block.timestamp <= expiresAt, "Deal room expired");
        _;
    }
    
    constructor(
        address _creator,
        address[] memory _authorizedParties,
        uint256 _expiresAt
    ) {
        creator = _creator;
        expiresAt = _expiresAt;
        
        // Add creator as authorized
        authorizedParties[_creator] = true;
        authorizedPartiesList.push(_creator);
        
        // Add other authorized parties
        for (uint256 i = 0; i < _authorizedParties.length; i++) {
            authorizedParties[_authorizedParties[i]] = true;
            authorizedPartiesList.push(_authorizedParties[i]);
        }
    }
    
    /**
     * @notice Add a document to the deal room
     * @param cdrVaultId The CDR vault identifier
     * @param dataUrl The encrypted data URL
     * @param requiresMultiSig Whether multi-sig approval is required
     * @param requiredSignatures Number of signatures needed (if multi-sig)
     * @return documentId The ID of the added document
     */
    function addDocument(
        string memory cdrVaultId,
        string memory dataUrl,
        bool requiresMultiSig,
        uint256 requiredSignatures
    ) external onlyAuthorized notRevoked returns (uint256 documentId) {
        documentId = ++documentCounter;
        
        Document storage doc = documents[documentId];
        doc.id = documentId;
        doc.cdrVaultId = cdrVaultId;
        doc.dataUrl = dataUrl;
        doc.uploader = msg.sender;
        doc.uploadedAt = block.timestamp;
        doc.requiresMultiSig = requiresMultiSig;
        doc.requiredSignatures = requiredSignatures;
        doc.conditionalDocumentId = 0;
        
        emit DocumentAdded(documentId, cdrVaultId, msg.sender);
    }
    
    /**
     * @notice Set conditional access (must access doc A before doc B)
     * @param documentId The document to set condition on
     * @param requiredDocumentId The document that must be accessed first
     */
    function setConditionalAccess(
        uint256 documentId,
        uint256 requiredDocumentId
    ) external onlyCreator {
        require(documents[documentId].id != 0, "Document not found");
        require(documents[requiredDocumentId].id != 0, "Required document not found");
        
        documents[documentId].conditionalDocumentId = requiredDocumentId;
        emit ConditionalAccessSet(documentId, requiredDocumentId);
    }
    
    /**
     * @notice Sign a document for multi-sig approval
     * @param documentId The document to sign
     */
    function signDocument(uint256 documentId) 
        external 
        onlyAuthorized 
        notRevoked 
        notExpired 
    {
        Document storage doc = documents[documentId];
        require(doc.id != 0, "Document not found");
        require(doc.requiresMultiSig, "Document doesn't require multi-sig");
        require(!doc.hasSigned[msg.sender], "Already signed");
        
        doc.hasSigned[msg.sender] = true;
        doc.currentSignatures++;
        
        emit SignatureAdded(documentId, msg.sender);
    }
    
    /**
     * @notice Check if a party can access a document
     * @param documentId The document to check
     * @param accessor The address trying to access
     * @return canAccess Whether access is allowed
     * @return reason Reason if access is denied
     */
    function canAccessDocument(uint256 documentId, address accessor) 
        external 
        view 
        returns (bool canAccess, string memory reason) 
    {
        // Check if revoked
        if (isRevoked) {
            return (false, "Deal room revoked");
        }
        
        // Check if expired
        if (block.timestamp > expiresAt) {
            return (false, "Deal room expired");
        }
        
        // Check if authorized
        if (!authorizedParties[accessor] && accessor != creator) {
            return (false, "Not authorized");
        }
        
        Document storage doc = documents[documentId];
        
        // Check if document exists
        if (doc.id == 0) {
            return (false, "Document not found");
        }
        
        // Check conditional access
        if (doc.conditionalDocumentId != 0) {
            Document storage requiredDoc = documents[doc.conditionalDocumentId];
            if (requiredDoc.accessCount == 0) {
                return (false, "Must access required document first");
            }
        }
        
        // Check multi-sig requirement
        if (doc.requiresMultiSig && doc.currentSignatures < doc.requiredSignatures) {
            return (false, "Insufficient signatures");
        }
        
        return (true, "Access granted");
    }
    
    /**
     * @notice Log document access (called after successful CDR decryption)
     * @param documentId The document that was accessed
     */
    function logAccess(uint256 documentId) 
        external 
        onlyAuthorized 
        notRevoked 
        notExpired 
    {
        Document storage doc = documents[documentId];
        require(doc.id != 0, "Document not found");
        
        doc.accessCount++;
        
        accessLogs.push(AccessLog({
            accessor: msg.sender,
            timestamp: block.timestamp,
            documentId: documentId
        }));
        
        emit DocumentAccessed(documentId, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Revoke all access to the deal room (emergency kill switch)
     */
    function revokeAllAccess() external onlyCreator {
        isRevoked = true;
        
        for (uint256 i = 0; i < authorizedPartiesList.length; i++) {
            emit AccessRevoked(authorizedPartiesList[i]);
        }
    }
    
    /**
     * @notice Get access logs for audit trail
     * @return Array of access logs
     */
    function getAccessLogs() external view returns (AccessLog[] memory) {
        return accessLogs;
    }
    
    /**
     * @notice Get all authorized parties
     * @return Array of authorized addresses
     */
    function getAuthorizedParties() external view returns (address[] memory) {
        return authorizedPartiesList;
    }
    
    /**
     * @notice Check if document has required signatures
     * @param documentId The document to check
     * @return bool True if has enough signatures or doesn't require multi-sig
     */
    function hasRequiredSignatures(uint256 documentId) 
        external 
        view 
        returns (bool) 
    {
        Document storage doc = documents[documentId];
        
        if (!doc.requiresMultiSig) {
            return true;
        }
        
        return doc.currentSignatures >= doc.requiredSignatures;
    }
}
