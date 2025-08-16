# Product Requirements Document (PRD)
## Personal Health Data Platform with Decentralized Storage and NFT Marketplace

**Version:** 1.0  
**Date:** January 2025  
**Status:** Draft  
**Target:** Hackathon MVP / Testnet Demo

---

## Executive Summary

A consumer-focused health data ownership platform that empowers users to control, analyze, and monetize their personal health metrics. The platform combines Apple Health integration, encrypted decentralized storage via Walrus, AI-powered health insights, gamified fitness challenges, and an NFT marketplace for anonymized health datasets.

**Core Value Proposition:** "Own your health data. Store it securely. Analyze it privately. Challenge friends. Monetize it ethically."

---

## 1. Product Overview

### 1.1 Vision
Create a privacy-first health data ecosystem where users maintain complete ownership and control over their biometric data while enabling new use cases for personal wellness insights and ethical data monetization.

### 1.2 Mission
Democratize health data ownership by providing consumer-simple tools for secure storage, AI analysis, social challenges, and optional dataset monetization through blockchain technology.

### 1.3 Key Features
- **Seamless Onboarding:** Email/social login via Privy with embedded wallet (no seed phrases)
- **Health Data Import:** Direct integration with Apple HealthKit for HRV, Resting Heart Rate, Calories, and Exercise metrics
- **Encrypted Storage:** Decentralized storage on Walrus with client-side encryption
- **AI Health Assistant:** Private Q&A over personal health data with trend analysis and insights
- **24-Hour Challenges:** Gamified calorie-burn competitions with crypto prize pools
- **NFT Data Marketplace:** Sell anonymized, aggregated health datasets as NFTs via OpenSea

---

## 2. Goals and Non-Goals

### 2.1 Goals (Hackathon Scope)

#### Primary Goals
- **Consumer Accessibility:** Sub-10 second onboarding with familiar authentication methods
- **Data Sovereignty:** Full user control over health data with encrypted, decentralized storage
- **Privacy-First AI:** Enable health insights without exposing raw data to third parties
- **Social Engagement:** Create viral 24-hour fitness challenges with real stakes
- **Ethical Monetization:** Allow users to profit from their anonymized health data
- **Testnet Demo:** Fully functional prototype on EVM testnets (Base Sepolia/Polygon Amoy)

#### Technical Goals
- **Minimal Friction:** Abstract blockchain complexity through embedded wallets
- **Real-Time Updates:** Live challenge leaderboards and dataset metadata updates
- **Cross-Platform:** React Native iOS app with web API backend
- **Sponsor Integration:** Demonstrate clear value for Privy, Walrus, OpenSea MCP, and optional Chiliz/Flow

### 2.2 Non-Goals (Out of Scope)

- **Medical Advice:** No clinical decision support or diagnosis features
- **HIPAA Compliance:** Consumer wellness focus only, not healthcare provider workflows
- **Complex ZK Proofs:** Reserved for future iterations beyond hackathon
- **Multi-chain Production:** Testnet only for initial release
- **Android Support:** iOS-first for Apple Health integration
- **Regulatory Compliance:** No FDA/medical device considerations

---

## 3. User Personas

### 3.1 Primary Persona: Health-Conscious Consumer
**Name:** Sarah, 28, Product Manager  
**Tech Savvy:** Medium (uses apps daily, minimal crypto experience)  
**Motivation:** Wants to understand her stress patterns and compete with friends on fitness goals  
**Pain Points:** Health data trapped in silos, no monetization options, boring fitness tracking  
**Jobs to be Done:** Track wellness trends, motivate exercise through competition, explore data ownership  

### 3.2 Secondary Persona: Quantified Self Enthusiast
**Name:** Mike, 35, Software Engineer  
**Tech Savvy:** High (early crypto adopter, multiple wearables)  
**Motivation:** Maximize health optimization through data analysis  
**Pain Points:** Lack of unified health data platform, privacy concerns with centralized services  
**Jobs to be Done:** Aggregate all health metrics, run custom analyses, maintain data privacy  

### 3.3 Tertiary Persona: Data Buyer (Researcher/Company)
**Name:** Research Lab / Wellness Startup  
**Motivation:** Access diverse, real-world health datasets for studies or product development  
**Pain Points:** Expensive data acquisition, ethical sourcing concerns, limited diversity  
**Jobs to be Done:** Purchase verified, anonymized datasets with clear provenance  

---

## 4. Technical Architecture

