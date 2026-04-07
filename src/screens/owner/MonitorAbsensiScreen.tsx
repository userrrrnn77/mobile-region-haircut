// src/screens/owner/MonitorAbsensiScreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { getAllAbsensi } from "../../api/layanan";
import {
  MapPin,
  Clock,
  User as UserIcon,
  Calendar,
  Thermometer,
  X,
  Info,
} from "lucide-react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const MonitorAbsensiScreen = () => {
  const scheme = useColorScheme() || "dark";
  const theme = Colors[scheme as "light" | "dark"];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataAbsensi, setDataAbsensi] = useState<any[]>([]);

  // State buat Modal Detail
  const [selectedAbsen, setSelectedAbsen] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchAbsensi = async () => {
    try {
      const res = await getAllAbsensi();
      // Pastiin ambil data dari res.data.data sesuai log lu
      if (res.data?.success) {
        setDataAbsensi(res.data.data);
      } else if (Array.isArray(res.data)) {
        setDataAbsensi(res.data);
      }
    } catch (err) {
      console.error("ERR_MONITOR_ABSEN:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAbsensi();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAbsensi();
  };

  const handleOpenDetail = (item: any) => {
    setSelectedAbsen(item);
    setShowModal(true);
  };

  const renderItem = ({ item }: { item: any }) => {
    const isSakit = item.type === "sakit";
    const statusColor = isSakit
      ? theme.danger
      : item.type === "masuk"
        ? theme.success
        : theme.primary;

    // FIX FOTO: Ambil dari locationSnapShot.photo
    const photoUrl = item.photo;

    // console.log(dataAbsensi); // undefined

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleOpenDetail(item)}
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: theme.border },
              ]}>
              <UserIcon size={20} color={theme.tabIconDefault} />
            </View>
            <View>
              <Text style={[styles.userName, { color: theme.text }]}>
                {item.user?.fullname || "Karyawan"}
              </Text>
              <Text style={[styles.userRole, { color: theme.tabIconDefault }]}>
                @{item.user?.username}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: statusColor + "20", borderColor: statusColor },
            ]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {item.type.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.contentRow}>
          <View style={[styles.imageContainer, { borderColor: theme.border }]}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.absensiImage} />
            ) : (
              <View style={styles.noImage}>
                <Text style={{ fontSize: 10, color: "#999" }}>No Photo</Text>
              </View>
            )}
          </View>

          <View style={styles.details}>
            <View style={styles.infoRow}>
              <Clock size={14} color={theme.tabIconDefault} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                {new Date(item.createdAt).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                WIB
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MapPin size={14} color={theme.tabIconDefault} />
              <Text
                style={[styles.infoText, { color: theme.text }]}
                numberOfLines={1}>
                {item.locationSnapShot?.name || "Gedang Anak"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Info size={14} color={theme.primary} />
              <Text
                style={[styles.infoText, { color: theme.text }]}
                numberOfLines={1}>
                {item.distanceFromCenter
                  ? `Jarak: ${Math.round(item.distanceFromCenter)}m`
                  : `Radius: ${item.locationSnapShot?.radiusMeter}m`}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={scheme === "dark" ? "light-content" : "dark-content"}
      />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          PANTAU ABSENSI
        </Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Calendar size={20} color={theme.primary} />
          <Text
            style={{ color: theme.primary, marginLeft: 5, fontWeight: "bold" }}>
            Hari Ini
          </Text>
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
          data={dataAbsensi}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ color: theme.tabIconDefault }}>
                Belum ada yang absen bgsd!
              </Text>
            </View>
          }
        />
      )}

      {/* MODAL DETAIL ABSENSI */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Detail Bukti Absen
              </Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeBtn}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {selectedAbsen && (
              <View>
                {/* Foto Gede (FIXED PATH) */}
                <View
                  style={[
                    styles.largeImageContainer,
                    { borderColor: theme.border },
                  ]}>
                  {selectedAbsen.photo ? (
                    <Image
                      source={{ uri: selectedAbsen.photo }}
                      style={styles.largeImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.noImageLarge}>
                      <Text style={{ color: theme.tabIconDefault }}>
                        No Photo Evidence
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalBody}>

                  <View style={styles.detailRow}>
                    <Calendar size={18} color={theme.primary} />
                    <View style={{ marginLeft: 10 }}>
                      <Text
                        style={{ color: theme.tabIconDefault, fontSize: 12 }}>
                        Tanggal
                      </Text>
                      <Text
                        style={{
                          color: theme.text,
                          fontWeight: "bold",
                          fontSize: 16,
                        }}>
                        {selectedAbsen.absensiDayKey || "Tanggal"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <UserIcon size={18} color={theme.primary} />
                    <View style={{ marginLeft: 10 }}>
                      <Text
                        style={{ color: theme.tabIconDefault, fontSize: 12 }}>
                        Karyawan
                      </Text>
                      <Text
                        style={{
                          color: theme.text,
                          fontWeight: "bold",
                          fontSize: 16,
                        }}>
                        {selectedAbsen.user?.fullname || "User"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Clock size={18} color={theme.primary} />
                    <View style={{ marginLeft: 10 }}>
                      <Text
                        style={{ color: theme.tabIconDefault, fontSize: 12 }}>
                        Waktu & Durasi
                      </Text>
                      <Text style={{ color: theme.text, fontWeight: "bold" }}>
                        {new Date(selectedAbsen.createdAt).toLocaleTimeString()}{" "}
                        -
                        <Text
                          style={{
                            color:
                              selectedAbsen.type === "masuk"
                                ? theme.success
                                : theme.primary,
                          }}>
                          {" "}
                          {selectedAbsen.type.toUpperCase()}
                        </Text>
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <MapPin size={18} color={theme.primary} />
                    <View style={{ marginLeft: 10 }}>
                      <Text
                        style={{ color: theme.tabIconDefault, fontSize: 12 }}>
                        Lokasi & Jarak
                      </Text>
                      <Text style={{ color: theme.text, fontWeight: "500" }}>
                        {selectedAbsen.locationSnapShot?.name}
                      </Text>
                      <Text
                        style={{ color: theme.tabIconDefault, fontSize: 11 }}>
                        Presisi:{" "}
                        {Math.round(selectedAbsen.distanceFromCenter || 0)}{" "}
                        meter dari titik pusat
                      </Text>
                    </View>
                  </View>

                  {selectedAbsen.note && (
                    <View
                      style={[
                        styles.noteBox,
                        { backgroundColor: theme.border + "40" },
                      ]}>
                      <Text
                        style={{ color: theme.tabIconDefault, fontSize: 11 }}>
                        Catatan System/User:
                      </Text>
                      <Text style={{ color: theme.text, fontStyle: "italic" }}>
                        "{selectedAbsen.note}"
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
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
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 24, fontWeight: "900" },
  refreshBtn: { flexDirection: "row", alignItems: "center" },
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
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userInfo: { flexDirection: "row", alignItems: "center" },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  userName: { fontSize: 16, fontWeight: "bold" },
  userRole: { fontSize: 12 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: "900" },
  contentRow: { flexDirection: "row", alignItems: "center" },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#eee",
  },
  absensiImage: { width: "100%", height: "100%" },
  noImage: { flex: 1, justifyContent: "center", alignItems: "center" },
  details: { flex: 1, marginLeft: 15, justifyContent: "center" },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  infoText: { fontSize: 13, marginLeft: 6 },
  emptyState: { alignItems: "center", marginTop: 100 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    borderRadius: 30,
    padding: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "900" },
  closeBtn: { padding: 5 },
  largeImageContainer: {
    width: "100%",
    height: screenHeight * 0.4,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 20,
  },
  largeImage: { width: "100%", height: "100%" },
  noImageLarge: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalBody: { paddingHorizontal: 5 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  noteBox: { marginTop: 10, padding: 15, borderRadius: 15 },
});

export default MonitorAbsensiScreen;
