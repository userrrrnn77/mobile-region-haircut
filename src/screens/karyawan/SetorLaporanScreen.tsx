// src/screens/karyawan/SetorLaporanScreen.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  useColorScheme,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { CustomButton } from "../../components/CustomButton";
import { setorLaporanHarian } from "../../api/layanan";
import { Banknote, FileText, Info } from "lucide-react-native";

const SetorLaporanScreen = ({ navigation }: any) => {
  const scheme = useColorScheme() || "dark";
  const theme = Colors[scheme as "light" | "dark"];

  // State
  const [revenue, setRevenue] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Helper: Format Rupiah buat tampilan
  const formatRupiah = (val: string) => {
    const numberString = val.replace(/[^0-9]/g, "");
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(numberString) || 0);
  };

  // Logic: Hitung Estimasi Gaji (40% sesuai Model)
  const estimasiGaji = Math.round(
    (Number(revenue.replace(/[^0-9]/g, "")) || 0) * 0.4,
  );

  const handleSetor = async () => {
    const cleanRevenue = Number(revenue.replace(/[^0-9]/g, ""));

    if (!cleanRevenue || cleanRevenue <= 0) {
      return Alert.alert(
        "Woy!",
        "Input omzet yang bener, jangan 0 atau kosong asu!",
      );
    }

    setLoading(true);
    try {
      // Tembak API (Sesuai layanan.ts: totalRevenue & notes)
      const res = await setorLaporanHarian({
        totalRevenue: cleanRevenue,
        notes: notes.trim() || "-",
      });

      if (res.data.success) {
        Alert.alert(
          "MANTAP BRE!",
          `Setoran Rp ${cleanRevenue.toLocaleString()} sukses!\nJatah lu hari ini: Rp ${estimasiGaji.toLocaleString()}`,
          [{ text: "OK", onPress: () => navigation.goBack() }],
        );
      }
    } catch (err: any) {
      Alert.alert(
        "GAGAL",
        err.response?.data?.message || "Internal Server Error bgsd",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={scheme === "dark" ? "light-content" : "dark-content"}
      />

      <ScrollView contentContainerStyle={{ padding: 25 }}>
        <Text style={[styles.title, { color: theme.text }]}>SETOR CUAN</Text>
        <Text style={[styles.subtitle, { color: theme.tabIconDefault }]}>
          Input omzet hari ini, BE bakal otomatis ngitung share 50-40-10.
        </Text>

        {/* Input Omzet */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>
            Total Omzet (Revenue)
          </Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}>
            <Banknote
              size={24}
              color={theme.primary}
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Contoh: 500000"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={revenue}
              onChangeText={setRevenue}
            />
          </View>
          <Text style={[styles.previewRupiah, { color: theme.primary }]}>
            {formatRupiah(revenue)}
          </Text>
        </View>

        {/* Info Card: Estimasi Gaji */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.primary + "15",
              borderColor: theme.primary,
            },
          ]}>
          <Info size={20} color={theme.primary} />
          <View style={{ marginLeft: 10 }}>
            <Text style={{ color: theme.text, fontSize: 12 }}>
              Estimasi Jatah Lu (40%):
            </Text>
            <Text
              style={{ color: theme.primary, fontWeight: "900", fontSize: 18 }}>
              Rp {estimasiGaji.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Input Catatan */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>
            Catatan (Opsional)
          </Text>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                alignItems: "flex-start",
                paddingVertical: 10,
              },
            ]}>
            <FileText
              size={24}
              color={theme.primary}
              style={{ marginRight: 10, marginTop: 5 }}
            />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Misal: Rame banget bre, atau ada tips dikit..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        <View style={{ marginTop: 40 }}>
          <CustomButton
            title="KIRIM LAPORAN SEKARANG"
            onPress={handleSetor}
            loading={loading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "bold", marginBottom: 8, marginLeft: 5 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 60,
  },
  input: { flex: 1, fontSize: 18, fontWeight: "bold" },
  previewRupiah: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 25,
    borderStyle: "dashed",
  },
  modalContent: {
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
});

export default SetorLaporanScreen;