### 4.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     iOS Client (React Native)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Privy   │  │ HealthKit│  │    UI    │  │  Walrus  │   │
│  │   Auth   │  │  Bridge  │  │  Screens │  │  Client  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │    AI    │  │Challenge │  │   MCP    │  │  Walrus  │   │
│  │  Engine  │  │  Oracle  │  │  Webhook │  │  Gateway │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│   Walrus Storage │  │  EVM Testnet │  │ OpenSea MCP  │
│  (Encrypted Data)│  │   Contracts  │  │  (Listings)  │
└──────────────────┘  └──────────────┘  └──────────────┘
```

### 4.2 Data Flow

#### Health Data Import Flow
1. User authorizes HealthKit access
2. App pulls metrics (HRV, RHR, calories, exercise)
3. Client encrypts data with AES-256-GCM
4. Upload encrypted blobs to Walrus
5. Store manifest with pointers locally and on backend

#### AI Query Flow
1. User submits natural language query
2. App sends signed request with manifest ID
3. Backend verifies signature
4. Fetch and decrypt relevant Walrus blobs
5. Process through AI model (GPT-4 or Claude)
6. Return insights with visualizations

#### Challenge Flow
1. Creator deploys challenge with stake
2. Participants join and deposit stakes
3. Throughout day: app tracks and uploads metrics
4. End of period: oracle calculates results
5. Oracle signs EIP-712 message with calories
6. Anyone can submit signed results on-chain
7. Contract verifies and distributes prizes

#### NFT Marketplace Flow
1. User opts into dataset anonymization
2. System applies k-anonymity and differential privacy
3. Mint ERC-721 NFT with manifest pointer
4. List on OpenSea with MCP integration
5. On sale: transfer event triggers access update
6. New owner can decrypt via Lit Protocol

### 4.3 Technology Stack

#### Frontend
- **Framework:** React Native (Expo)
- **Auth:** Privy SDK
- **Health:** Apple HealthKit API
- **Blockchain:** Ethers.js / Viem
- **Storage:** Walrus SDK
- **UI:** NativeWind (Tailwind for RN)

#### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** PostgreSQL (metadata only)
- **Queue:** Bull (Redis-backed)
- **AI:** OpenAI API / Anthropic Claude
- **Signing:** EIP-712 implementation

#### Blockchain
- **EVM:** Solidity 0.8.20+
- **Framework:** Hardhat / Foundry
- **Standards:** ERC-721, EIP-712
- **Testnets:** Base Sepolia, Polygon Amoy
- **Optional:** Flow Cadence

#### Infrastructure
- **Storage:** Walrus Protocol
- **Access Control:** Lit Protocol (optional)
- **NFT Platform:** OpenSea (via MCP)
- **Monitoring:** OpenTelemetry
- **Deployment:** Vercel / Railway

---

## 5. Data Models

### 5.1 Off-Chain Storage (Walrus)

#### Time-Series Health Metrics (JSONL Format)
```json
{"ts":"2025-01-15T08:00:00Z","metric":"hrv","value":58,"unit":"ms","source":"apple_health","device":"Apple Watch Series 9"}
{"ts":"2025-01-15T08:00:00Z","metric":"rhr","value":52,"unit":"bpm","source":"apple_health","device":"Apple Watch Series 9"}
{"ts":"2025-01-15T08:00:00Z","metric":"active_calories","value":450,"unit":"kcal","source":"apple_health","device":"iPhone 15 Pro"}
{"ts":"2025-01-15T08:00:00Z","metric":"exercise_minutes","value":45,"unit":"min","source":"apple_health","device":"Apple Watch Series 9"}
```

#### Dataset Manifest (JSON)
```json
{
  "schema_version": "1.0",
  "dataset_id": "ds_7f8a9b2c3d4e5f6g",
  "user_pseudonymous_id": "u_8f2c9a1b3d4e5f6g",
  "title": "30-Day Wellness Metrics Bundle",
  "description": "Comprehensive biometric data including HRV, heart rate, and activity metrics",
  "metrics": {
    "hrv": {
      "included": true,
      "samples": 1440,
      "frequency": "hourly",
      "blob_url": "walrus://blob/abc123...",
      "checksum": "sha256:7d865e959b2466918c9863afca942d0f..."
    },
    "rhr": {
      "included": true,
      "samples": 30,
      "frequency": "daily",
      "blob_url": "walrus://blob/def456...",
      "checksum": "sha256:8b9c1d2e3f4a5b6c7d8e9f0a..."
    },
    "active_calories": {
      "included": true,
      "samples": 720,
      "frequency": "hourly",
      "blob_url": "walrus://blob/ghi789...",
      "checksum": "sha256:1a2b3c4d5e6f7g8h9i0j..."
    },
    "exercise_minutes": {
      "included": true,
      "samples": 30,
      "frequency": "daily",
      "blob_url": "walrus://blob/jkl012...",
      "checksum": "sha256:9z8y7x6w5v4u3t2s1r0q..."
    }
  },
  "time_range": {
    "start": "2024-12-15T00:00:00Z",
    "end": "2025-01-15T23:59:59Z",
    "timezone": "UTC"
  },
  "device_types": ["apple_watch_9", "iphone_15_pro"],
  "anonymization": {
    "method": "differential_privacy",
    "epsilon": 1.0,
    "k_anonymity": 20,
    "removed_fields": ["exact_location", "device_id", "user_id"],
    "time_granularity": "hour",
    "noise_added": true
  },
  "statistics": {
    "hrv_mean": 55.2,
    "hrv_std": 8.3,
    "rhr_mean": 54.1,
    "rhr_std": 3.2,
    "daily_calories_mean": 2450,
    "daily_exercise_mean": 42
  },
  "created_at": "2025-01-15T16:02:00Z",
  "updated_at": "2025-01-15T16:02:00Z",
  "version": 1
}
```

### 5.2 On-Chain Storage (EVM)

#### DatasetNFT Contract Storage
```solidity
struct DatasetMetadata {
    string manifestURI;      // walrus:// or IPFS URI
    bytes32 manifestHash;    // Keccak256 of manifest
    uint256 createdAt;
    uint256 lastUpdatedAt;
    uint16 schemaVersion;
    bytes32 metricsHash;     // Hash of included metrics
    uint32 sampleCount;      // Total data points
    uint64 timeRangeStart;
    uint64 timeRangeEnd;
}

