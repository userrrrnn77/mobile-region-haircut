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

  const [reports, setReports] = useState<any[]>([]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const resBranch = await getAllBranches();

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
      // 1. Setting Range Tanggal (Bulan Berjalan)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");

      const firstDay = `${year}-${month}-01`;
      const today = `${year}-${month}-${day}`;

      // 2. Ambil Data History (Ini sumber kebenaran kita, Bre!)
      const resHistory = await getLaporanHarian({
        branchId: branchId || undefined,
        startDate: firstDay,
        endDate: today,
      });

      if (resHistory.data?.success) {
        const historyArray = resHistory.data?.data || [];
        setReports(historyArray);

        // --- LOGIC SUMMARY KUMULATIF (DIJUMLAH SEMUA HARI) ---
        let akumulasiOmzet = 0;
        let akumulasiOwner = 0;
        let akumulasiEmployee = 0;
        let akumulasiManagement = 0;

        historyArray.forEach((item: any) => {
          // Omzet (Jatah Owner * 2 sesuai rumus lu)
          const jatahOwner = item.totalSetoran || item.ownerShare || 0;
          const omzet = jatahOwner * 2;

          // Gaji Karyawan (Asumsi 40% dari Omzet, atau 80% dari Jatah Owner)
          // Sesuaikan sama logic pembagian lu, Bre
          const gajiKaryawan = omzet * 0.4;

          // Kas Management (Total Revenue - Jatah Owner - Gaji)
          // Atau ambil dari managementExpenses yang udah ada
          const biayaManagement =
            item.managementExpenses?.reduce(
              (a: any, b: any) => a + b.amount,
              0,
            ) || 0;

          akumulasiOmzet += omzet;
          akumulasiOwner += jatahOwner;
          akumulasiEmployee += gajiKaryawan;
          akumulasiManagement += omzet * 0.1 - biayaManagement; // Contoh logic kas 10%
        });

        // Update kotak-kotak di atas pake hasil penjumlahan
        setSummary({
          totalRevenue: akumulasiOmzet,
          totalOwner: akumulasiOwner,
          totalEmployee: akumulasiEmployee,
          totalManagement: akumulasiManagement,
        });

        // --- LOGIC CHART (BIAR TETEP NAIK TURUN) ---
        const monthlyMap: Record<string, number> = {};
        historyArray.forEach((item: any) => {
          const rawDate = item.reportDate || item.createdAt;
          if (rawDate) {
            const tgl = new Date(rawDate).getDate().toString();
            const jatahOwner = item.totalSetoran || item.ownerShare || 0;
            monthlyMap[tgl] = (monthlyMap[tgl] || 0) + jatahOwner * 2;
          }
        });

        const sortedLabels = Object.keys(monthlyMap).sort(
          (a, b) => parseInt(a) - parseInt(b),
        );
        const dataValues = sortedLabels.map((label) => monthlyMap[label]);

        setChartData({
          labels: sortedLabels.length > 0 ? sortedLabels : ["-"],
          datasets: [{ data: dataValues.length > 0 ? dataValues : [0] }],
        });
      }
    } catch (err) {
      console.log("Salah di mari asu:", err);
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
                value={formatIDR(summary.totalManagement)} // bre berarti ini udah di potong pengeluaran harusnya
                icon={<Store color="#fff" />}
                color="#6f42c1"
              />
            </View>
          </>
        )}

        {/* LIST LAPORAN HARIAN */}
        <View style={{ marginTop: 25, marginBottom: 30 }}>
          <View>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.text, marginBottom: 15 },
              ]}>
              Aktivitas Setoran Hari Ini
            </Text>
            {/* disini kasih buat lihat semua laporan bre daripada harus nambah tab naivasi bre mending kasih sini aja bre */}
          </View>

          {reports.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={{ color: "#888" }}>
                Belum ada setoran masuk, bre.
              </Text>
            </View>
          ) : (
            reports.map((item) => (
              <View
                key={item._id}
                style={[
                  styles.reportCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}>
                <View style={styles.reportMain}>
                  <View>
                    <Text
                      style={{
                        color: theme.text,
                        fontWeight: "bold",
                        fontSize: 16,
                      }}>
                      Total Setor
                    </Text>
                    <Text
                      style={{
                        color: theme.primary,
                        fontSize: 12,
                        fontWeight: "600",
                      }}>
                      {item.createdBy?.fullname || "Karyawan"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        color: theme.success,
                        fontWeight: "900",
                        fontSize: 16,
                      }}>
                      Net:{" "}
                      {formatIDR(
                        item.totalRevenue -
                          (item.managementExpenses?.reduce(
                            (a: any, b: any) => a + b.amount,
                            0,
                          ) || 0),
                      )}
                    </Text>
                    <Text style={{ color: "#888", fontSize: 11 }}>
                      +{formatIDR(item.totalRevenue)}
                    </Text>
                  </View>
                </View>

                {/* LIST JAJANAN (Kalo Ada) */}
                {item.managementExpenses?.length > 0 && (
                  <View style={styles.expenseBox}>
                    <Text
                      style={{
                        color: "#ff4444",
                        fontSize: 11,
                        fontWeight: "bold",
                        marginBottom: 5,
                      }}>
                      Rincian Pengeluaran:
                    </Text>
                    {item.managementExpenses.map((exp: any, idx: number) => (
                      <View key={idx} style={styles.expenseRow}>
                        <Text style={{ color: theme.text, fontSize: 12 }}>
                          • {exp.description}
                        </Text>
                        <Text
                          style={{
                            color: "#ff4444",
                            fontSize: 12,
                            fontWeight: "700",
                          }}>
                          -{formatIDR(exp.amount)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </View>
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
  emptyBox: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#444",
    borderStyle: "dashed",
    borderRadius: 15,
  },
  reportCard: {
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 2,
  },
  reportMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expenseBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#444",
  },
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
});

export default DashboardOwnerScreen;
