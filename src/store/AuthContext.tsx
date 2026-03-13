// src/store/AuthContext.tsx

import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login as loginApi } from "../api/layanan";
import API from "../api/api";

// --- 1. INTERFACES (Sesuai Model Mongoose Lu, Bgsddd!) ---

interface IBranch {
  _id: string;
  code: string;
  name: string;
  center: { lat: number; lng: number };
  radiusMeter: number;
  isActive: boolean;
}

interface User {
  _id: string;
  username: string;
  fullname: string;
  email: string;
  role: "owner" | "karyawan";
  avatar: string;
  branchLocations: IBranch[]; // Populated dari backend mbot!
  authMethod: string;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserData: (newData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // --- 2. RESTORE SESSION (Pas Aplikasi Start) ---
  useEffect(() => {
    async function loadStorageData() {
      try {
        const storagedUser = await AsyncStorage.getItem("@Haircut:user");
        const storagedToken = await AsyncStorage.getItem("userToken");

        if (storagedUser && storagedToken) {
          setUser(JSON.parse(storagedUser));
          // Pasang token ke axios buat request selanjutnya
          API.defaults.headers.Authorization = `Bearer ${storagedToken}`;
        }
      } catch (e) {
        console.error("Gagal restore session, mbot!", e);
      } finally {
        setLoading(false);
      }
    }
    loadStorageData();
  }, []);

  // --- 3. FUNGSI SIGN IN ---
  const signIn = async (email: string, password: string) => {
    try {
      const response = await loginApi(email, password);
      const { token, user: userData } = response.data;

      // Simpan ke State
      setUser(userData);

      // Simpan ke Device Storage (Satu-satu biar kaga error typing)
      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("@Haircut:user", JSON.stringify(userData));

      // Set Global Header Axios
      API.defaults.headers.Authorization = `Bearer ${token}`;
    } catch (error: any) {
      // Lempar error buat dihandle di UI Login (Biar muncul Alert)
      throw (
        error.response?.data?.message || "Login Gagal, Bre! Cek Backend lu!" // kenapa muncul ini memek
      );
    }
  };

  // --- 4. FUNGSI SIGN OUT (FIXED: Anti 'multiRemove' Error) ---
  const signOut = async () => {
    try {
      // Hapus satu-satu pake Promise.all biar kenceng & kaga error
      await Promise.all([
        AsyncStorage.removeItem("userToken"),
        AsyncStorage.removeItem("@Haircut:user"),
      ]);

      setUser(null);
      // Hapus header biar request selanjutnya kaga bawa token basi
      delete API.defaults.headers.Authorization;
    } catch (e) {
      console.error("Gagal logout, bgsd!", e);
    }
  };

  // --- 5. FUNGSI UPDATE DATA (Buat Profile/Avatar) ---
  const updateUserData = (newData: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...newData };
      setUser(updated);
      AsyncStorage.setItem("@Haircut:user", JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signIn,
        signOut,
        updateUserData,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook sakti biar tinggal panggil di Screen
export const useAuth = () => useContext(AuthContext);