mapping(uint256 => DatasetMetadata) public datasets;
mapping(uint256 => address) public datasetCreator;
mapping(address => uint256[]) public userDatasets;
```

#### ChallengeManager Contract Storage
```solidity
struct Challenge {
    uint256 id;
    address creator;
    string title;
    string description;
    IERC20 stakeToken;
    uint256 stakeAmount;
    uint256 prizePool;
    uint64 startTimestamp;
    uint64 endTimestamp;
    uint8 maxParticipants;
    ChallengeStatus status;
    address[] participants;
    mapping(address => uint256) finalCalories;
    mapping(address => bool) hasJoined;
    mapping(address => bool) hasSubmitted;
    address winner;
    uint256 winningCalories;
}

enum ChallengeStatus {
    Created,
    Active,
    Calculating,
    Finalized,
    Cancelled
}
```

---

## 6. Smart Contract Specifications

### 6.1 DatasetNFT (ERC-721)

#### Purpose
Tokenize ownership rights to anonymized health datasets, enabling marketplace transactions while maintaining data privacy.

#### Key Functions
```solidity
// Mint new dataset NFT
function mintDataset(
    address to,
    string calldata manifestURI,
    bytes32 manifestHash,
    uint64 timeRangeStart,
    uint64 timeRangeEnd
) external returns (uint256 tokenId);

// Update dataset (for rolling windows)
function updateDataset(
    uint256 tokenId,
    string calldata newManifestURI,
    bytes32 newManifestHash
) external onlyOwnerOrAuthorized;

// Batch mint for multiple datasets
function batchMint(
    address[] calldata recipients,
    string[] calldata manifestURIs,
    bytes32[] calldata manifestHashes
) external returns (uint256[] memory tokenIds);

// Get dataset metadata
function getDatasetMetadata(uint256 tokenId) 
    external view returns (DatasetMetadata memory);

// Override for OpenSea metadata
function tokenURI(uint256 tokenId) 
    public view override returns (string memory);
```

#### Events
```solidity
event DatasetMinted(
    uint256 indexed tokenId,
    address indexed creator,
    string manifestURI,
    bytes32 manifestHash,
    uint64 timeRangeStart,
    uint64 timeRangeEnd
);

event DatasetUpdated(
    uint256 indexed tokenId,
    string newManifestURI,
    bytes32 newManifestHash,
    uint256 timestamp
);

event DatasetTransferred(
    uint256 indexed tokenId,
    address indexed from,
    address indexed to,
    uint256 salePrice
);
```

### 6.2 ChallengeManager

#### Purpose
Non-custodial escrow and settlement system for gamified fitness challenges with verifiable results.

#### Key Functions
```solidity
// Create new challenge
function createChallenge(
    string calldata title,
    string calldata description,
    address stakeToken,
    uint256 stakeAmount,
    uint64 startTime,
    uint64 duration,
    uint8 maxParticipants
) external payable returns (uint256 challengeId);

// Join existing challenge
function joinChallenge(uint256 challengeId) 
    external payable;

// Submit oracle-signed results
function submitResult(
    uint256 challengeId,
    address participant,
    uint256 calories,
    bytes calldata signature
) external;

