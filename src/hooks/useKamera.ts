// src/hooks/useKamera.ts

import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export const useKamera = () => {
  const [image, setImage] = useState<string | null>(null);

  // 1. Ambil Foto dari Galeri
  const bukaGaleri = async (
    allowEditing: boolean = true,
  ): Promise<string | null> => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Izin Diperlukan",
          "Buka pengaturan dan izinkan akses galeri, Bre!",
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: allowEditing,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setImage(uri);
        return uri;
      }
      return null;
    } catch (error) {
      Alert.alert("Error", "Gagal buka galeri, mbot!");
      return null;
    }
  };

  // 2. Pakai Kamera Standar HP
  const bukaKameraStandar = async (
    allowEditing: boolean = true,
  ): Promise<string | null> => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Izin Diperlukan", "Butuh akses kamera nih bgsddd!");
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: allowEditing,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setImage(uri);
        return uri;
      }
      return null;
    } catch (error) {
      Alert.alert("Error", "Gagal buka kamera, asuuu!");
      return null;
    }
  };

  const resetImage = () => setImage(null);

  return { image, setImage, bukaGaleri, bukaKameraStandar, resetImage };
};
