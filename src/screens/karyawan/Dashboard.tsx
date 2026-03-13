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

const KaryawanDashboard = () => {
  const scheme = useColorScheme() || "dark";
  // Fix TS Error: Paksa pake type 'light' | 'dark' biar kaga jembot lagi
  const theme = Colors[scheme as "light" | "dark"];

  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    statusAbsen: "...",
    totalKepala: 0,
    gajiEstimasi: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getDashboardData();
      setData(res.data.data);
    } catch (err: any) {
      console.log(err);
      Alert.alert("Error", "Gagal narik data cuan hari ini bre");
    } finally {
      setLoading(false);
    }
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
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Estimasi Jatah Lu (40%)</Text>
            <TrendingUp size={20} color="#ffffff88" />
          </View>
          <Text style={styles.amount}>
            Rp {data.gajiEstimasi.toLocaleString("id-ID")}
          </Text>

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <View style={styles.statItem}>
              <Users size={16} color="#ffffffaa" />
              <Text style={styles.subText}>{data.totalKepala} Kepala</Text>
            </View>
            <Text style={styles.todayTag}>HARI INI</Text>
          </View>
        </View>

        {/* Status Absensi Section */}
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
                    data.statusAbsen === "masuk" ? theme.success : theme.danger,
                },
              ]}
            />
            <View>
              <Text
                style={[styles.statusLabel, { color: theme.tabIconDefault }]}>
                Kondisi Saat Ini
              </Text>
              <Text style={[styles.statusValue, { color: theme.text }]}>
                {data.statusAbsen === "masuk"
                  ? "Sedang Bekerja"
                  : "Belum Absen"}
              </Text>
            </View>
          </View>
          {data.statusAbsen === "masuk" && (
            <Text style={styles.timeText}>08:00 AM</Text>
          )}
        </View>

        {/* Tombol Aksi */}
        <View style={styles.actionWrapper}>
          {data.statusAbsen !== "masuk" ? (
            <CustomButton
              title="GAS CHECK-IN SEKARANG"
              onPress={() =>
                Alert.alert("GPS Ready", "Masuk radius 7 meter bre?")
              }
            />
          ) : (
            <CustomButton
              title="CHECK-OUT (SELESAI)"
              type="danger"
              onPress={() => Alert.alert("Yakin?", "Cuan udah cukup nih?")}
            />
          )}
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
});

export default KaryawanDashboard;
