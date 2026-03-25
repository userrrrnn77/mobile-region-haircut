// src/api/api.ts

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

const API = axios.create({
  baseURL: "https://regionhaircut.vercel.app/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.clear();
      Alert.alert(
        "Sesi Berakhir",
        "AKun Tidak Ditemukan atau Token Kadaluarsa. Silahkan Login Ulang",
      );
    }
    return Promise.reject(error);
  },
);

export default API;
