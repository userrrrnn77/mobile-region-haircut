import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { getLaporanHarian } from "../../api/layanan";
import { Calendar, ChevronRight, FileText, X } from "lucide-react-native";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import { Download, Filter } from "lucide-react-native";
import { getAllBranches } from "../../api/layanan"; // Pastiin path bener

const ListLaporanScreen = () => {
  const scheme = useColorScheme() || "dark";
  const theme = Colors[scheme as "light" | "dark"];

  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs()); // Default Bulan Ini

  // 1. Tambah state buat Modal di atas
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");

  // 2. Fungsi buka modal
  const openDetail = (item: any) => {
    setSelectedReport(item);
    setModalVisible(true);
  };

  useEffect(() => {
    const loadBranches = async () => {
      const res = await getAllBranches();
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) setBranches(data);
    };
    loadBranches();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const start = selectedMonth.startOf("month").format("YYYY-MM-DD");
      const end = selectedMonth.endOf("month").format("YYYY-MM-DD");

      const res = await getLaporanHarian({
        startDate: start,
        endDate: end,
        branchId: selectedBranchId || undefined, // Tambahin ini bre
      });

      if (res.data?.success) setReports(res.data.data);
    } catch (err) {
      console.log("Gagal tarik arsip:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedMonth, selectedBranchId]); // Triger kalo branch ganti

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);

  const exportToExcel = async () => {
    if (!reports || reports.length === 0) {
      return Alert.alert(
        "Zonk!",
        "Kaga ada data laporan buat di-export bulan ini, bre.",
      );
    }

    try {
      // 1. Mapping Data Harian
      const dataRows = reports.map((r) => ({
        Tanggal: dayjs(r.reportDate).format("DD-MM-YYYY"),
        Cabang: r.branch?.name || "-",
        Karyawan: r.createdBy?.fullname || "-",
        "Total Omzet": r.totalRevenue || 0,
        "Jatah Owner (50%)": r.ownerShare || 0,
        "Gaji Karyawan (40%)": r.employeeShare || 0,
        "Kas Management (10%)": r.managementShare || 0,
        "Total Jajan": r.totalManagementExpenses || 0,
        "Net Management": r.managementNet || 0,
        "WAJIB SETOR CASH": r.totalCashToDeposit || 0,
        "Rincian Jajan":
          r.managementExpenses
            ?.map((ex: any) => `${ex.description} (${ex.amount})`)
            .join(", ") || "-",
        Catatan: r.notes || "-",
      }));

      // 2. LOGIC TOTALAN PER USER (Buat Rekap Gaji Satuan)
      const userSalaries: { [key: string]: number } = {};
      reports.forEach((r) => {
        const name = r.createdBy?.fullname || "Unknown";
        userSalaries[name] = (userSalaries[name] || 0) + (r.employeeShare || 0);
      });

      // Mapping rekap gaji per user ke format baris excel
      const userSalaryRows = Object.keys(userSalaries).map((name) => ({
        Tanggal: "REKAP GAJI",
        Cabang: "",
        Karyawan: name,
        "Total Omzet": "",
        "Jatah Owner (50%)": "",
        "Gaji Karyawan (40%)": userSalaries[name], // Gaji total per orang
        "Kas Management (10%)": "",
        "Total Jajan": "",
        "Net Management": "",
        "WAJIB SETOR CASH": "",
        "Rincian Jajan": `Total Gaji ${name}`,
        Catatan: "",
      }));

      // 3. LOGIC GRAND TOTAL (Totalan Maut)
      const totals = reports.reduce(
        (acc, curr) => ({
          omzet: acc.omzet + (curr.totalRevenue || 0),
          owner: acc.owner + (curr.ownerShare || 0),
          gaji: acc.gaji + (curr.employeeShare || 0),
          kas: acc.kas + (curr.managementShare || 0),
          jajan: acc.jajan + (curr.totalManagementExpenses || 0),
          setor: acc.setor + (curr.totalCashToDeposit || 0),
        }),
        { omzet: 0, owner: 0, gaji: 0, kas: 0, jajan: 0, setor: 0 },
      );

      // 4. Gabungin Semua Baris
      const finalData = [
        ...dataRows,
        {}, // Baris kosong pembatas harian
        { Tanggal: "--- RINCIAN GAJI PER KARYAWAN ---" },
        ...userSalaryRows,
        {}, // Baris kosong pembatas total
        {
          Tanggal: "GRAND TOTAL",
          Cabang: "",
          Karyawan: "REKAP KESELURUHAN",
          "Total Omzet": totals.omzet,
          "Jatah Owner (50%)": totals.owner,
          "Gaji Karyawan (40%)": totals.gaji,
          "Kas Management (10%)": totals.kas,
          "Total Jajan": totals.jajan,
          "Net Management": "",
          "WAJIB SETOR CASH": totals.setor,
          "Rincian Jajan": "--- SELESAI ---",
          Catatan: `Total Gaji Semua: ${new Intl.NumberFormat("id-ID").format(totals.gaji)}`,
        },
      ];

      // 5. Setup SheetJS & Auto-Width
      const ws = XLSX.utils.json_to_sheet(finalData);
      const objectMaxLength: any[] = [];
      finalData.forEach((row: any) => {
        Object.keys(row).forEach((key, i) => {
          const value = row[key] ? row[key].toString() : "";
          const width = Math.max(value.length, key.length);
          objectMaxLength[i] = { wch: width + 5 };
        });
      });
      ws["!cols"] = objectMaxLength;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rekap_Lengkap");
      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

      const fileName = `Rekap_Full_${selectedMonth.format("MMM_YYYY")}.xlsx`;

      // 6. JURUS SAF (Direct Download)
      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (permissions.granted) {
        const directoryUri = permissions.directoryUri;
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          directoryUri,
          fileName,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );

        await FileSystem.writeAsStringAsync(fileUri, wbout, {
          encoding: FileSystem.EncodingType.Base64,
        });

        Alert.alert(
          "GGMU Bre!",
          `Laporan Full Rekap udah mendarat di folder pilihan lu!`,
        );
      } else {
        const uri = FileSystem.cacheDirectory + fileName;
        await FileSystem.writeAsStringAsync(uri, wbout, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await Sharing.shareAsync(uri);
      }
    } catch (err) {
      console.error("Gagal export:", err);
      Alert.alert("Waduh!", "Gagal pas mau download bre.");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HEADER FILTER BULAN */}
      <View style={styles.header}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 15,
          }}>
          <Text style={[styles.title, { color: theme.text }]}>
            ARSIP SETORAN
          </Text>
          {/* Tombol Export Excel */}
          <TouchableOpacity onPress={exportToExcel} style={styles.exportIcon}>
            <Download color={theme.primary} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setSelectedMonth(selectedMonth.subtract(1, "month"))}
            style={[styles.monthBtn, { backgroundColor: theme.card }]}>
            <Text style={{ color: theme.primary }}>{"<"}</Text>
          </TouchableOpacity>

          <Text style={[styles.monthText, { color: theme.text }]}>
            {selectedMonth.format("MMMM YYYY")}
          </Text>

          <TouchableOpacity
            onPress={() => setSelectedMonth(selectedMonth.add(1, "month"))}
            style={[styles.monthBtn, { backgroundColor: theme.card }]}>
            <Text style={{ color: theme.primary }}>{">"}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 15 }}>
          <TouchableOpacity
            onPress={() => setSelectedBranchId("")}
            style={[
              styles.filterPill,
              {
                backgroundColor:
                  selectedBranchId === "" ? theme.primary : theme.card,
              },
            ]}>
            <Text style={{ color: "#fff", fontSize: 12 }}>Semua Cabang</Text>
          </TouchableOpacity>
          {branches.map((b) => (
            <TouchableOpacity
              key={b._id}
              onPress={() => setSelectedBranchId(b._id)}
              style={[
                styles.filterPill,
                {
                  backgroundColor:
                    selectedBranchId === b._id ? theme.primary : theme.card,
                  marginLeft: 10,
                },
              ]}>
              <Text style={{ color: "#fff", fontSize: 12 }}>{b.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.primary}
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={reports}
          contentContainerStyle={{ padding: 20 }}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", color: "#888", marginTop: 50 }}>
              Kaga ada laporan di bulan ini, bre.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => openDetail(item)}
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={{ color: theme.text, fontWeight: "bold" }}>
                    {item.createdBy?.fullname}
                  </Text>
                  <Text style={{ color: "#888", fontSize: 11 }}>
                    {dayjs(item.reportDate).format("DD MMM YYYY")}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: theme.success, fontWeight: "bold" }}>
                    {formatIDR(item.totalCashToDeposit)}
                  </Text>
                  <Text style={{ color: theme.primary, fontSize: 10 }}>
                    {item.branch?.name}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* MODAL DETAIL LAPORAN */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeaderDetail}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Detail Setoran
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={theme.text} size={24} />
              </TouchableOpacity>
            </View>

            {selectedReport && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailSection}>
                  <Text style={{ color: "#888", fontSize: 12 }}>
                    Nama Karyawan
                  </Text>
                  <Text
                    style={{
                      color: theme.text,
                      fontWeight: "bold",
                      fontSize: 16,
                    }}>
                    {selectedReport.createdBy?.fullname}
                  </Text>
                </View>

                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Omzet Total</Text>
                    <Text
                      style={[styles.detailValue, { color: theme.primary }]}>
                      {formatIDR(selectedReport.totalRevenue)}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Duit Fisik (Cash)</Text>
                    <Text
                      style={[styles.detailValue, { color: theme.success }]}>
                      {formatIDR(selectedReport.totalCashToDeposit)}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* RINCIAN BAGI HASIL */}
                <View style={styles.shareRow}>
                  <Text style={{ color: theme.text }}>Jatah Owner (50%)</Text>
                  <Text style={{ color: theme.text, fontWeight: "bold" }}>
                    {formatIDR(selectedReport.ownerShare)}
                  </Text>
                </View>
                <View style={styles.shareRow}>
                  <Text style={{ color: theme.text }}>Gaji Karyawan (40%)</Text>
                  <Text style={{ color: theme.text, fontWeight: "bold" }}>
                    {formatIDR(selectedReport.employeeShare)}
                  </Text>
                </View>
                <View style={styles.shareRow}>
                  <Text style={{ color: theme.text }}>
                    Kas Management (10%)
                  </Text>
                  <Text style={{ color: theme.text, fontWeight: "bold" }}>
                    {formatIDR(selectedReport.managementShare)}
                  </Text>
                </View>

                <View style={styles.divider} />

                {/* LIST PENGELUARAN/JAJAN */}
                <Text
                  style={{
                    color: "#ff4444",
                    fontWeight: "bold",
                    marginBottom: 10,
                  }}>
                  Daftar Pengeluaran:
                </Text>
                {selectedReport.managementExpenses?.length > 0 ? (
                  selectedReport.managementExpenses.map(
                    (exp: any, i: number) => (
                      <View key={i} style={styles.expenseDetailRow}>
                        <Text style={{ color: theme.text }}>
                          • {exp.description}
                        </Text>
                        <Text style={{ color: "#ff4444", fontWeight: "bold" }}>
                          -{formatIDR(exp.amount)}
                        </Text>
                      </View>
                    ),
                  )
                ) : (
                  <Text style={{ color: "#888", fontStyle: "italic" }}>
                    Kaga ada jajan hari ini, bre.
                  </Text>
                )}

                <View style={{ height: 20 }} />
                <Text
                  style={{ color: "#888", fontSize: 11, textAlign: "center" }}>
                  Catatan: {selectedReport.notes || "-"}
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#333" },
  title: { fontSize: 20, fontWeight: "900", marginBottom: 15 },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monthBtn: { padding: 10, borderRadius: 10, width: 40, alignItems: "center" },
  monthText: { fontSize: 16, fontWeight: "bold" },
  card: { padding: 15, borderRadius: 15, borderWidth: 1, marginBottom: 10 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 25,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeaderDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  detailSection: { marginBottom: 15 },
  detailGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  detailItem: { width: "48%" },
  detailLabel: { color: "#888", fontSize: 11 },
  detailValue: { fontSize: 16, fontWeight: "bold" },
  divider: { height: 1, backgroundColor: "#333", marginVertical: 15 },
  shareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  expenseDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  exportIcon: {
    padding: 8,
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    borderRadius: 12,
  },
  filterPill: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#444",
  },
});

export default ListLaporanScreen;
