// src/hooks/useLokasi.ts

import { useState } from "react";
import * as Location from "expo-location";
import { Alert } from "react-native";

interface Koordinat {
  lat: number;
  lng: number;
}

export const useLokasi = () => {
  const [lokasi, setLokasi] = useState<Koordinat | null>(null);
  const [loadingLokasi, setLoadingLokasi] = useState<boolean>(false);

  const ambilLokasi = async (): Promise<Koordinat | null> => {
    setLoadingLokasi(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Izin Ditolak", "Aplikasi butuh akses lokasi buat absen!");
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      if (location.mocked) {
        Alert.alert(
          "Curang!",
          "Fake GPS terdeteksi, jangan macem-macem lu bre!",
        );
        return null;
      }

      const koordinat: Koordinat = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      setLokasi(koordinat);
      return koordinat;
    } catch (error) {
      Alert.alert("Error", "Gagal ambil lokasi. GPS nyala kaga mbot?");
      return null;
    } finally {
      setLoadingLokasi(false);
    }
  };

  const hitungJarakSederhana = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371e3; // Radius bumi meter
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return { lokasi, ambilLokasi, loadingLokasi, hitungJarakSederhana };
};
