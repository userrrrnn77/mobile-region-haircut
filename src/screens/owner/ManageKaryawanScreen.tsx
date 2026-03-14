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
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import {
  getSemuaUsers,
  deleteUser,
  buatUserBaru,
  getAllBranches,
  updateUserAssignment,
} from "../../api/layanan";
import {
  User,
  Mail,
  MapPin,
  ShieldCheck,
  Trash2,
  Edit3,
  X,
  UserPlus,
  Lock,
  Briefcase,
} from "lucide-react-native";

// Biar kaga mual, kita definisikan interface-nya bre!
interface NewUserForm {
  fullname: string;
  username: string;
  email: string;
  password: string;
  role: "owner" | "karyawan";
  branchLocations: string; // Kita input kode cabangnya (misal: RUKO_A)
}

const ManageKaryawanScreen = ({ navigation }: any) => {
  const scheme = useColorScheme() || "dark";
  const theme = Colors[scheme as "light" | "dark"];

  // States
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const [availableBranches, setAvailableBranches] = useState<any[]>([]);
  const [branchModalVisible, setBranchModalVisible] = useState(false);

  const [editVisible, setEditVisible] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [activeBranchIndex, setActiveBranchIndex] = useState<number | null>(
    null,
  );

  // State Buat Tambah User
  const [addVisible, setAddVisible] = useState(false);
  const [formData, setFormData] = useState<NewUserForm>({
    fullname: "",
    username: "",
    email: "",
    password: "",
    role: "karyawan",
    branchLocations: "",
  });

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

  const openEditModal = (user: any) => {
    setEditData({
      id: user._id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      role: user.role,
      password: "",
      // Kita simpan sebagai array biar gampang di-map di UI
      branchLocations: user.branchLocations?.map((l: any) => l.code) || [],
    });
    setDetailVisible(false);
    setEditVisible(true);
  };

  const removeBranchSlot = (index: number) => {
    const newLocs = [...editData.branchLocations];
    newLocs.splice(index, 1);
    setEditData({ ...editData, branchLocations: newLocs });
  };

  const addBranchSlot = () => {
    setActiveBranchIndex(null); // null berarti nambah baru
    setBranchModalVisible(true);
  };

  // 3. Fungsi eksekusi Update ke API
  const handleUpdateUser = async () => {
    if (editData.role === "karyawan" && editData.branchLocations.length === 0) {
      return Alert.alert("PEAK", "Karyawan minimal punya 1 lokasi kerja!");
    }

    try {
      setLoading(true);
      const res = await updateUserAssignment(editData.id, {
        fullname: editData.fullname,
        username: editData.username,
        role: editData.role,
        password: editData.password || undefined,
        branchLocations: editData.branchLocations, // Ini udah otomatis array [ "RUKO_A", "RUKO_B" ]
      });

      if (res.data.success) {
        Alert.alert("BERHASIL", "Data karyawan udah di-update, bre!");
        setEditVisible(false);
        fetchUsers(); // Refresh list
      }
    } catch (err: any) {
      Alert.alert(
        "GAGAL",
        err.response?.data?.message || "Gagal update, mbot!",
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const fetchBranches = async () => {
    try {
      // Pastiin lu udah export getSemuaBranches di api/layanan.ts
      const res = await getAllBranches();
      if (res.data.success) {
        setAvailableBranches(res.data.data);
      }
    } catch (err) {
      console.log("Gagal ambil list cabang, mbot!");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBranches(); // Ambil list cabang pas start
  }, []);

  const handleAddUser = async () => {
    const { fullname, username, email, password, role, branchLocations } =
      formData;

    // Validasi Dasar
    if (!fullname || !username || !email || !password) {
      return Alert.alert("PEAK!", "Data jangan ada yang kosong bgsd!");
    }

    if (role === "karyawan" && !branchLocations) {
      return Alert.alert("EITS!", "Karyawan wajib punya lokasi kerja, mbot!");
    }

    try {
      setLoading(true);
      // Kirim data sesuai format yang diminta controller createUser
      const res = await buatUserBaru({
        ...formData,
        branchLocations:
          role === "owner"
            ? []
            : branchLocations.split(",").map((s) => s.trim()),
      });

      if (res.data.success) {
        Alert.alert("MANTAP", "User baru berhasil didepak ke database!");
        setAddVisible(false);
        setFormData({
          fullname: "",
          username: "",
          email: "",
          password: "",
          role: "karyawan",
          branchLocations: "",
        });
        fetchUsers();
      }
    } catch (err: any) {
      Alert.alert(
        "GAGAL",
        err.response?.data?.message || "Email udah ada atau lokasi ghaib!",
      );
    } finally {
      setLoading(false);
    }
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
              Alert.alert(
                "GAGAL",
                "Gagal hapus user, keknya dia pake ilmu hitam.",
              );
            }
          },
        },
      ],
    );
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.userCard,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
      onPress={() => {
        setSelectedUser(item);
        setDetailVisible(true);
      }}>
      <View
        style={[
          styles.avatarBox,
          {
            backgroundColor: item.role === "owner" ? "#FFD700" : theme.primary,
          },
        ]}>
        {item.avatar ? (
          <Image
            source={{ uri: item.avatar }}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 22.5,
              overflow: "hidden",
            }}
            resizeMode="cover"
          />
        ) : (
          <User color="#fff" size={24} />
        )}
      </View>
      <View style={styles.userMainInfo}>
        <Text style={[styles.userName, { color: theme.text }]}>
          {item.fullname}
        </Text>
        <Text style={[styles.userSub, { color: theme.tabIconDefault }]}>
          @{item.username} • {item.role}
        </Text>
      </View>
      <ShieldCheck
        size={20}
        color={item.role === "owner" ? "#FFD700" : theme.tabIconDefault}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>
            LIST KARYAWAN
          </Text>
          <Text style={{ color: theme.tabIconDefault, fontSize: 12 }}>
            Total: {users.length} Orang
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => setAddVisible(true)}>
          <UserPlus color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator
          size="large"
          color={theme.primary}
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
        />
      )}

      {/* --- MODAL TAMBAH USER --- */}
      <Modal visible={addVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, height: "92%" },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                REKRUT KARYAWAN
              </Text>
              <TouchableOpacity onPress={() => setAddVisible(false)}>
                <X color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }} // Kasih extra space bawah biar enak scroll-nya
            >
              {/* NAMA LENGKAP */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.tabIconDefault }]}>
                  Nama Lengkap
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      paddingLeft: 15,
                    },
                  ]}
                  placeholder="Contoh: Budi Cukur"
                  placeholderTextColor="#666"
                  value={formData.fullname}
                  onChangeText={(t) => {
                    // Logic auto-username
                    const gen = t
                      .toLowerCase()
                      .replace(/\s+/g, "_")
                      .replace(/[^a-z0-9_]/g, "");
                    setFormData({ ...formData, fullname: t, username: gen });
                  }}
                />
              </View>

              {/* USERNAME (OTOMATIS) */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.tabIconDefault }]}>
                  Username (Otomatis)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.tabIconDefault,
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                      paddingLeft: 15,
                    },
                  ]}
                  editable={false}
                  value={formData.username}
                  placeholder="nanti muncul sendiri..."
                  placeholderTextColor="#666"
                />
              </View>

              {/* EMAIL */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.tabIconDefault }]}>
                  Email
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      paddingLeft: 15,
                    },
                  ]}
                  placeholder="budi@haircut.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#666"
                  value={formData.email}
                  onChangeText={(t) => setFormData({ ...formData, email: t })}
                />
              </View>

              {/* PASSWORD */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.tabIconDefault }]}>
                  Password
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      paddingLeft: 15,
                    },
                  ]}
                  placeholder="Min. 8 Karakter"
                  secureTextEntry
                  placeholderTextColor="#666"
                  value={formData.password}
                  onChangeText={(t) =>
                    setFormData({ ...formData, password: t })
                  }
                />
              </View>

              {/* ROLE JABATAN */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.tabIconDefault }]}>
                  Role Jabatan
                </Text>
                <View style={styles.roleContainer}>
                  {["owner", "karyawan"].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.roleBtn,
                        {
                          backgroundColor:
                            formData.role === r ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, role: r as any })
                      }>
                      <Text style={{ color: "#fff", fontWeight: "bold" }}>
                        {r.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* PILIH TEMPAT KERJA (KHUSUS KARYAWAN) */}
              {formData.role === "karyawan" && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.tabIconDefault }]}>
                    Pilih Tempat Kerja
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.input,
                      {
                        borderColor: theme.border,
                        justifyContent: "center",
                        paddingLeft: 15,
                      },
                    ]}
                    onPress={() => setBranchModalVisible(true)}>
                    <Text
                      style={{
                        color: formData.branchLocations ? theme.text : "#666",
                      }}>
                      {formData.branchLocations || "Klik buat pilih cabang..."}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* TOMBOL DAFTAR */}
              <TouchableOpacity
                style={[
                  styles.btnActionSubmit,
                  { backgroundColor: theme.primary },
                ]}
                onPress={handleAddUser}>
                <UserPlus color="#fff" size={20} />
                <Text style={styles.btnTextSubmit}>DAFTARKAN SEKARANG</Text>
              </TouchableOpacity>

              <View style={{ height: 50 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- MODAL DETAIL USER --- */}
      <Modal visible={detailVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Data Karyawan
              </Text>
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
                      <Text
                        style={[styles.label, { color: theme.tabIconDefault }]}>
                        Nama Lengkap
                      </Text>
                      <Text style={[styles.value, { color: theme.text }]}>
                        {selectedUser.fullname}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoGroup}>
                    <Mail size={20} color={theme.primary} />
                    <View style={styles.infoTextGroup}>
                      <Text
                        style={[styles.label, { color: theme.tabIconDefault }]}>
                        Email
                      </Text>
                      <Text style={[styles.value, { color: theme.text }]}>
                        {selectedUser.email}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoGroup}>
                    <Briefcase size={20} color={theme.primary} />
                    <View style={styles.infoTextGroup}>
                      <Text
                        style={[styles.label, { color: theme.tabIconDefault }]}>
                        Penempatan
                      </Text>
                      {selectedUser.branchLocations?.map((loc: any) => (
                        <Text
                          key={loc._id}
                          style={[styles.value, { color: theme.text }]}>
                          • {loc.name} ({loc.code})
                        </Text>
                      ))}
                      {(!selectedUser.branchLocations ||
                        selectedUser.branchLocations.length === 0) && (
                        <Text style={[styles.value, { color: theme.danger }]}>
                          Belum ada penempatan!
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[
                      styles.btnAction,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={() => openEditModal(selectedUser)}>
                    <Edit3 color="#fff" size={20} />
                    <Text style={styles.btnText}>EDIT</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.btnAction,
                      { backgroundColor: theme.danger },
                    ]}
                    onPress={() =>
                      handleDelete(selectedUser._id, selectedUser.fullname)
                    }>
                    <Trash2 color="#fff" size={20} />
                    <Text style={styles.btnText}>HAPUS</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL PILIH CABANG */}
      <Modal visible={branchModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, maxHeight: "50%" },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                PILIH CABANG
              </Text>
              <TouchableOpacity onPress={() => setBranchModalVisible(false)}>
                <X color={theme.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableBranches}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    padding: 15,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                    backgroundColor:
                      formData.branchLocations === item.code
                        ? theme.primary + "20"
                        : "transparent",
                  }}
                  onPress={() => {
                    if (editVisible && editData) {
                      let newLocs = [...editData.branchLocations];
                      if (activeBranchIndex !== null) {
                        newLocs[activeBranchIndex] = item.code; // Ganti yang ada
                      } else {
                        if (!newLocs.includes(item.code))
                          newLocs.push(item.code); // Nambah baru
                      }
                      setEditData({ ...editData, branchLocations: newLocs });
                    } else {
                      setFormData({ ...formData, branchLocations: item.code }); // Mode rekrut
                    }
                    setBranchModalVisible(false);
                    setActiveBranchIndex(null);
                  }}>
                  <Text style={{ color: theme.text, fontWeight: "bold" }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: theme.tabIconDefault, fontSize: 12 }}>
                    {item.code}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* --- MODAL EDIT USER --- */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, height: "90%" },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                EDIT KARYAWAN
              </Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <X color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {editData && (
                <>
                  <View style={styles.formGroup}>
                    <Text
                      style={[styles.label, { color: theme.tabIconDefault }]}>
                      Nama Lengkap
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.text,
                          borderColor: theme.border,
                          paddingLeft: 15,
                        },
                      ]}
                      value={editData.fullname}
                      onChangeText={(t) =>
                        setEditData({ ...editData, fullname: t })
                      }
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text
                      style={[styles.label, { color: theme.tabIconDefault }]}>
                      Username
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.text,
                          borderColor: theme.border,
                          paddingLeft: 15,
                        },
                      ]}
                      value={editData.username}
                      onChangeText={(t) =>
                        setEditData({
                          ...editData,
                          username: t.toLowerCase().replace(/\s+/g, "_"),
                        })
                      }
                    />
                  </View>

                  {/* PASSWORD BARU (OPSIONAL) */}
                  <View style={styles.formGroup}>
                    <Text
                      style={[styles.label, { color: theme.tabIconDefault }]}>
                      Password Baru (Kosongkan jika tidak ganti)
                    </Text>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            color: theme.text,
                            borderColor: theme.border,
                            paddingLeft: 15,
                            flex: 1,
                          },
                        ]}
                        placeholder="••••••••"
                        placeholderTextColor="#666"
                        secureTextEntry
                        value={editData.password}
                        onChangeText={(t) =>
                          setEditData({ ...editData, password: t })
                        }
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text
                      style={[styles.label, { color: theme.tabIconDefault }]}>
                      Role
                    </Text>
                    <View style={styles.roleContainer}>
                      {["owner", "karyawan"].map((r) => (
                        <TouchableOpacity
                          key={r}
                          style={[
                            styles.roleBtn,
                            {
                              backgroundColor:
                                editData.role === r
                                  ? theme.primary
                                  : theme.border,
                            },
                          ]}
                          onPress={() => setEditData({ ...editData, role: r })}>
                          <Text style={{ color: "#fff", fontWeight: "bold" }}>
                            {r.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {editData.role === "karyawan" && (
                    <View style={styles.formGroup}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}>
                        <Text
                          style={[
                            styles.label,
                            { color: theme.tabIconDefault },
                          ]}>
                          Penempatan Cabang
                        </Text>

                        {/* TOMBOL TAMBAH CABANG */}
                        <TouchableOpacity
                          onPress={addBranchSlot}
                          style={{
                            backgroundColor: theme.primary,
                            padding: 5,
                            borderRadius: 5,
                          }}>
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 10,
                              fontWeight: "bold",
                            }}>
                            + TAMBAH CABANG
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* LIST CABANG YANG DIPILIH */}
                      {editData.branchLocations.map(
                        (code: string, index: number) => (
                          <View
                            key={index}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginTop: 10,
                            }}>
                            <TouchableOpacity
                              style={[
                                styles.input,
                                {
                                  borderColor: theme.border,
                                  justifyContent: "center",
                                  paddingLeft: 15,
                                  flex: 1,
                                  marginTop: 0,
                                },
                              ]}
                              onPress={() => {
                                setActiveBranchIndex(index); // Simpan index mana yang mau diganti
                                setBranchModalVisible(true);
                              }}>
                              <Text style={{ color: theme.text }}>
                                {code || "Pilih Cabang..."}
                              </Text>
                            </TouchableOpacity>

                            {/* TOMBOL HAPUS (X) */}
                            <TouchableOpacity
                              onPress={() => removeBranchSlot(index)}
                              style={{
                                marginLeft: 10,
                                backgroundColor: theme.danger + "20",
                                padding: 10,
                                borderRadius: 10,
                              }}>
                              <X color={theme.danger} size={20} />
                            </TouchableOpacity>
                          </View>
                        ),
                      )}

                      {editData.branchLocations.length === 0 && (
                        <Text
                          style={{
                            color: theme.danger,
                            fontSize: 10,
                            marginTop: 5,
                          }}>
                          * Wajib pilih minimal 1 cabang bre!
                        </Text>
                      )}
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.btnActionSubmit,
                      { backgroundColor: theme.primary, marginTop: 20 },
                    ]}
                    onPress={handleUpdateUser}>
                    <Text style={styles.btnTextSubmit}>SIMPAN PERUBAHAN</Text>
                  </TouchableOpacity>
                </>
              )}
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
  title: { fontSize: 24, fontWeight: "900" },
  addBtn: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 2,
  },
  avatarBox: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  userMainInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "bold" },
  userSub: { fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  formGroup: { marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
    paddingLeft: 15, // Pake ini aja biar konsisten kiri
    paddingRight: 15, // Biar teks panjang kaga nabrak kanan
    fontSize: 15,
    marginTop: 5,
    justifyContent: "center", // Penting buat TouchableOpacity (dropdown)
  },
  roleContainer: { flexDirection: "row", gap: 10, marginTop: 5 },
  roleBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  detailBody: { marginBottom: 30 },
  infoGroup: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  infoTextGroup: { marginLeft: 15, flex: 1 },
  label: { fontSize: 12, marginBottom: 2 },
  value: { fontSize: 15, fontWeight: "bold" },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  btnAction: {
    flex: 0.48,
    flexDirection: "row",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  btnActionSubmit: {
    flexDirection: "row",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  btnText: { color: "#fff", fontWeight: "bold", marginLeft: 8 },
  btnTextSubmit: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    marginLeft: 10,
  },
});

export default ManageKaryawanScreen;
