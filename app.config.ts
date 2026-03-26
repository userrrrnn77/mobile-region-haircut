import "dotenv/config";
import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Haircut Region",
  slug: "haircut-region-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon-region.png",
  userInterfaceStyle: "dark",
  splash: {
    image: "./assets/splash-region.png",
    resizeMode: "contain",
    backgroundColor: "#000",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.haircutregion",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon-region.png",
      backgroundColor: "#000",
    },
    package: "com.haircutregion",
  },
  extra: {
    baseUrl: process.env.EXPOBASEURL || "https://regionhaircut.vercel.app/api",
    eas: {
      projectId: "4d5b0956-8afd-4b54-a823-2defd8a71379",
    },
  },
});
