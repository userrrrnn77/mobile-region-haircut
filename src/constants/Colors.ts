// src/constants/Colors.ts

const primaryBlue = "#003a61";

export type ThemeType = "light" | "dark";

export const Colors: Record<ThemeType, any> = {
  light: {
    text: "#11181C",
    background: "#F2F2F2",
    tint: primaryBlue,
    tabIconDefault: "#9BA1A6",
    card: "#FFFFFF",
    border: "#E1E4E8",
    primary: primaryBlue,
    danger: "#FF3B30",
    success: "#34C759",
  },
  dark: {
    text: "#ECEDEE",
    background: "#121212", // Dark mode murni biar gak sakit mata
    tint: "#5FA8D3", // Biru agak terang buat aksen di dark mode
    tabIconDefault: "#9BA1A6",
    card: "#1E1E1E",
    border: "#333333",
    primary: primaryBlue,
    danger: "#FF453A",
    success: "#32D74B",
  },
};
