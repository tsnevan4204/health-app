# HealthKit Integration Setup

## Overview
This React Native app integrates with Apple HealthKit to access and store health data on iOS devices. The integration uses the `react-native-health` library with Expo's custom development client.

## Prerequisites
- iOS device or simulator running iOS 12.0+
- Xcode installed on macOS
- Apple Developer account (for device testing)
- Node.js and npm installed

## Dependencies
The following packages are required for HealthKit integration:
- `react-native-health`: ^1.19.0
- `expo-dev-client`: ^5.2.4
- `expo`: ~53.0.20

## Setup Instructions

### 1. Install Dependencies
```bash
npm install react-native-health expo-dev-client
```

### 2. Configure iOS Permissions
The following permissions are configured in `ios/mobile/Info.plist`:
- `NSHealthShareUsageDescription`: Permission to read health data
- `NSHealthUpdateUsageDescription`: Permission to write health data
- `UIRequiredDeviceCapabilities`: Includes 'healthkit' capability

### 3. Configure Expo Plugin
In `app.json`, the react-native-health plugin is configured:
```json
{
  "expo": {
    "plugins": [
      [
        "react-native-health",
        {
          "healthSharePermission": "This app needs access to your health data to provide personalized insights and enable challenges.",
          "healthUpdatePermission": "This app may write health data for challenge tracking."
        }
      ]
    ]
  }
}
```

### 4. Build the iOS App
Since HealthKit requires native code, you must build a custom development client:
```bash
npx expo run:ios
```

## Implementation Details

### Service Architecture
The HealthKit integration is implemented in `src/services/healthKit.ts` with the following key features:

1. **Graceful Fallback**: The service automatically falls back to mock data if HealthKit is unavailable
2. **Permission Management**: Separate initialization and permission request flows
3. **Data Types Supported**:
   - Heart Rate Variability (HRV)
   - Resting Heart Rate
   - Active Energy Burned
   - Exercise Minutes

### Key Methods

- `initialize()`: Checks HealthKit availability without requesting permissions
- `requestPermissions()`: Explicitly requests user permission for health data access
- `getAllHealthData()`: Fetches all supported health metrics for a date range
- `isUsingMockData()`: Returns whether the app is using mock or real data

### Permission Flow
1. App starts with mock data (no automatic permission request)
2. User taps "Connect to Apple Health" button
3. iOS displays HealthKit permission dialog
4. Upon granting permissions, app switches to real health data

## Testing

### Simulator Testing
HealthKit is not available on iOS simulators. The app will automatically use mock data when running on a simulator.

### Device Testing
1. Connect your iOS device to your Mac
2. Build and run the app: `npx expo run:ios --device`
3. Navigate to the Health Import screen
4. Tap "Connect to Apple Health" to trigger permission dialog
5. Grant permissions in the iOS dialog
6. The app will now access real health data

## Troubleshooting

### Common Issues

1. **"HealthKit not available" error**
   - Ensure you're testing on a real iOS device, not a simulator
   - Verify HealthKit capability is enabled in Xcode project settings

2. **Permission dialog not appearing**
   - Check that Info.plist contains proper usage descriptions
   - Ensure the device has HealthKit enabled in Settings > Privacy > Health

3. **Module not found errors**
   - Run `npx expo run:ios` to rebuild with native modules
   - Clear Metro bundler cache: `npx expo start --clear`

4. **Build errors**
   - Clean build folder: `cd ios && rm -rf build && cd ..`
   - Reinstall pods: `cd ios && pod install && cd ..`

## API Reference

### HealthMetric Interface
```typescript
interface HealthMetric {
  timestamp: string;
  metric: string;
  value: number;
  unit: string;
  source: string;
  device?: string;
}
```

### HealthDataRange Interface
```typescript
interface HealthDataRange {
  startDate: Date;
  endDate: Date;
}
```

## Security Considerations
- Health data is sensitive personal information
- Always request minimum necessary permissions
- Never store health data in unencrypted storage
- Follow Apple's HealthKit guidelines for data handling

## Additional Resources
- [Apple HealthKit Documentation](https://developer.apple.com/documentation/healthkit)
- [react-native-health GitHub](https://github.com/agencyenterprise/react-native-health)
- [Expo Custom Development Clients](https://docs.expo.dev/development/create-development-builds/)