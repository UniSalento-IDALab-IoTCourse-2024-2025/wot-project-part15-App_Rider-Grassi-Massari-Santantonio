import 'dotenv/config';

export default {
  expo: {
    name: "FastGoRider",
    slug: "FastGoRider",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/Supercat _preview_rev_1.png",
    scheme: "fastgorider",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    extra: {
      eas: {
        projectId: "be14434b-9933-4b57-8f26-c6508ca3e730"
      }
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.fastgo.rider",
      infoPlist: {
        NSBluetoothAlwaysUsageDescription: "L'app usa il bluetooth per connettersi al box",
        NSBluetoothPeripheralUsageDescription: "L'app usa il bluetooth per connettersi al box",
        NSLocationWhenInUseUsageDescription: "Serve la posizione per la consegna"
      }
    },
    android: {
      package: "com.fastgo.rider",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      permissions: [
        "INTERNET",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "BLUETOOTH",
        "BLUETOOTH_ADMIN",
        "BLUETOOTH_CONNECT",
        "BLUETOOTH_SCAN",
        "POST_NOTIFICATIONS"
      ],
      usesCleartextTraffic: true,
      config: {
        googleMaps: {

          apiKey: ""
        }
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000"
          }
        }
      ],

      [
        "react-native-ble-plx",
        {
          isBackgroundEnabled: true, 
          modes: ["central"],
          bluetoothAlwaysPermission: "Allow FastGo to connect to the Raspberry Pi",
          bluetoothPeripheralPermission: "Allow FastGo to discover the box"
        }
      ],
      "expo-location",
      "expo-secure-store",
      [
        "expo-notifications", 
        {
          "icon": "./assets/images/icon.png", 
          "color": "#2563EB",
          "defaultChannel": "default"
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    }
  }
};