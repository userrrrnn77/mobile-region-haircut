// src/screens/owner/ManageKaryawanScreen.tsx

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
  ScrollView,
  useColorScheme,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { getSemuaUsers, deleteUser } from "../../api/layanan";
import { 
  User, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  X, 
  UserPlus 
} from "lucide-react-native";

const ManageKaryawanScreen = ({ navigation }: any) => {
  const scheme = useColorScheme() || "dark";
  const theme = Colors[scheme as "light" | "dark"];

  // State
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await getSemuaUsers();
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err: any) {
      Alert.alert("Error", "Gagal narik data user, mbot!");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "PECAT KARYAWAN?",
      `Yakin mau hapus si ${name}? Kalo udah dihapus kaga bisa balik lagi loh bgsd!`,
      [
        { text: "BATAL", style: "cancel" },
        { 
          text: "HAPUS", 
          style: "destructive", 
          onPress: async () => {
            try {
              const res = await deleteUser(id);
              if (res.data.success) {
                Alert.alert("SUKSES", "User berhasil didepak!");
                setDetailVisible(false);
                fetchUsers();
              }
            } catch (err) {
              Alert.alert("GAGAL", "Gagal hapus user, keknya dia pake ilmu hitam.");
            }
          } 
        }
      ]
    );
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => {
        setSelectedUser(item);
        setDetailVisible(true);
      }}
    >
      <View style={[styles.avatarBox, { backgroundColor: item.role === 'owner' ? '#FFD700' : theme.primary }]}>
        <User color="#fff" size={24} />
      </View>
      <View style={styles.userMainInfo}>
        <Text style={[styles.userName, { color: theme.text }]}>{item.fullname}</Text>
        <Text style={[styles.userSub, { color: theme.tabIconDefault }]}>@{item.username} • {item.role}</Text>
      </View>
      <ShieldCheck size={20} color={item.role === 'owner' ? '#FFD700' : theme.tabIconDefault} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>LIST KARYAWAN</Text>
          <Text style={{ color: theme.tabIconDefault, fontSize: 12 }}>Total: {users.length} Orang</Text>
        </View>
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => Alert.alert("Sabar", "Layar tambah user lagi gue rakit!")}
        >
          <UserPlus color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        />
      )}

      {/* MODAL DETAIL USER */}
      <Modal visible={detailVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Detail Karyawan</Text>
              <TouchableOpacity onPress={() => setDetailVisible(false)}>
                <X color={theme.text} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView>
                <View style={styles.detailBody}>
                  <View style={styles.infoGroup}>
                    <User size={20} color={theme.primary} />
                    <View style={styles.infoTextGroup}>
                      <Text style={[styles.label, { color: theme.tabIconDefault }]}>Nama Lengkap</Text>
                      <Text style={[styles.value, { color: theme.text }]}>{selectedUser.fullname}</Text>
                    </View>
                  </View>

                  <View style={styles.infoGroup}>
                    <Mail size={20} color={theme.primary} />
                    <View style={styles.infoTextGroup}>
                      <Text style={[styles.label, { color: theme.tabIconDefault }]}>Email</Text>
                      <Text style={[styles.value, { color: theme.text }]}>{selectedUser.email}</Text>
                    </View>
                  </View>

                  <View style={styles.infoGroup}>
                    <MapPin size={20} color={theme.primary} />
                    <View style={styles.infoTextGroup}>
                      <Text style={[styles.label, { color: theme.tabIconDefault }]}>Lokasi Cabang</Text>
                      {selectedUser.branchLocations?.map((loc: any) => (
                        <Text key={loc._id} style={[styles.value, { color: theme.text }]}>• {loc.name} ({loc.code})</Text>
                      ))}
                      {(!selectedUser.branchLocations || selectedUser.branchLocations.length === 0) && (
                        <Text style={[styles.value, { color: theme.danger }]}>Belum ada penempatan!</Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* TOMBOL AKSI */}
                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={[styles.btnAction, { backgroundColor: theme.primary }]}
                    onPress={() => {
                      setDetailVisible(false);
                      // Lu kirim data user ke screen Edit
                      navigation.navigate("EditUser", { userId: selectedUser._id });
                    }}
                  >
                    <Edit3 color="#fff" size={20} />
                    <Text style={styles.btnText}>EDIT DATA</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.btnAction, { backgroundColor: theme.danger }]}
                    onPress={() => handleDelete(selectedUser._id, selectedUser.fullname)}
                  >
                    <Trash2 color="#fff" size={20} />
                    <Text style={styles.btnText}>HAPUS</Text>
                  </TouchableOpacity>
                </View>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: "900" },
  addBtn: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  userCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 15, 
    borderWidth: 1, 
    marginBottom: 12,
    elevation: 2
  },
  avatarBox: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  userMainInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold' },
  userSub: { fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  detailBody: { marginBottom: 30 },
  infoGroup: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' },
  infoTextGroup: { marginLeft: 15, flex: 1 },
  label: { fontSize: 12, marginBottom: 2 },
  value: { fontSize: 15, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  btnAction: { flex: 0.48, flexDirection: 'row', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 }
});

export default ManageKaryawanScreen;