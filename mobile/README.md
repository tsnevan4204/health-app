# Health Data Mobile App

React Native app for importing health data from Apple HealthKit and storing it on Walrus decentralized storage.

## Features

- ✅ Apple HealthKit integration (HRV, RHR, Calories, Exercise)
- ✅ Client-side AES-256-GCM encryption
- ✅ Walrus decentralized storage
- ✅ Dataset manifest generation
- ✅ Privacy-preserving data handling

## Setup

### Prerequisites

1. iOS device or simulator with iOS 13+
2. Apple Developer account (for HealthKit)
3. Node.js 18+
4. Expo CLI

### Installation

```bash
# Install dependencies
npm install

# For iOS, you'll need to configure HealthKit in Xcode
npx expo prebuild
cd ios && pod install
```

### HealthKit Configuration (iOS)

1. Open `ios/mobile.xcworkspace` in Xcode
2. Select your project in the navigator
3. Go to "Signing & Capabilities"
4. Add "HealthKit" capability
5. Check "Clinical Health Records" if needed
6. In `Info.plist`, add:

```xml
<key>NSHealthShareUsageDescription</key>
<string>This app needs access to your health data to provide personalized insights and enable challenges.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>This app does not write health data.</string>
```

### Environment Variables

Create a `.env` file in the mobile directory:

```bash
WALRUS_API_URL=https://walrus-testnet.example.com
WALRUS_API_KEY=your_api_key_here
```

## Architecture

### Services

- **healthKit.ts**: Interfaces with Apple HealthKit API
- **encryption.ts**: Handles AES-256-GCM encryption
- **walrus.ts**: Manages Walrus storage operations

### Data Flow

1. User grants HealthKit permissions
2. App fetches health metrics for selected date range
3. Data is encrypted client-side
4. Encrypted blobs uploaded to Walrus
5. Manifest created with blob references
6. Manifest uploaded to Walrus

### Security

- All health data encrypted before leaving device
- No PII stored in manifests
- Differential privacy applied to datasets
- K-anonymity (k≥20) for published data

## Usage

### Basic Flow

```typescript
// 1. Initialize HealthKit
await HealthKitService.initialize();

// 2. Fetch health data
const data = await HealthKitService.getAllHealthData({
  startDate: new Date('2024-12-01'),
  endDate: new Date('2025-01-01')
});

// 3. Upload to Walrus
const blob = await WalrusService.uploadHealthData(data.hrv, {
  metric: 'hrv',
  startDate,
  endDate,
  samples: data.hrv.length
});

// 4. Create manifest
const manifest = await WalrusService.createManifest(blobs, metadata);
```

## Testing

### Simulator Testing

For testing without real health data:

1. Use Xcode's Health app in simulator
2. Add sample data via Health app
3. Or use the `simulateUpload` method in WalrusService

### Real Device Testing

1. Build to device with developer certificate
2. Grant HealthKit permissions
3. Ensure device has health data available

## Troubleshooting

### Common Issues

**HealthKit not available**
- Ensure capability added in Xcode
- Check Info.plist permissions
- Verify on real device (not simulator for full features)

**Upload fails**
- Check network connection
- Verify Walrus API credentials
- Check encryption service initialization

**No health data returned**
- Verify date range has data
- Check specific metric permissions granted
- Ensure Apple Watch/iPhone has synced data

## Next Steps

- [ ] Add Privy wallet authentication
- [ ] Implement smart contract integration
- [ ] Add AI query interface
- [ ] Build challenge creation flow
- [ ] Integrate NFT minting

## License

MIT