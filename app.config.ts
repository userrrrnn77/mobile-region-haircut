import "dotenv/config";
import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "HaircutRegionApp",
  slug: "haircut-region-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#003a61",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.haircutregion",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#003a61",
    },
    package: "com.haircutregion",
  },
  extra: {
    baseUrl: process.env.EXPOBASEURL || "http://192.168.1.6:5000/api",
    eas: {
      projectId: "isi-nanti-kalo-udah-pake-eas",
    },
  },
});