// Finalize and distribute prizes
function finalizeChallenge(uint256 challengeId) 
    external;

// Emergency withdrawal (after timeout)
function emergencyWithdraw(uint256 challengeId) 
    external;

// Get challenge details
function getChallengeDetails(uint256 challengeId)
    external view returns (Challenge memory);

// Get participant results
function getParticipantResults(uint256 challengeId)
    external view returns (
        address[] memory participants,
        uint256[] memory calories
    );
```

#### Events
```solidity
event ChallengeCreated(
    uint256 indexed challengeId,
    address indexed creator,
    string title,
    uint256 stakeAmount,
    uint64 startTime,
    uint64 endTime
);

event ParticipantJoined(
    uint256 indexed challengeId,
    address indexed participant,
    uint256 stakeAmount
);

event ResultSubmitted(
    uint256 indexed challengeId,
    address indexed participant,
    uint256 calories,
    address submitter
);

event ChallengeFinalized(
    uint256 indexed challengeId,
    address indexed winner,
    uint256 prizeAmount,
    uint256 winningCalories
);
```

### 6.3 Security Considerations

#### Access Control
- Multi-signature wallet for contract upgrades
- Role-based permissions for oracle signers
- Time-locked administrative functions

#### Economic Security
- Minimum stake requirements to prevent spam
- Anti-sybil mechanisms for challenges
- Slashing conditions for malicious oracles

#### Data Privacy
- No PII stored on-chain
- Hashed references only
- Zero-knowledge proofs for future iterations

---

## 7. User Experience Design

### 7.1 Information Architecture

```
Home
├── Dashboard
│   ├── Today's Metrics
│   ├── Weekly Trends
│   └── Quick Actions
├── AI Assistant
│   ├── Chat Interface
│   ├── Suggested Questions
│   └── Insights History
├── Challenges
│   ├── Active Challenges
│   ├── Create Challenge
│   ├── Browse Open
│   └── Past Results
├── Data Vault
│   ├── My Datasets
│   ├── Import Data
│   ├── Export Options
│   └── Privacy Settings
└── Marketplace
    ├── My Listings
    ├── Browse Datasets
    ├── Create Listing
    └── Sales History
