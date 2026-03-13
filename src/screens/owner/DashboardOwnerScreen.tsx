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
import { getLaporanHarian, getAllBranches } from "../../api/layanan";
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
      // 1. Ambil List Branch buat Filter
      const resBranch = await getAllBranches();
      if (resBranch.data) setBranches(resBranch.data);

      // 2. Ambil Laporan
      await fetchData();
    } catch (err) {
      console.error("INIT_ERR:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (branchId = selectedBranch.id) => {
    try {
      const res = await getLaporanHarian({
        branchId: branchId || undefined,
        // Ambil 7 hari terakhir
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
      });

      if (res.data.success) {
        setSummary(res.data.summary);
        const rawData = [...res.data.data].reverse();

        if (rawData.length > 0) {
          setChartData({
            labels: rawData.map((d: any) =>
              new Date(d.reportDate).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
              }),
            ),
            datasets: [{ data: rawData.map((d: any) => d.totalRevenue) }],
          });
        } else {
          setChartData({ labels: ["No Data"], datasets: [{ data: [0] }] });
        }
      }
    } catch (err) {
      console.error("FETCH_ERR:", err);
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
            <View
              style={[
                styles.chartBox,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Tren Omzet 7 Hari
              </Text>
              <LineChart
                data={chartData}
                width={screenWidth - 70}
                height={200}
                chartConfig={{
                  backgroundColor: theme.card,
                  backgroundGradientFrom: theme.card,
                  backgroundGradientTo: theme.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => theme.primary,
                  labelColor: (opacity = 1) => theme.text,
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: theme.primary,
                  },
                }}
                bezier
                style={{ marginVertical: 10, borderRadius: 16 }}
              />
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
            {branches.map((b) => (
              <TouchableOpacity
                key={b._id}
                style={styles.branchItem}
                onPress={() => handleSelectBranch(b._id, b.name)}>
                <Text
                  style={{
                    color:
                      selectedBranch.id === b._id ? theme.primary : theme.text,
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
