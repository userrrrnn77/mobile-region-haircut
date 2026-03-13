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
} from "lucide-react-native";

const MonitorAbsensiScreen = () => {
  const scheme = useColorScheme() || "dark";
  const theme = Colors[scheme as "light" | "dark"];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataAbsensi, setDataAbsensi] = useState<any[]>([]);

  const fetchAbsensi = async () => {
    try {
      // BE lu nerima params startDate & endDate kalo mau filter,
      // tapi default-nya narik semua (berdasarkan controller lu)
      const res = await getAllAbsensi();
      if (res.data) {
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

  const renderItem = ({ item }: { item: any }) => {
    const isSakit = item.type === "sakit";
    const statusColor = isSakit
      ? theme.danger
      : item.type === "masuk"
        ? theme.success
        : theme.primary;

    return (
      <View
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
          {/* FOTO ABSEN */}
          <View style={[styles.imageContainer, { borderColor: theme.border }]}>
            {item.attachments?.[0]?.url ? (
              <Image
                source={{ uri: item.attachments[0].url }}
                style={styles.absensiImage}
              />
            ) : (
              <View style={styles.noImage}>
                <Text style={{ fontSize: 10, color: "#999" }}>No Photo</Text>
              </View>
            )}
          </View>

          {/* DETAIL INFO */}
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
                {item.locationSnapShot?.name || "Lokasi kaga jelas"}
              </Text>
            </View>
            {isSakit ? (
              <View style={styles.infoRow}>
                <Thermometer size={14} color={theme.danger} />
                <Text
                  style={[
                    styles.infoText,
                    { color: theme.danger, fontWeight: "bold" },
                  ]}>
                  Note: {item.note || "Izin sakit mbot"}
                </Text>
              </View>
            ) : (
              <View style={styles.infoRow}>
                <TrendingUp size={14} color={theme.primary} />
                <Text style={[styles.infoText, { color: theme.text }]}>
                  Radius: {Math.round(item.distanceMetres || 0)}m
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
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
    </SafeAreaView>
  );
};

// Helper Icon biar kaga error (kalo lupa import)
const TrendingUp = ({ size, color }: any) => (
  <MapPin size={size} color={color} />
);

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
});

export default MonitorAbsensiScreen;