```

### 7.2 Key User Flows

#### Onboarding Flow (Target: <60 seconds)
1. **Welcome Screen** → Brand promise + "Get Started"
2. **Auth Selection** → Email/Google/Apple (via Privy)
3. **Health Permissions** → HealthKit access request
4. **Initial Import** → Progress bar for data sync
5. **Dashboard** → Personalized with first insights

#### AI Query Flow
1. **Tap AI Button** → Opens chat interface
2. **Type/Voice Query** → "How did I sleep this week?"
3. **Processing** → Shimmer effect (1-2 seconds)
4. **Response** → Text summary + interactive chart
5. **Follow-up** → Suggested related questions

#### Challenge Creation Flow
1. **New Challenge** → Title, description, duration
2. **Set Stakes** → Token selection, amount
3. **Configure Rules** → Metric type, calculation method
4. **Review & Deploy** → Summary + gas estimate
5. **Share** → Deep link + social sharing options

#### Dataset Monetization Flow
1. **Select Data Range** → Calendar picker
2. **Choose Metrics** → Multi-select checkboxes
3. **Privacy Options** → Anonymization level slider
4. **Preview** → Sample data + statistics
5. **Mint NFT** → Confirmation + gas fee
6. **List on OpenSea** → Price + royalties setup

### 7.3 Visual Design System

#### Design Principles
- **Clarity First:** Health data visualization priority
- **Trust Signals:** Security badges, encryption indicators
- **Minimal Friction:** One-tap actions, smart defaults
- **Progressive Disclosure:** Advanced features hidden initially

#### Component Library
- **Cards:** Metric displays with sparklines
- **Charts:** Interactive D3.js visualizations
- **Forms:** Native iOS controls for familiarity
- **Modals:** Bottom sheets for actions
- **Notifications:** Non-intrusive toast messages

#### Color Palette
- **Primary:** Health-inspired blue (#007AFF)
- **Success:** Vital green (#34C759)
- **Warning:** Attention amber (#FF9500)
- **Error:** Alert red (#FF3B30)
- **Neutral:** Grays (#8E8E93 to #1C1C1E)

---

## 8. API Specifications

### 8.1 Backend Endpoints

#### Authentication
```typescript
POST /api/auth/verify
Body: {
  wallet: string,
  signature: string,
  message: string
}
Response: {
  token: string,
  userId: string,
  expiresAt: number
}
```

#### AI Queries
```typescript
POST /api/ai/query
Headers: { Authorization: "Bearer {token}" }
Body: {
  prompt: string,
  manifestId: string,
  timeRange?: {
    start: string,
    end: string
  }
}
Response: {
  answer: string,
  confidence: number,
  sources: string[],
  visualization?: {
    type: "line" | "bar" | "scatter",
    data: any[]
  }
}
```

#### Challenge Management
```typescript
POST /api/challenges/oracle/sign
Body: {
  challengeId: string,
  participant: string,
  calories: number,
  proof: {
    dataPoints: number[],
    timestamps: number[],
    source: string
  }
}
Response: {
  signature: string,
  messageHash: string,
  nonce: number
}
```

#### Dataset Operations
```typescript
POST /api/datasets/prepare
Headers: { Authorization: "Bearer {token}" }
Body: {
  timeRange: {
    start: string,
    end: string
  },
  metrics: string[],
  anonymization: {
    kValue: number,
    epsilon: number,
    excludeFields: string[]
  }
}
Response: {
  manifestId: string,
  manifestURI: string,
  statistics: object,
  estimatedSamples: number
}
```

### 8.2 Walrus Integration

#### Upload Encrypted Blob
```typescript
POST /api/walrus/upload
Headers: { Authorization: "Bearer {token}" }
Body: FormData {
  file: File,
  encryption: {
    algorithm: "AES-256-GCM",
    keyId: string
  }
}
Response: {
  blobId: string,
  url: string,
  checksum: string,
  size: number
}
```

#### Retrieve Blob
```typescript
GET /api/walrus/blob/{blobId}
Headers: { Authorization: "Bearer {token}" }
Response: {
  data: string (base64),
  metadata: {
    encrypted: boolean,
    size: number,
    created: string
  }
}
```

### 8.3 OpenSea MCP Integration

#### Register Webhook
```typescript
POST /api/mcp/webhook/register
Body: {
  contractAddress: string,
  events: string[],
  callbackUrl: string
}
```

#### Update Metadata
```typescript
POST /api/mcp/metadata/update
Body: {
  tokenId: number,
  attributes: {
    lastUpdated: string,
    sampleCount: number,
    metrics: string[]
  }
}
```

---

## 9. Security & Privacy

### 9.1 Data Protection

#### Encryption Standards
- **At Rest:** AES-256-GCM for all health data
- **In Transit:** TLS 1.3 for all API communications
- **Key Management:** Hardware Security Module (HSM) integration
- **Backup:** Encrypted cloud backups with user-controlled keys

#### Anonymization Techniques
- **K-Anonymity:** Minimum k=20 for all published datasets
- **Differential Privacy:** Laplace noise with ε=1.0
- **Temporal Fuzzing:** Coarsen timestamps to hour boundaries
- **Field Removal:** Strip all direct identifiers

### 9.2 Access Control

#### Authentication Layers
1. **Privy Embedded Wallet:** Email/social login
2. **Message Signing:** EIP-712 for all sensitive operations
3. **JWT Tokens:** Short-lived (15 min) with refresh tokens
4. **Rate Limiting:** Per-wallet and per-IP restrictions

#### Authorization Matrix
| Role | Read Own Data | Write Own Data | Read Others' | Admin Functions |
|------|--------------|----------------|--------------|-----------------|
| User | ✅ | ✅ | ❌ | ❌ |
| NFT Owner | ✅ | ❌ | ✅ (purchased) | ❌ |
| Oracle | ✅ (challenge) | ✅ (results) | ❌ | ❌ |
| Admin | ✅ | ❌ | ❌ | ✅ |

### 9.3 Compliance Considerations

#### Data Rights
- **Right to Access:** Export all data in standard formats
- **Right to Delete:** Complete data purge within 30 days
- **Right to Portability:** JSON/CSV export options
- **Right to Rectification:** Edit/correct personal data

#### Regulatory Alignment
- **GDPR:** Privacy by design, explicit consent
- **CCPA:** California consumer privacy compliance
- **HIPAA:** Explicitly not covered (consumer wellness only)
- **App Store:** Apple guidelines compliance

---

## 10. Implementation Roadmap

### 10.1 Hackathon Timeline (72 Hours)

#### Day 1: Foundation (Hours 0-24)
**Morning (0-12h)**
- [ ] Repository setup with monorepo structure
- [ ] Privy integration and auth flow
- [ ] HealthKit permissions and basic data read
- [ ] Walrus SDK integration and test upload

**Afternoon (12-24h)**
- [ ] Smart contract scaffolding (DatasetNFT, ChallengeManager)
- [ ] Deploy contracts to Base Sepolia
- [ ] Basic React Native UI with navigation
- [ ] Backend API setup with Express

#### Day 2: Core Features (Hours 24-48)
**Morning (24-36h)**
- [ ] Complete health data import pipeline
- [ ] Implement encryption/decryption flow
- [ ] AI query endpoint with OpenAI/Claude
- [ ] Challenge creation and join functionality

**Afternoon (36-48h)**
- [ ] Oracle signer implementation
- [ ] EIP-712 signature verification
- [ ] NFT minting and metadata generation
- [ ] OpenSea MCP webhook setup

#### Day 3: Polish & Demo (Hours 48-72)
**Morning (48-60h)**
- [ ] UI/UX polish and animations
- [ ] End-to-end testing of all flows
- [ ] Bug fixes and error handling
- [ ] Performance optimization

**Afternoon (60-72h)**
- [ ] Demo video recording (2-3 minutes)
- [ ] Documentation and README
- [ ] Deployment to testnet
- [ ] Submission preparation

### 10.2 Post-Hackathon Roadmap

#### Phase 1: Beta Launch (Weeks 1-4)
- Mainnet deployment preparation
- Security audit (smart contracts)
- Beta user onboarding (100 users)
- Apple App Store submission

#### Phase 2: Feature Expansion (Weeks 5-12)
- Android app development
- Additional wearable integrations (Garmin, Fitbit)
- Advanced AI models for health insights
- Multi-chain deployment (Polygon, Arbitrum)

#### Phase 3: Scale (Weeks 13-24)
- B2B partnerships for data purchasing
- Clinical trial recruitment features
- Zero-knowledge proof implementation
- Governance token and DAO structure

---

## 11. Success Metrics

### 11.1 Hackathon Judging Criteria

#### Technical Excellence (40%)
- [ ] All features functional on testnet
- [ ] Clean, well-documented code
- [ ] Smart contract security best practices
- [ ] Efficient use of sponsor technologies

#### Innovation (30%)
- [ ] Novel use of decentralized storage for health data
- [ ] Creative challenge mechanics
- [ ] Unique approach to data monetization
- [ ] AI integration sophistication

#### User Experience (20%)
- [ ] Onboarding time <60 seconds
- [ ] Intuitive navigation
- [ ] Responsive performance
- [ ] Professional visual design

#### Market Potential (10%)
- [ ] Clear value proposition
- [ ] Scalable architecture
- [ ] Revenue model viability
- [ ] Competitive differentiation

### 11.2 Product KPIs

#### User Metrics
- Daily Active Users (DAU)
- User Retention (D1, D7, D30)
- Health Data Import Rate
- AI Queries per User

#### Engagement Metrics
- Challenges Created per Week
- Average Challenge Participation
- Challenge Completion Rate
- Social Shares per Challenge

#### Marketplace Metrics
- Datasets Listed
- NFT Sales Volume
- Average Dataset Price
- Buyer Return Rate

#### Technical Metrics
- API Response Time (<200ms p95)
- Walrus Upload Success Rate (>99%)
- Smart Contract Gas Efficiency
- System Uptime (>99.9%)

---

## 12. Risk Analysis

### 12.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| HealthKit API limitations | Medium | High | Prepare mock data, test thoroughly |
| Walrus network congestion | Low | Medium | Implement retry logic, caching |
| Smart contract vulnerabilities | Medium | High | Use audited libraries, extensive testing |
| Scalability issues | Low | Medium | Optimize queries, implement pagination |

### 12.2 Market Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Low user adoption | Medium | High | Focus on viral challenges feature |
| Data buyer reluctance | High | Medium | Provide sample datasets, clear value prop |
| Regulatory challenges | Low | High | Maintain consumer focus, avoid medical claims |
| Competition from Big Tech | Medium | Medium | Emphasize decentralization, user ownership |

### 12.3 Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Oracle manipulation | Low | High | Multi-signature requirements, stake slashing |
| Data breach | Low | Critical | Client-side encryption, minimal PII storage |
| Platform dependency | Medium | Medium | Abstract integrations, maintain fallbacks |
| Team bandwidth | High | Medium | Clear task prioritization, scope management |

---

## 13. Budget & Resources

### 13.1 Development Costs (Hackathon)

| Item | Cost | Notes |
|------|------|-------|
| Testnet Gas | $0 | Free faucets |
| API Credits | $50 | OpenAI/Claude for AI features |
| Domain/Hosting | $20 | Vercel/Railway |
| Apple Developer | $0 | Use existing account |
| Total | $70 | Minimal hackathon investment |

### 13.2 Production Estimates (Post-Hackathon)

| Category | Monthly Cost | Annual Cost |
|----------|-------------|-------------|
| Infrastructure | $500 | $6,000 |
| Smart Contract Audits | - | $30,000 |
| API Services | $1,000 | $12,000 |
| Legal/Compliance | $2,000 | $24,000 |
| Marketing | $3,000 | $36,000 |
| Team (4 people) | $40,000 | $480,000 |
| **Total** | **$46,500** | **$588,000** |

### 13.3 Revenue Projections

| Revenue Stream | Year 1 | Year 2 | Year 3 |
|----------------|---------|---------|---------|
| Dataset NFT Sales (5% fee) | $50,000 | $250,000 | $1,000,000 |
| Challenge Fees (2%) | $20,000 | $100,000 | $400,000 |
| Premium Features | $30,000 | $150,000 | $600,000 |
| B2B Data Partnerships | $0 | $500,000 | $2,000,000 |
| **Total** | **$100,000** | **$1,000,000** | **$4,000,000** |

---

## 14. Team & Responsibilities

### 14.1 Hackathon Team Structure

| Role | Responsibilities | Skills Required |
|------|-----------------|-----------------|
| **Full-Stack Lead** | React Native app, API development | JS/TS, React Native, Node.js |
| **Blockchain Engineer** | Smart contracts, Web3 integration | Solidity, Ethers.js, Hardhat |
| **AI/Backend Engineer** | AI queries, oracle, data processing | Python/Node, ML, databases |
| **Product/Design** | UX flows, demo video, documentation | Design tools, video editing |

### 14.2 Advisory Needs (Post-Hackathon)

- **Healthcare Advisor:** HIPAA compliance, medical partnerships
- **Legal Counsel:** Data privacy, terms of service
- **Blockchain Advisor:** Tokenomics, DAO structure
- **Growth Advisor:** User acquisition, viral mechanics

---

## 15. Conclusion

This PRD outlines a comprehensive vision for a decentralized health data platform that empowers users with true data ownership while creating new value through AI insights, social challenges, and ethical data monetization. The hackathon MVP demonstrates technical feasibility across multiple cutting-edge technologies while maintaining focus on consumer-friendly user experience.

The platform addresses critical market needs:
1. **Data Sovereignty:** Users frustrated with Big Tech control
2. **Privacy-First AI:** Health insights without data exposure
3. **Social Motivation:** Gamified fitness with real stakes
4. **Fair Value Exchange:** Users profit from their own data

By leveraging Privy's seamless auth, Walrus's decentralized storage, and OpenSea's NFT infrastructure, we create a product that makes blockchain technology invisible to end users while delivering its core benefits of ownership, privacy, and value creation.

The modular architecture enables rapid iteration during the hackathon while providing a solid foundation for post-hackathon scaling. With clear sponsor integrations, compelling user value, and multiple revenue streams, this platform represents both a strong hackathon submission and a viable long-term business opportunity.

---

## Appendices

### A. Technical Specifications

#### A.1 Smart Contract Interfaces

```solidity
// IDatasetNFT.sol
interface IDatasetNFT is IERC721 {
    function mintDataset(
        address to,
        string calldata manifestURI,
        bytes32 manifestHash,
        uint64 timeRangeStart,
        uint64 timeRangeEnd
    ) external returns (uint256);
    
