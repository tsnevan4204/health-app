import 'dotenv/config';

export default {
  expo: {
    name: "Wellrus",
    slug: "wellrus-health",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.wellrus.health"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "react-native-health",
        {
          healthSharePermission: "This app needs access to your health data to provide personalized insights and enable challenges.",
          healthUpdatePermission: "This app may write health data for challenge tracking."
        }
      ]
    ],
    extra: {
      // Environment variables accessible via Constants.expoConfig.extra
      privyAppId: process.env.PRIVY_APP_ID,
      flowAddress: process.env.FLOW_ADDRESS,
    }
  }
};