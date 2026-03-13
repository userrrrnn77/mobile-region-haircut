import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  useColorScheme,
  StatusBar,
  TextInput, // Tambahin ini buat note sakit
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../store/AuthContext";
import { useLokasi } from "../../hooks/useLokasi";
import { useKamera } from "../../hooks/useKamera";
import { useUnggah } from "../../hooks/useUnggah";
import { checkIn, checkOut, izinSakit } from "../../api/layanan"; // <--- SYNC TOTAL
import { Colors } from "../../constants/Colors";
import { CustomButton } from "../../components/CustomButton";
import { CameraView, Camera } from "expo-camera";
import { MapPin, Camera as CameraIcon, Thermometer } from "lucide-react-native";

const CheckInScreen = ({ navigation, route }: any) => {
  const scheme = useColorScheme() || "dark";
  const theme = Colors[scheme as "light" | "dark"];

  const { user } = useAuth();
  const cameraRef = useRef<CameraView>(null);
  const day = new Date();

  const { ambilLokasi, hitungJarakSederhana } = useLokasi();
  const { image, setImage, resetImage, bukaGaleri } = useKamera();
  const { buatFormData } = useUnggah();

  // State Lokal
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [showModalSakit, setShowModalSakit] = useState<boolean>(false);
  const [dataGPS, setDataGPS] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [jarak, setJarak] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [sedangJepret, setSedangJepret] = useState<boolean>(false);
  const [noteSakit, setNoteSakit] = useState<string>("");

  const rukoCenter = user?.branchLocations[0]?.center || { lat: 0, lng: 0 };
  const radiusIzin = user?.branchLocations[0]?.radiusMeter || 7;
  const mode = route.params?.mode || "in";

  // LOGIC: Validasi GPS & Buka Kamera (Absen Masuk/Keluar)
  const handleValidasiDanKamera = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== "granted") return Alert.alert("Woy!", "Kamera butuh izin!");

    setLoading(true);
    const loc = await ambilLokasi();
    if (!loc) {
      setLoading(false);
      return;
    }

    const dist = hitungJarakSederhana(
      loc.lat,
      loc.lng,
      rukoCenter.lat,
      rukoCenter.lng,
    );
    const roundDist = Math.round(dist);
    setDataGPS(loc);
    setJarak(roundDist);

    if (roundDist > radiusIzin) {
      setLoading(false);
      return Alert.alert(
        "JAUH JEMBOT!",
        `Jarak lu ${roundDist}m. Syarat < ${radiusIzin}m!`,
      );
    }

    setLoading(false);
    setShowScanner(true);
  };

  const handlesJepret = async () => {
    if (cameraRef.current) {
      setSedangJepret(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.3,
        });
        if (photo) {
          setImage(photo.uri);
          setShowScanner(false);
        }
      } catch (error) {
        Alert.alert("Error", "Gagal jepret.");
      } finally {
        setSedangJepret(false);
      }
    }
  };

  // LOGIC: Kirim Izin Sakit ke BE
  const handleGasSakit = async () => {
    if (!image)
      return Alert.alert("Bukti Foto!", "Foto surat dokter atau obat lu mbot!");
    setLoading(true);

    try {
      const loc = dataGPS || (await ambilLokasi()) || { lat: 0, lng: 0 };
      const data = buatFormData(
        {
          lat: loc.lat.toString(),
          lng: loc.lng.toString(),
          note: noteSakit || "Izin Sakit Bre",
        },
        image,
        "photo",
      ); // BE lu minta 'photo'

      await izinSakit(data);
      Alert.alert(
        "CEPAT SEMBUH!",
        "Izin sakit terkirim, jangan keluyuran lu anjg",
      );
      resetImage();
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("GAGAL", err.response?.data?.message || "Error Kirim Sakit");
    } finally {
      setLoading(false);
    }
  };

  // LOGIC: Submit Absen (Masuk / Keluar)
  const handleGasSubmit = async () => {
    if (!dataGPS) return Alert.alert("Error", "GPS belum valid.");
    setLoading(true);
    try {
      if (mode === "in") {
        if (!image) throw new Error("Foto muke lu!");
        const data = buatFormData(
          {
            lat: dataGPS.lat.toString(),
            lng: dataGPS.lng.toString(),
            note: `Check-in radius ${jarak}m`,
          },
          image,
          "photo",
        );
        await checkIn(data);
      } else {
        await checkOut({
          lat: dataGPS.lat,
          lng: dataGPS.lng,
          note: "Checkout Mobile",
        });
      }
      Alert.alert("SUKSES!", "Aman bre.");
      resetImage();
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("GAGAL", err.response?.data?.message || "Error Backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={scheme === "dark" ? "light-content" : "dark-content"}
      />

      {/* MODAL KAMERA (Tetap Elit) */}
      <Modal visible={showScanner} animationType="slide">
        <View style={styles.cameraScreen}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="front"
          />
          <View style={styles.overlayContainer} pointerEvents="none">
            <View style={[styles.faceFrame, { borderColor: theme.primary }]} />
            <View style={styles.watermarkBox}>
              <Text style={styles.wmText}>{day.toLocaleString("id-ID")}</Text>
              <Text style={styles.wmText}>Jarak: {jarak}m</Text>
            </View>
          </View>
          <View style={styles.cameraControls}>
            <TouchableOpacity
              onPress={() => setShowScanner(false)}
              style={styles.btnBatal}>
              <Text style={{ color: "#fff" }}>BATAL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlesJepret}
              disabled={sedangJepret}
              style={[styles.btnJepret, { backgroundColor: theme.primary }]}>
              {sedangJepret ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <CameraIcon size={40} color="#fff" />
              )}
            </TouchableOpacity>
            <View style={{ width: 60 }} />
          </View>
        </View>
      </Modal>

      {/* MODAL IZIN SAKIT */}
      <Modal visible={showModalSakit} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              FORM IZIN SAKIT
            </Text>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={() => bukaGaleri()}>
              {image ? (
                <Image source={{ uri: image }} style={styles.previewImage} />
              ) : (
                <Text style={{ color: "#aaa" }}>
                  Klik buat upload bukti foto
                </Text>
              )}
            </TouchableOpacity>
            <TextInput
              placeholder="Alasan / Nama Penyakit..."
              style={[
                styles.input,
                { color: theme.text, borderColor: theme.border },
              ]}
              placeholderTextColor="#999"
              onChangeText={setNoteSakit}
            />
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <TouchableOpacity
                onPress={() => setShowModalSakit(false)}
                style={[styles.btnSmall, { backgroundColor: "#FF3B30" }]}>
                <Text style={{ color: "#fff" }}>BATAL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleGasSakit}
                style={[styles.btnSmall, { backgroundColor: theme.primary }]}>
                <Text style={{ color: "#fff" }}>KIRIM</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ padding: 25 }}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          ABSEN {mode === "in" ? "MASUK" : "KELUAR"}
        </Text>

        <View
          style={[
            styles.statusCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}>
          <View style={styles.row}>
            <MapPin size={24} color={theme.primary} />
            <Text style={[styles.branchName, { color: theme.text }]}>
              {user?.branchLocations[0]?.name}
            </Text>
          </View>
          <View style={styles.distanceValueContainer}>
            <Text
              style={[
                styles.distanceValue,
                { color: (jarak || 999) <= radiusIzin ? "green" : "red" },
              ]}>
              {jarak ?? "--"} <Text style={{ fontSize: 20 }}>Meter</Text>
            </Text>
            <CustomButton
              title="CEK JARAK & FOTO"
              onPress={handleValidasiDanKamera}
              loading={loading}
            />
          </View>
        </View>

        <View
          style={[
            styles.fotoArea,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <CameraIcon size={60} color={theme.tabIconDefault} />
          )}
        </View>

        <View style={{ marginTop: 20 }}>
          <CustomButton
            title={mode === "in" ? "GAS CHECK-IN" : "GAS CHECK-OUT"}
            onPress={handleGasSubmit}
            loading={loading}
          />

          {/* TOMBOL SAKIT: Muncul cuma pas mau Check-in */}
          {mode === "in" && (
            <TouchableOpacity
              style={styles.btnSakit}
              onPress={() => {
                resetImage();
                setShowModalSakit(true);
              }}>
              <Thermometer size={20} color="#FF3B30" />
              <Text style={styles.txtSakit}>Sakit? Klik sini Bre</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    marginVertical: 20,
  },
  statusCard: { padding: 20, borderRadius: 20, borderWidth: 1 },
  row: { flexDirection: "row", alignItems: "center" },
  branchName: { fontSize: 16, fontWeight: "bold", marginLeft: 10 },
  distanceValueContainer: { alignItems: "center", marginTop: 10 },
  distanceValue: { fontSize: 40, fontWeight: "900" },
  fotoArea: {
    width: "100%",
    height: 250,
    marginTop: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  previewImage: { width: "100%", height: "100%" },
  btnSakit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  txtSakit: { color: "#FF3B30", fontWeight: "bold", marginLeft: 5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { padding: 20, borderRadius: 20 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  uploadBox: {
    width: "100%",
    height: 150,
    backgroundColor: "#eee",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    overflow: "hidden",
  },
  input: { borderWidth: 1, borderRadius: 10, padding: 15, marginBottom: 20 },
  btnSmall: {
    padding: 15,
    borderRadius: 10,
    width: "45%",
    alignItems: "center",
  },
  cameraScreen: { flex: 1, backgroundColor: "#000" },
  overlayContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  faceFrame: {
    width: 220,
    height: 280,
    borderWidth: 2,
    borderRadius: 100,
    borderStyle: "dashed",
  },
  watermarkBox: {
    position: "absolute",
    bottom: 100,
    right: 20,
    alignItems: "flex-end",
  },
  wmText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  cameraControls: {
    position: "absolute",
    bottom: 30,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  btnJepret: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  btnBatal: { padding: 15 },
});

export default CheckInScreen;
