// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title HealthDataBounty
 * @dev Manages bounties for health data submissions with USDC rewards
 */
contract HealthDataBounty is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    // USDC token interface
    IERC20 public immutable usdcToken;
    
    // Hedera integration address (for cross-chain verification)
    address public hederaOracle;
    
    // Bounty structure
    struct Bounty {
        uint256 id;
        string title;
        string description;
        uint256 rewardAmount; // In USDC (6 decimals)
        address sponsor;
        uint256 maxParticipants;
        uint256 currentParticipants;
        uint256 startTime;
        uint256 endTime;
        bool active;
        mapping(address => bool) eligibleUsers;
        mapping(address => bool) hasSubmitted;
        mapping(address => string) submissions; // NFT token ID on Hedera
    }
    
    // Eligibility criteria
    struct EligibilityCriteria {
        uint256 minAge;
        uint256 maxAge;
        string[] requiredMetrics; // e.g., ["heartRate", "steps", "sleep"]
        uint256 minDataPoints;
        bool requiresVerification;
    }
    
    // Storage
    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => EligibilityCriteria) public bountyEligibility;
    mapping(address => uint256[]) public userBounties;
    mapping(address => uint256) public userRewards;
    
    uint256 public nextBountyId = 1;
    uint256 public totalRewardsDistributed;
    
    // Events
    event BountyCreated(
        uint256 indexed bountyId,
        address indexed sponsor,
        uint256 rewardAmount,
        uint256 maxParticipants
    );
    
    event UserEligibilitySet(
        uint256 indexed bountyId,
        address indexed user,
        bool eligible
    );
    
    event DataSubmitted(
        uint256 indexed bountyId,
        address indexed user,
        string hederaNFTId
    );
    
    event RewardDistributed(
        uint256 indexed bountyId,
        address indexed user,
        uint256 amount
    );
    
    event BountyClosed(uint256 indexed bountyId);
    
    // Constructor
    constructor(address _usdcToken, address _hederaOracle) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_hederaOracle != address(0), "Invalid oracle address");
        
        usdcToken = IERC20(_usdcToken);
        hederaOracle = _hederaOracle;
    }
    
    /**
     * @dev Create a new bounty
     */
    function createBounty(
        string memory _title,
        string memory _description,
        uint256 _rewardAmount,
        uint256 _maxParticipants,
        uint256 _duration,
        EligibilityCriteria memory _criteria
    ) external returns (uint256) {
        require(_rewardAmount > 0, "Reward must be greater than 0");
        require(_maxParticipants > 0, "Must have at least 1 participant");
        require(_duration > 0, "Duration must be greater than 0");
        
        uint256 totalRequired = _rewardAmount * _maxParticipants;
        require(
            usdcToken.transferFrom(msg.sender, address(this), totalRequired),
            "USDC transfer failed"
        );
        
        uint256 bountyId = nextBountyId++;
        Bounty storage newBounty = bounties[bountyId];
        
        newBounty.id = bountyId;
        newBounty.title = _title;
        newBounty.description = _description;
        newBounty.rewardAmount = _rewardAmount;
        newBounty.sponsor = msg.sender;
        newBounty.maxParticipants = _maxParticipants;
        newBounty.currentParticipants = 0;
        newBounty.startTime = block.timestamp;
        newBounty.endTime = block.timestamp + _duration;
        newBounty.active = true;
        
        bountyEligibility[bountyId] = _criteria;
        
        emit BountyCreated(bountyId, msg.sender, _rewardAmount, _maxParticipants);
        
        return bountyId;
    }
    
    /**
     * @dev Check if a user is eligible for a bounty
     */
    function checkEligibility(
        uint256 _bountyId,
        address _user
    ) external view returns (bool) {
        Bounty storage bounty = bounties[_bountyId];
        
        if (!bounty.active) return false;
        if (block.timestamp > bounty.endTime) return false;
        if (bounty.currentParticipants >= bounty.maxParticipants) return false;
        if (bounty.hasSubmitted[_user]) return false;
        
        return bounty.eligibleUsers[_user];
    }
    
    /**
     * @dev Set user eligibility (called by oracle or owner)
     */
    function setUserEligibility(
        uint256 _bountyId,
        address[] memory _users,
        bool[] memory _eligible
    ) external {
        require(
            msg.sender == owner() || msg.sender == hederaOracle,
            "Unauthorized"
        );
        require(_users.length == _eligible.length, "Array length mismatch");
        
        Bounty storage bounty = bounties[_bountyId];
        require(bounty.active, "Bounty not active");
        
        for (uint256 i = 0; i < _users.length; i++) {
            bounty.eligibleUsers[_users[i]] = _eligible[i];
            emit UserEligibilitySet(_bountyId, _users[i], _eligible[i]);
        }
    }
    
    /**
     * @dev Submit health data NFT for bounty
     */
    function submitHealthData(
        uint256 _bountyId,
        string memory _hederaNFTId,
        bytes memory _signature
    ) external nonReentrant {
        Bounty storage bounty = bounties[_bountyId];
        
        require(bounty.active, "Bounty not active");
        require(block.timestamp <= bounty.endTime, "Bounty expired");
        require(bounty.eligibleUsers[msg.sender], "User not eligible");
        require(!bounty.hasSubmitted[msg.sender], "Already submitted");
        require(
            bounty.currentParticipants < bounty.maxParticipants,
            "Bounty full"
        );
        
        // Verify signature from Hedera oracle
        bytes32 messageHash = keccak256(
            abi.encodePacked(_bountyId, msg.sender, _hederaNFTId)
        );
        address signer = messageHash.toEthSignedMessageHash().recover(_signature);
        require(signer == hederaOracle, "Invalid signature");
        
        // Record submission
        bounty.hasSubmitted[msg.sender] = true;
        bounty.submissions[msg.sender] = _hederaNFTId;
        bounty.currentParticipants++;
        userBounties[msg.sender].push(_bountyId);
        
        // Distribute reward immediately
        require(
            usdcToken.transfer(msg.sender, bounty.rewardAmount),
            "Reward transfer failed"
        );
        
        userRewards[msg.sender] += bounty.rewardAmount;
        totalRewardsDistributed += bounty.rewardAmount;
        
        emit DataSubmitted(_bountyId, msg.sender, _hederaNFTId);
        emit RewardDistributed(_bountyId, msg.sender, bounty.rewardAmount);
        
        // Close bounty if full
        if (bounty.currentParticipants >= bounty.maxParticipants) {
            bounty.active = false;
            emit BountyClosed(_bountyId);
        }
    }
    
    /**
     * @dev Close expired bounty and refund remaining rewards
     */
    function closeBounty(uint256 _bountyId) external {
        Bounty storage bounty = bounties[_bountyId];
        
        require(bounty.active, "Bounty already closed");
        require(
            block.timestamp > bounty.endTime || msg.sender == bounty.sponsor,
            "Cannot close yet"
        );
        
        bounty.active = false;
        
        // Refund remaining rewards to sponsor
        uint256 remainingParticipants = bounty.maxParticipants - bounty.currentParticipants;
        if (remainingParticipants > 0) {
            uint256 refundAmount = bounty.rewardAmount * remainingParticipants;
            require(
                usdcToken.transfer(bounty.sponsor, refundAmount),
                "Refund failed"
            );
        }
        
        emit BountyClosed(_bountyId);
    }
    
    /**
     * @dev Update Hedera oracle address
     */
    function updateHederaOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "Invalid oracle address");
        hederaOracle = _newOracle;
    }
    
    /**
     * @dev Get bounty details
     */
    function getBountyDetails(uint256 _bountyId) external view returns (
        string memory title,
        string memory description,
        uint256 rewardAmount,
        address sponsor,
        uint256 maxParticipants,
        uint256 currentParticipants,
        uint256 endTime,
        bool active
    ) {
        Bounty storage bounty = bounties[_bountyId];
        return (
            bounty.title,
            bounty.description,
            bounty.rewardAmount,
            bounty.sponsor,
            bounty.maxParticipants,
            bounty.currentParticipants,
            bounty.endTime,
            bounty.active
        );
    }
    
    /**
     * @dev Get user's submission for a bounty
     */
    function getUserSubmission(
        uint256 _bountyId,
        address _user
    ) external view returns (bool hasSubmitted, string memory nftId) {
        Bounty storage bounty = bounties[_bountyId];
        return (bounty.hasSubmitted[_user], bounty.submissions[_user]);
    }
    
    /**
     * @dev Get all bounties a user has participated in
     */
    function getUserBounties(address _user) external view returns (uint256[] memory) {
        return userBounties[_user];
    }
    
    /**
     * @dev Get total rewards earned by a user
     */
    function getUserTotalRewards(address _user) external view returns (uint256) {
        return userRewards[_user];
    }
}