    function updateDataset(
        uint256 tokenId,
        string calldata newManifestURI,
        bytes32 newManifestHash
    ) external;
    
    function getDatasetMetadata(uint256 tokenId)
        external view returns (DatasetMetadata memory);
}

// IChallengeManager.sol
interface IChallengeManager {
    function createChallenge(
        string calldata title,
        string calldata description,
        address stakeToken,
        uint256 stakeAmount,
        uint64 startTime,
        uint64 duration,
        uint8 maxParticipants
    ) external payable returns (uint256);
    
    function joinChallenge(uint256 challengeId) external payable;
    
    function submitResult(
        uint256 challengeId,
        address participant,
        uint256 calories,
        bytes calldata signature
    ) external;
    
    function finalizeChallenge(uint256 challengeId) external;
}
```

#### A.2 Database Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP,
    privy_did VARCHAR(255)
);

-- Health metrics metadata (not actual values)
CREATE TABLE health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    metric_type VARCHAR(50) NOT NULL,
    walrus_blob_id VARCHAR(255) NOT NULL,
    time_range_start TIMESTAMP NOT NULL,
    time_range_end TIMESTAMP NOT NULL,
    sample_count INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Challenges tracking
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id INTEGER NOT NULL,
    contract_challenge_id BIGINT NOT NULL,
    creator_wallet VARCHAR(42) NOT NULL,
    title VARCHAR(255),
    status VARCHAR(50),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    stake_amount DECIMAL(36, 18),
    participant_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(chain_id, contract_challenge_id)
);

-- Dataset NFTs
CREATE TABLE dataset_nfts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id BIGINT NOT NULL,
    chain_id INTEGER NOT NULL,
    owner_wallet VARCHAR(42) NOT NULL,
    manifest_uri TEXT NOT NULL,
    manifest_hash VARCHAR(66),
    listed_price DECIMAL(36, 18),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(chain_id, token_id)
);
```

