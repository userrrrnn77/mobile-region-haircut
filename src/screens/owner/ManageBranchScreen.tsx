// src/screens/owner/ManageBranchScreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  useColorScheme,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import {
  getAllBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "../../api/layanan";
import {
  MapPin,
  Plus,
  X,
  Edit3,
  Trash2,
  Navigation,
  Settings,
  CheckCircle2,
  XCircle,
} from "lucide-react-native";

const ManageBranchScreen = () => {
  const scheme = useColorScheme() || "dark";
  const theme = Colors[scheme as "light" | "dark"];

  // State
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // Form State (Sesuai Controller & Model)
  const [selectedId, setSelectedId] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("7");
  const [role] = useState("karyawan"); // Default enum dari model

  const fetchBranches = async () => {
    try {
      const res = await getAllBranches();
      if (res.data.success) setBranches(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const resetForm = () => {
    setSelectedId("");
    setCode("");
    setName("");
    setLat("");
    setLng("");
    setRadius("7");
    setIsEdit(false);
  };

  const handleOpenEdit = (item: any) => {
    setSelectedId(item._id);
    setCode(item.code);
    setName(item.name);
    setLat(item.center.lat.toString());
    setLng(item.center.lng.toString());
    setRadius(item.radiusMeter.toString());
    setIsEdit(true);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!code || !name || !lat || !lng) {
      return Alert.alert("Woy!", "Data jangan dikosongin asu!");
    }

    const payload = { code, name, lat, lng, radiusMeter: radius, role };

    try {
      setLoading(true);
      const res = isEdit
        ? await updateBranch(selectedId, payload)
        : await createBranch(payload);

      if (res.data.success) {
        Alert.alert("MANTAP", res.data.message);
        setModalVisible(false);
        resetForm();
        fetchBranches();
      }
    } catch (err: any) {
      Alert.alert(
        "GAGAL",
        err.response?.data?.message || "Internal Server Error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "HAPUS CABANG?",
      "Kalo ada history absen cuma bakal di-nonaktifkan, kalo kaga ada dihapus permanen mbot.",
      [
        { text: "BATAL", style: "cancel" },
        {
          text: "EKSEKUSI",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await deleteBranch(id);
              if (res.data.success) {
                Alert.alert("SUKSES", res.data.message);
                fetchBranches();
              }
            } catch (err) {
              Alert.alert("GAGAL", "Gagal hapus ruko!");
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleGroup}>
          <MapPin size={20} color={theme.primary} />
          <Text style={[styles.branchName, { color: theme.text }]}>
            {item.name}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: item.isActive
                ? theme.success + "20"
                : theme.danger + "20",
            },
          ]}>
          {item.isActive ? (
            <CheckCircle2 size={12} color={theme.success} />
          ) : (
            <XCircle size={12} color={theme.danger} />
          )}
          <Text
            style={[
              styles.statusText,
              { color: item.isActive ? theme.success : theme.danger },
            ]}>
            {item.isActive ? "ACTIVE" : "INACTIVE"}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.codeText, { color: theme.tabIconDefault }]}>
          KODE: {item.code}
        </Text>
        <Text style={[styles.coordText, { color: theme.text }]}>
          📍 {item.center.lat}, {item.center.lng}
        </Text>
        <Text style={[styles.radiusText, { color: theme.primary }]}>
          Radius: {item.radiusMeter} Meter
        </Text>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={styles.footerBtn}
          onPress={() => handleOpenEdit(item)}>
          <Edit3 size={18} color={theme.primary} />
          <Text style={[styles.btnText, { color: theme.primary }]}>EDIT</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerBtn}
          onPress={() => handleDelete(item._id)}>
          <Trash2 size={18} color={theme.danger} />
          <Text style={[styles.btnText, { color: theme.danger }]}>HAPUS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={scheme === "dark" ? "light-content" : "dark-content"}
      />

      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            LOKASI KERJA
          </Text>
          <Text style={{ color: theme.tabIconDefault, fontSize: 12 }}>
            Kelola titik GPS ruko lu, bre!
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}>
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={branches}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchBranches}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <ActivityIndicator color={theme.primary} style={{ marginTop: 50 }} />
        }
      />

      {/* MODAL FORM (CREATE / EDIT) */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {isEdit ? "Edit Cabang" : "Tambah Cabang Baru"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.tabIconDefault }]}>
                  Kode Lokasi (Misal: RUKO_01)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.text, borderColor: theme.border },
                  ]}
                  value={code}
                  onChangeText={setCode}
                  placeholder="KODE"
                  placeholderTextColor="#666"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.tabIconDefault }]}>
                  Nama Lokasi (Misal: Cabang Sudirman)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.text, borderColor: theme.border },
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Nama Cabang"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={[styles.label, { color: theme.tabIconDefault }]}>
                    Latitude
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { color: theme.text, borderColor: theme.border },
                    ]}
                    value={lat}
                    onChangeText={setLat}
                    keyboardType="numeric"
                    placeholder="-6.123"
                    placeholderTextColor="#666"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: theme.tabIconDefault }]}>
                    Longitude
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { color: theme.text, borderColor: theme.border },
                    ]}
                    value={lng}
                    onChangeText={setLng}
                    keyboardType="numeric"
                    placeholder="106.123"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.tabIconDefault }]}>
                  Radius Aman (Meter)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.text, borderColor: theme.border },
                  ]}
                  value={radius}
                  onChangeText={setRadius}
                  keyboardType="numeric"
                  placeholder="7"
                  placeholderTextColor="#666"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: theme.primary }]}
                onPress={handleSubmit}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isEdit ? "UPDATE LOKASI" : "SIMPAN LOKASI"}
                  </Text>
                )}
              </TouchableOpacity>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: "900" },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  card: {
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 15,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  titleGroup: { flexDirection: "row", alignItems: "center" },
  branchName: { fontSize: 18, fontWeight: "bold", marginLeft: 8 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 10, fontWeight: "900", marginLeft: 4 },
  cardBody: { marginBottom: 15 },
  codeText: { fontSize: 12, fontWeight: "bold" },
  coordText: { fontSize: 14, marginVertical: 4 },
  radiusText: { fontSize: 13, fontWeight: "bold" },
  cardFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 12,
    justifyContent: "space-around",
  },
  footerBtn: { flexDirection: "row", alignItems: "center" },
  btnText: { fontWeight: "bold", marginLeft: 6, fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: "bold", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  row: { flexDirection: "row" },
  submitBtn: {
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default ManageBranchScreen;
