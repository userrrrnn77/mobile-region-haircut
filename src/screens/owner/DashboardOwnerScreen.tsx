// src/screens/owner/DashboardOwnerScreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
  TouchableOpacity,
  Modal,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart } from "react-native-chart-kit";
import { Colors } from "../../constants/Colors";
import {
  getLaporanHarian,
  getAllBranches,
  getDashboardData,
} from "../../api/layanan";
import {
  Banknote,
  Users,
  Store,
  TrendingUp,
  Filter,
  ChevronDown,
  X,
} from "lucide-react-native";

const screenWidth = Dimensions.get("window").width;

const DashboardOwnerScreen = () => {
  const scheme = useColorScheme() || "dark";
  const theme = Colors[scheme as "light" | "dark"];

  // State Data
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOwner: 0,
    totalEmployee: 0,
    totalManagement: 0,
  });
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: any[];
  }>({
    labels: ["-"],
    datasets: [{ data: [0] }],
  });

  // State Filter
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<{
    id: string;
    name: string;
  }>({ id: "", name: "Semua Cabang" });
  const [showFilter, setShowFilter] = useState(false);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const resBranch = await getAllBranches();

      // DEBUG: Liat di console lu isinya array apa bukan
      console.log("DATA BRANCH BRE:", resBranch.data);

      // Kadang API balikin { success: true, data: [...] }
      // Jadi kita cek mana yang isinya array
      if (Array.isArray(resBranch.data)) {
        setBranches(resBranch.data);
      } else if (resBranch.data && Array.isArray(resBranch.data.data)) {
        setBranches(resBranch.data.data);
      }

      await fetchData();
    } catch (err) {
      console.error("INIT_ERR:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (branchId = selectedBranch.id) => {
    try {
      // 1. Ambil Summary (Buat kotak-kotak atas)
      const resDash = await getDashboardData();

      let currentTotalRevenue = 0; // Backup buat jaga-jaga chart zonk

      if (resDash.data.success) {
        const s = resDash.data.summary;
        setSummary({
          totalRevenue: s?.totalRevenue || 0,
          totalOwner: s?.totalOwner || 0,
          totalEmployee: s?.totalEmployee || 0,
          totalManagement: s?.totalManagement || 0,
        });
        currentTotalRevenue = s?.totalRevenue || 0;
      }

      // 2. Setting Range Tanggal (Bulan Berjalan)
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const today = now.toISOString().split("T")[0];

      // 3. Ambil Data History buat Chart
      const resHistory = await getLaporanHarian({
        branchId: branchId || undefined,
        startDate: firstDay,
        endDate: today,
      });

      // Ambil array datanya (sesuai log lu tadi: resHistory.data.data)
      const historyArray = resHistory.data?.data || [];

      if (Array.isArray(historyArray) && historyArray.length > 0) {
        const monthlyMap: Record<string, number> = {};

        historyArray.forEach((item: any) => {
          // Fallback tanggal: reportDate atau createdAt
          const rawDate = item.reportDate || item.createdAt;
          if (rawDate) {
            const d = new Date(rawDate);
            const tgl = d.getDate().toString();

            // Sesuai controller backend lu: totalSetoran (jatah owner)
            // Omzet total = totalSetoran / 0.5 (alias kali 2)
            const jatahOwner = item.totalSetoran || item.ownerShare || 0;
            const omzet = jatahOwner * 2;

            monthlyMap[tgl] = (monthlyMap[tgl] || 0) + omzet;
          }
        });

        const sortedLabels = Object.keys(monthlyMap).sort(
          (a, b) => parseInt(a) - parseInt(b),
        );
        const dataValues = sortedLabels.map((label) => monthlyMap[label]);

        setChartData({
          labels: sortedLabels,
          datasets: [
            {
              data: dataValues,
              color: (opacity = 1) => theme.primary,
            },
          ],
        });
      } else {
        // FALLBACK: Kalo history zonk, tampilin data hari ini aja biar chart gak mati
        const tglHariIni = now.getDate().toString();
        setChartData({
          labels: [tglHariIni],
          datasets: [
            {
              data: [currentTotalRevenue],
              color: (opacity = 1) => theme.primary,
            },
          ],
        });
      }
    } catch (err) {
      console.log("Salah di mari asu:", err);
      // Biar kaga nge-hang aplikasinya
      setChartData({ labels: ["!"], datasets: [{ data: [0] }] });
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSelectBranch = (id: string, name: string) => {
    setSelectedBranch({ id, name });
    setShowFilter(false);
    fetchData(id);
  };

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={scheme === "dark" ? "light-content" : "dark-content"}
      />

      {/* HEADER & FILTER TRIGGER */}
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>
            DASHBOARD OWNER
          </Text>
          <Text style={[styles.subtitle, { color: theme.tabIconDefault }]}>
            Cuan Berdasarkan:{" "}
            <Text style={{ color: theme.primary }}>{selectedBranch.name}</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          onPress={() => setShowFilter(true)}>
          <Filter size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.primary}
            style={{ marginTop: 50 }}
          />
        ) : (
          <>
            {/* CHART LINE */}
            {/* SECTION CHART REVENUE BULANAN */}
            <View
              style={[
                styles.chartBox,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.text, marginBottom: 10 },
                ]}>
                Statistik Revenue (Bulan Ini)
              </Text>

              <LineChart
                data={chartData}
                width={screenWidth - 70} // Menyesuaikan lebar layar minus padding
                height={220} // Space ekstra biar label tanggal di bawah aman
                chartConfig={{
                  backgroundColor: theme.card,
                  backgroundGradientFrom: theme.card,
                  backgroundGradientTo: theme.card,
                  decimalPlaces: 0, // Gak pake koma-komaan di angka
                  color: (opacity = 1) => theme.primary, // Warna garis utama
                  labelColor: (opacity = 1) => theme.text, // Warna teks label (X & Y)
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: theme.primary,
                  },
                  // LOGIC FORMAT ANGKA SUMBU Y (Biar 1.000.000 jadi 1M)
                  formatYLabel: (value) => {
                    const numericValue = parseInt(value);
                    if (numericValue >= 1000000)
                      return (numericValue / 1000000).toFixed(1) + "M";
                    if (numericValue >= 1000)
                      return (numericValue / 1000).toFixed(0) + "rb";
                    return value;
                  },
                }}
                bezier // Biar garisnya melengkung (smooth), bukan kaku
                style={{
                  marginVertical: 10,
                  borderRadius: 16,
                  marginLeft: -15, // Supaya angka di sumbu Y nggak kepotong layar kiri
                }}
              />

              <Text
                style={{ color: "#888", fontSize: 10, textAlign: "center" }}>
                *Data di-reset otomatis setiap awal bulan
              </Text>
            </View>

            {/* SUMMARY GRID */}
            <View style={styles.grid}>
              <StatCard
                title="Total Omzet"
                value={formatIDR(summary.totalRevenue)}
                icon={<Banknote color="#fff" />}
                color={theme.primary}
              />
              <StatCard
                title="Jatah Owner"
                value={formatIDR(summary.totalOwner)}
                icon={<TrendingUp color="#fff" />}
                color={theme.success}
              />
              <StatCard
                title="Gaji Karyawan"
                value={formatIDR(summary.totalEmployee)}
                icon={<Users color="#fff" />}
                color="#fd7e14"
              />
              <StatCard
                title="Kas Management"
                value={formatIDR(summary.totalManagement)}
                icon={<Store color="#fff" />}
                color="#6f42c1"
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* MODAL FILTER BRANCH */}
      <Modal visible={showFilter} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Pilih Cabang
              </Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <X color={theme.text} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.branchItem}
              onPress={() => handleSelectBranch("", "Semua Cabang")}>
              <Text
                style={{
                  color: selectedBranch.id === "" ? theme.primary : theme.text,
                  fontWeight: "bold",
                }}>
                Semua Cabang
              </Text>
            </TouchableOpacity>
            {Array.isArray(branches) && // oke ini dulu deh, ini kenapa munculnya cuma semua branch bre, gw udah ada 1 branch, gw mau filter pake branch itu mbot
              branches?.map((b) => (
                <TouchableOpacity
                  key={b._id}
                  style={styles.branchItem}
                  onPress={() => handleSelectBranch(b._id, b.name)}>
                  <Text
                    style={{
                      color:
                        selectedBranch.id === b._id
                          ? theme.primary
                          : theme.text,
                    }}>
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <View style={[styles.card, { backgroundColor: color }]}>
    <View style={styles.cardHeader}>
      {icon}
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <Text style={styles.cardValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: { fontSize: 22, fontWeight: "900" },
  subtitle: { fontSize: 12 },
  filterBtn: { padding: 10, borderRadius: 12, borderWidth: 1 },
  chartBox: { padding: 15, borderRadius: 20, borderWidth: 1, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "bold" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    padding: 15,
    borderRadius: 18,
    marginBottom: 15,
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  cardTitle: { color: "#fff", fontSize: 11, fontWeight: "bold", marginLeft: 5 },
  cardValue: { color: "#fff", fontSize: 15, fontWeight: "900" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  branchItem: {
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
});

export default DashboardOwnerScreen;