#### A.3 Environment Variables

```bash
# Authentication
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret

# Blockchain
ALCHEMY_API_KEY=your_alchemy_key
BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/
WALLET_PRIVATE_KEY=0x... # For oracle signing only

# Storage
WALRUS_API_URL=https://walrus.example.com
WALRUS_API_KEY=your_walrus_key

# AI
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/health_app

# OpenSea MCP
OPENSEA_API_KEY=your_opensea_key
MCP_WEBHOOK_SECRET=your_webhook_secret

# Contracts (deployed addresses)
DATASET_NFT_ADDRESS=0x...
CHALLENGE_MANAGER_ADDRESS=0x...
```

### B. API Examples

#### B.1 Health Data Query Example

**Request:**
```bash
curl -X POST https://api.healthapp.io/ai/query \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "How has my HRV changed this week compared to last week?",
    "manifestId": "ds_7f8a9b2c3d4e5f6g"
  }'
```

**Response:**
```json
{
  "answer": "Your HRV has improved by 8% this week (avg 58ms) compared to last week (avg 54ms). This suggests better recovery and lower stress levels. The improvement was most notable during morning readings.",
  "confidence": 0.92,
  "sources": [
    "walrus://blob/abc123",
    "walrus://blob/def456"
  ],
  "visualization": {
    "type": "line",
    "data": [
      {"date": "2025-01-08", "value": 54, "period": "last_week"},
      {"date": "2025-01-09", "value": 53, "period": "last_week"},
      {"date": "2025-01-15", "value": 58, "period": "this_week"}
    ]
  }
}
```

