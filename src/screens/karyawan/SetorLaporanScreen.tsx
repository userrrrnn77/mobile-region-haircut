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
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { CustomButton } from "../../components/CustomButton";
import { setorLaporanHarian } from "../../api/layanan";
import { Banknote, FileText, Info, Trash2 } from "lucide-react-native";

const SetorLaporanScreen = ({ navigation }: any) => {
  const scheme = useColorScheme() || "dark";
  const theme = Colors[scheme as "light" | "dark"];

  // State
  const [revenue, setRevenue] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [expenses, setExpenses] = useState<
    { description: string; amount: number }[]
  >([]);
  const [expName, setExpName] = useState("");
  const [expAmount, setExpAmount] = useState("");

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
      return Alert.alert("Woy!", "Input omzet yang bener!");
    }

    // --- LOG DEBUGGING SEBELUM KIRIM ---
    console.log("🚀 MENGIRIM LAPORAN...");
    console.log("💰 Total Omzet:", cleanRevenue);
    console.log("📝 Catatan:", notes.trim() || "-");
    console.log("🛒 Pengeluaran:", JSON.stringify(expenses, null, 2));
    console.log("----------------------------");

    setLoading(true);
    try {
      const res = await setorLaporanHarian({
        totalRevenue: cleanRevenue,
        notes: notes.trim() || "-",
        managementExpenses: expenses,
      });

      // --- LOG DEBUGGING RESPON BE ---
      console.log("✅ RESPON SERVER:", JSON.stringify(res.data, null, 2));

      if (res.data.success) {
        Alert.alert("MANTAP BRE!", "Setoran & Laporan Pengeluaran sukses!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      // --- LOG DEBUGGING ERROR ---
      console.error("❌ ERROR SETOR:");
      if (err.response) {
        console.error("Data:", err.response.data);
        console.error("Status:", err.response.status);
      } else {
        console.error("Msg:", err.message);
      }

      Alert.alert(
        "GAGAL",
        err.response?.data?.message || "Error bre! Cek koneksi atau log.",
      );
    } finally {
      setLoading(false);
    }
  };

  const addExpense = () => {
    if (!expName || !expAmount)
      return Alert.alert("Eits!", "Isi nama barang & harganya bre!");

    setExpenses([
      ...expenses,
      {
        description: expName,
        amount: Number(expAmount.replace(/[^0-9]/g, "")),
      },
    ]);

    // Reset input jajan
    setExpName("");
    setExpAmount("");
  };

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
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

        {/* SECTION PENGELUARAN (OPSIONAL) */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>
            Pengeluaran Cabang (Opsional)
          </Text>

          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginBottom: 10,
              alignItems: "center",
            }}>
            <TextInput
              style={[
                styles.inputSmall,
                {
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Nama Barang (Silet)"
              placeholderTextColor="#999"
              value={expName}
              onChangeText={setExpName}
            />
            <TextInput
              style={[
                styles.inputSmall,
                {
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderColor: theme.border,
                  flex: 0.6,
                },
              ]}
              placeholder="Harga"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={expAmount}
              onChangeText={setExpAmount}
            />
            <CustomButton title="+" onPress={addExpense} />
          </View>

          {/* LIST JAJANAN YANG UDAH DIINPUT */}
          {expenses.map((item, index) => (
            <View
              key={index}
              style={[styles.expenseItem, { backgroundColor: theme.card }]}>
              <Text style={{ color: theme.text, flex: 1 }}>
                {item.description}
              </Text>
              <Text
                style={{
                  color: theme.primary,
                  fontWeight: "bold",
                  marginRight: 10,
                }}>
                - Rp {item.amount.toLocaleString()}
              </Text>
              <TouchableOpacity onPress={() => removeExpense(index)}>
                <Trash2 size={18} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ))}
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
  inputSmall: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 14,
  },
  expenseItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
});

export default SetorLaporanScreen;
