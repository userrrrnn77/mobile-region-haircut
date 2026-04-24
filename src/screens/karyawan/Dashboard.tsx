import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  StatusBar,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../store/AuthContext";
import { getDashboardData } from "../../api/layanan";
import { CustomButton } from "../../components/CustomButton";
import { Colors } from "../../constants/Colors"; // Import gudang cat lu bre
import { TrendingUp, Users, MapPin } from "lucide-react-native"; // Biar makin elit

const KaryawanDashboard = ({ navigation }: any) => {
  const scheme = useColorScheme() || "dark";
  // Fix TS Error: Paksa pake type 'light' | 'dark' biar kaga jembot lagi
  const theme = Colors[scheme as "light" | "dark"];

  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    statusAbsen: "...",
    totalKepala: 0,
    gajiEstimasi: 0,
    totalGajiBulanIni: 0, // <--- Tambahin ini bre
    today: "",
  });

  const date = new Date();
  const jam = date.getHours();
  const minute = date.getMinutes();
  const waktuSekarang = `jam sekarang: ${jam}.${minute} menit`;

  const [timeLeft, setTimeLeft] = useState<number>(0); // Dalam detik

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getDashboardData();
      // Karena di BE lu bungkus pake { success: true, data: { ... } }
      if (res.data?.success) {
        const dashboard = res.data.data;

        setData(dashboard);

        if (dashboard.statusAbsen === "masuk" && dashboard.checkinTime) {
          const tujuJamSetengah = 7.5 * 60 * 60 * 1000; // 7 Jam
          const waktuCheckin = new Date(dashboard.checkinTime).getTime();
          const waktuSekarang = new Date().getTime();
          const targetWaktu = waktuCheckin + tujuJamSetengah;
          const selisih = targetWaktu - waktuSekarang;

          if (selisih > 0) {
            setTimeLeft(Math.floor(selisih / 1000));
          } else {
            console.log("Status: Sudah lewat 3 jam, bebas checkout!");
            setTimeLeft(0);
          }
        }
      }
    } catch (err: any) {
      console.log("Error Dashboard:", err);
      Alert.alert("Waduh", "Gagal narik jatah cuan lu hari ini bre");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Fungsi helper buat nampilin format jam:menit:detik
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}j ${m}m ${s}d`;
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={scheme === "dark" ? "light-content" : "dark-content"}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadData}
            tintColor={theme.primary}
          />
        }>
        {/* Header Profile */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.welcome, { color: theme.text }]}>
              Halo, {user?.fullname.split(" ")[0]} 👋
            </Text>
            <View style={styles.locationWrapper}>
              <MapPin size={14} color={theme.tabIconDefault} />
              <Text style={[styles.role, { color: theme.tabIconDefault }]}>
                {user?.branchLocations[0]?.name || "Tanpa Cabang"}
              </Text>
            </View>
          </View>
          <View
            style={[styles.badge, { backgroundColor: theme.primary + "20" }]}>
            <Text
              style={{
                color: theme.primary,
                fontWeight: "bold",
                fontSize: 10,
              }}>
              {user?.role.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Card Cuan Hari Ini (Highlight Utama) */}
        <View style={[styles.card, { backgroundColor: theme.primary }]}>
          {/* BAGIAN HARIAN */}
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cardLabel}>Jatah Lu Hari Ini (40%)</Text>
              <Text style={styles.amount}>
                Rp {data.gajiEstimasi.toLocaleString("id-ID")}
              </Text>
            </View>
            <View>
              <TrendingUp size={24} color="#fff" />
            </View>
          </View>

          <View style={styles.divider} />

          {/* BAGIAN BULANAN */}
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cardLabel}>
                Total Bulan Ini (
                {new Date().toLocaleString("id-ID", { month: "long" })})
              </Text>
              <Text style={styles.amountSmall}>
                Rp {data.totalGajiBulanIni.toLocaleString("id-ID")}
              </Text>
            </View>
          </View>
        </View>

        {/* Status Absensi Section */}
        <Text style={[styles.sectionTitleInfo, { color: theme.danger }]}>
          *Sebelum Absen Pulang Jangan Lupa Input Laporan Dulu bre!!
        </Text>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Status Kehadiran
        </Text>
        <View
          style={[
            styles.statusCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}>
          <View style={styles.statusInfo}>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor:
                    data?.statusAbsen === "masuk"
                      ? theme.success
                      : theme.danger,
                },
              ]}
            />
            <View>
              <Text
                style={[styles.statusLabel, { color: theme.tabIconDefault }]}>
                Kondisi Saat Ini
              </Text>
              <Text style={[styles.statusValue, { color: theme.text }]}>
                {data?.statusAbsen === "masuk"
                  ? "Sedang Bekerja"
                  : "Belum Absen"}
              </Text>
            </View>
          </View>
          {data?.statusAbsen === "masuk" && (
            <Text style={styles.timeText}>08:00 AM</Text>
          )}
        </View>

        {/* Tombol Aksi */}
        <View style={styles.actionWrapper}>
          {data?.statusAbsen !== "masuk" ? (
            <CustomButton
              title="GAS CHECK-IN SEKARANG"
              onPress={() => navigation.navigate("CheckIn", { mode: "in" })}
            />
          ) : (
            // JIKA STATUS MASUK
            <View>
              {timeLeft > 0 ? (
                // JIKA BELUM 3 JAM
                <View style={{ marginBottom: 10 }}>
                  <CustomButton
                    title={`BELUM BISA PULANG (${formatTime(timeLeft)})`}
                    type="disabled" // Pastiin CustomButton lu punya styling buat disabled
                    onPress={() =>
                      Alert.alert(
                        "Sabar Bre!",
                        "Kerja dulu yang bener, minimal 3 jam baru boleh checkout!",
                      )
                    }
                  />
                </View>
              ) : (
                // JIKA SUDAH LEWAT 3 JAM
                <CustomButton
                  title="CHECK-OUT (SELESAI)"
                  type="danger"
                  onPress={() =>
                    navigation.navigate("CheckIn", { mode: "out" })
                  }
                />
              )}
            </View>
          )}

          <CustomButton
            title="INPUT LAPORAN (SETOR CUAN)"
            onPress={() => {
              const status = data?.statusAbsen; // Misal isinya: null, "masuk", atau "keluar"

              if (!status) {
                // Kasus 1: Belum ada record absen hari ini
                Alert.alert(
                  "Masuk Dulu Mbot",
                  "Absen masuk dulu bre, jangan mau cuannya doang! 💀",
                );
              } else if (status === "masuk") {
                // Kasus 2: Baru absen masuk, belum absen keluar
                // Sesuai request lu: suruh keluar dulu
                Alert.alert(
                  "Absen Keluar Dulu Mbot",
                  "Keluar dulu bre anjing, baru setor! 😤, yang bener kalo setoran mbot jangan ngadi ngadi elu",
                );
              } else if (status === "keluar") {
                // Kasus 3: Sudah absen keluar, jalur ijo
                navigation.navigate("SetorLaporan");
              } else if (status === "sakit") {
                Alert.alert(
                  "Lagi Sakit",
                  "Lagi sakit sok-sokan mau setor, istirahat mbot! 🤒",
                );
              }
            }}
            type="primary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  locationWrapper: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  welcome: { fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  role: { marginLeft: 4, fontSize: 13, fontWeight: "500" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  card: {
    margin: 20,
    padding: 25,
    borderRadius: 28,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { color: "#ffffffcc", fontSize: 13, fontWeight: "600" },
  amount: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
    marginVertical: 10,
  },
  divider: { height: 1, backgroundColor: "#ffffff22", marginVertical: 15 },
  statItem: { flexDirection: "row", alignItems: "center" },
  subText: { color: "#fff", fontSize: 16, fontWeight: "600", marginLeft: 6 },
  todayTag: {
    color: "#ffffff66",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  sectionTitle: {
    marginHorizontal: 25,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 15,
  },
  statusCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
  },
  statusInfo: { flexDirection: "row", alignItems: "center" },
  statusIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 15 },
  statusLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
  statusValue: { fontSize: 16, fontWeight: "700", marginTop: 2 },
  timeText: { fontSize: 12, fontWeight: "600", opacity: 0.5 },
  actionWrapper: { paddingHorizontal: 20, marginTop: 10 },
  cardLabel: {
    color: "#ffffffCC",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },

  amountSmall: {
    color: "#00ff99",
    fontSize: 20,
    fontWeight: "700",
  },

  statsInfo: {
    alignItems: "center",
    backgroundColor: "#ffffff22",
    padding: 8,
    borderRadius: 12,
    minWidth: 60,
  },
  headsCount: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  headsLabel: {
    color: "#fff",
    fontSize: 10,
  },
  statsIcon: {
    color: "white",
  },
  sectionTitleInfo: {
    marginHorizontal: 25,
    fontSize: 12,
    fontWeight: "400",
    marginTop: 10,
  },
});

export default KaryawanDashboard;