#### B.2 Challenge Creation Example

**Request:**
```javascript
const tx = await challengeManager.createChallenge(
  "7-Day Step Challenge",
  "Most steps in 7 days wins the pool!",
  USDC_ADDRESS,
  ethers.utils.parseUnits("10", 6), // 10 USDC
  Math.floor(Date.now() / 1000) + 3600, // Start in 1 hour
  7 * 24 * 3600, // 7 days duration
  20, // Max 20 participants
  { value: 0 }
);
```

**Event Emitted:**
```javascript
ChallengeCreated(
  challengeId: 42,
  creator: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5",
  title: "7-Day Step Challenge",
  stakeAmount: 10000000,
  startTime: 1736899200,
  endTime: 1737504000
)
```

### C. Testing Strategy

#### C.1 Unit Tests
- Smart contract functions (Hardhat/Foundry)
- API endpoint validation
- Encryption/decryption logic
- Data anonymization algorithms

#### C.2 Integration Tests
- HealthKit → Walrus pipeline
- Wallet signing → API auth
- Oracle submission → Contract verification
- NFT mint → OpenSea listing

#### C.3 E2E Tests
- Complete onboarding flow
- Full challenge lifecycle
- Dataset creation and purchase
- AI query with visualization

#### C.4 Security Tests
- Smart contract audit checklist
- API penetration testing
- Encryption strength validation
- Access control verification

### D. Deployment Checklist

#### Pre-Deployment
- [ ] All tests passing (>90% coverage)
- [ ] Security audit completed
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Smart contracts verified on Etherscan

#### Deployment Steps
1. Deploy smart contracts to testnet
2. Verify contracts on block explorer
3. Deploy backend API to cloud provider
4. Configure DNS and SSL certificates
5. Deploy React Native app to TestFlight
6. Set up monitoring and alerts
7. Configure OpenSea MCP webhooks

#### Post-Deployment
- [ ] Smoke test all critical paths
- [ ] Monitor error rates and performance
- [ ] Verify wallet connections work
- [ ] Test data upload and retrieval
- [ ] Confirm NFT minting and listing

### E. Support & Documentation

#### User Documentation
- Getting Started Guide
- FAQ Section
- Video Tutorials
- Troubleshooting Guide

#### Developer Documentation
- API Reference
- Smart Contract Documentation
- SDK Integration Guide
- Contributing Guidelines

#### Contact Information
- Technical Support: support@healthapp.io
- Security Issues: security@healthapp.io
- Business Inquiries: partnerships@healthapp.io
- Discord Community: discord.gg/healthapp

---

*This PRD is a living document and will be updated as the product evolves. Last updated: January 2025*