# Xcode Setup Guide for Health App

## Prerequisites

1. **Install Xcode** (not just Command Line Tools)
   - Download from App Store or Apple Developer Portal
   - Launch Xcode and accept license agreement
   - Install additional components when prompted

2. **Set Xcode as active developer directory**
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```

3. **Verify Xcode installation**
   ```bash
   xcodebuild -version
   # Should show Xcode version, not command line tools
   ```

## Step-by-Step Setup

### 1. Clean and Rebuild iOS Project

```bash
cd mobile

# Clean any previous builds
rm -rf ios/
rm -rf node_modules/
npm cache clean --force

# Reinstall dependencies
npm install

# Generate iOS project
npx expo prebuild --clean --platform ios
```

### 2. Install CocoaPods Dependencies

```bash
cd ios
pod install
```

### 3. Configure HealthKit in Xcode

Open the project in Xcode:
```bash
open ios/mobile.xcworkspace
```

**Important:** Open the `.xcworkspace` file, NOT the `.xcodeproj` file.

### 4. Add HealthKit Capability

1. In Xcode, select your project in the navigator (top item)
2. Select your app target (usually named "mobile")
3. Go to "Signing & Capabilities" tab
4. Click "+ Capability" button
5. Search for and add "HealthKit"
6. Check "Clinical Health Records" if needed

### 5. Configure Info.plist

In Xcode, open `Info.plist` and add these entries:

```xml
<key>NSHealthShareUsageDescription</key>
<string>This app needs access to your health data to provide personalized insights and enable challenges.</string>

<key>NSHealthUpdateUsageDescription</key>
<string>This app may write health data for challenge tracking.</string>

<key>NSHealthClinicalHealthRecordsShareUsageDescription</key>
<string>This app needs access to clinical records for comprehensive health analysis.</string>
```

Or add via Xcode UI:
1. Open `Info.plist`
2. Click "+" to add new entry
3. Add keys:
   - "Privacy - Health Share Usage Description"
   - "Privacy - Health Update Usage Description"
   - "Privacy - Health Records Usage Description"

### 6. Configure Bundle Identifier

1. In "Signing & Capabilities", update Bundle Identifier to your unique ID
2. Example: `com.yourcompany.healthapp`
3. Enable "Automatically manage signing" if using personal Apple ID

### 7. Build and Run

#### Option A: Run from Xcode
1. Select your target device or simulator
2. Click the "Play" button (▶️) in Xcode
3. Wait for build to complete

#### Option B: Run from Terminal
```bash
# From mobile/ directory
npx expo run:ios
```

### 8. Test HealthKit Integration

1. On device: Go to Settings > Health > Data Access & Devices
2. Find your app and grant permissions
3. In simulator: Use Health app to add sample data

## Troubleshooting

### Common Issues

**"SDK 'iphoneos' cannot be located"**
```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
xcodebuild -runFirstLaunch
```

**"No provisioning profiles found"**
- Add Apple ID in Xcode Preferences > Accounts
- Enable "Automatically manage signing"

**"HealthKit not available"**
- Ensure you're testing on device (some features limited in simulator)
- Check capability is properly added
- Verify Info.plist permissions

**Build fails with pod errors**
```bash
cd ios
pod deintegrate
pod install
```

### Device vs Simulator Testing

**Simulator:**
- Basic HealthKit features work
- Use Health app to add sample data
- Some advanced features may not work

**Physical Device:**
- Full HealthKit functionality
- Real health data integration
- Requires Developer account for deployment

## Environment Setup

Create `.env` file in `mobile/` directory:

```bash
# Walrus Configuration
WALRUS_API_URL=https://walrus-testnet.example.com
WALRUS_API_KEY=your_test_key

# Development flags
DEBUG_MODE=true
SKIP_WALRUS_UPLOAD=true  # For testing without network
```

## Testing Strategy

### 1. Simulator Testing
```bash
# Start metro bundler
npx expo start

# Open iOS simulator
i  # Press 'i' in metro terminal
```

### 2. Device Testing
```bash
# Connect device via USB
# Enable Developer Mode in Settings > Privacy & Security
npx expo run:ios --device
```

### 3. Health Data Testing

Add sample data in Health app:
1. Open Health app
2. Browse > Heart > Heart Rate Variability
3. Add data points for testing
4. Set date range to last 30 days

## Production Considerations

### App Store Requirements

1. **Privacy Policy**: Required for HealthKit apps
2. **Purpose Strings**: Clear, specific descriptions
3. **Data Usage**: Document what health data is used and why
4. **Security**: Highlight encryption and privacy measures

### Distribution Certificate

For production builds:
1. Join Apple Developer Program ($99/year)
2. Create Distribution Certificate
3. Configure App Store Connect
4. Submit for review

## Debug Tips

### Health Data Issues
```javascript
// Add to HealthImportScreen for debugging
console.log('HealthKit available:', await HealthKitService.initialize());
console.log('Permissions:', permissions);
```

### Walrus Upload Issues
```javascript
// Use simulation mode for testing
const blob = await WalrusService.simulateUpload(data);
```

### Build Issues
- Clean derived data: Xcode > Window > Organizer > Projects > Delete
- Reset simulator: Device > Erase All Content and Settings
- Clear Metro cache: `npx expo start --clear`

## Next Steps

Once the app runs successfully:

1. **Test HealthKit Integration**
   - Grant permissions
   - Fetch sample data
   - Verify date ranges

2. **Test Walrus Upload**
   - Use simulation mode first
   - Verify encryption works
   - Check manifest generation

3. **Integrate Privy Wallet**
   - Add authentication
   - Connect to smart contracts

4. **Build Challenge Features**
   - Create challenge UI
   - Add Web3 integration