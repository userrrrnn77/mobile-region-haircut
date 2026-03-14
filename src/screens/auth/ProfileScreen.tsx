import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  useColorScheme,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../../constants/Colors";
import { useAuth } from "../../store/AuthContext"; // PAKE HOOK LU, BRE!
import { updateProfile } from "../../api/layanan";
import {
  User as UserIcon,
  Mail,
  Lock,
  LogOut,
  Camera,
  Moon,
  Sun,
  Save,
  UserCircle,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

const ProfileScreen = () => {
  // Ambil data & fungsi dari AuthContext sakti lu
  const { user, signOut, updateUserData } = useAuth();

  // Logic Theme (Simpel & Gak Ribet)
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === "dark");
  const theme = Colors[isDark ? "dark" : "light"];

  // State Form
  const [loading, setLoading] = useState(false);
  const [fullname, setFullname] = useState(user?.fullname || "");
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [image, setImage] = useState<string | null>(user?.avatar || null);

  // Load Theme Preference pas start
  useEffect(() => {
    (async () => {
      const savedTheme = await AsyncStorage.getItem("themeType");
      if (savedTheme) setIsDark(savedTheme === "dark");
    })();
  }, []);

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    await AsyncStorage.setItem("themeType", newTheme ? "dark" : "light");
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("fullname", fullname);
      formData.append("username", username);

      // Password cuma dikirim kalo user input sesuatu (Logic backend lu aman)
      if (password.trim() !== "") {
        formData.append("password", password);
      }

      // Handle upload foto baru
      if (image && image !== user?.avatar) {
        const filename = image.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        const type = match ? `image/${match[1]}` : `image`;
        formData.append("avatar", { uri: image, name: filename, type } as any);
      }

      const res = await updateProfile(formData);

      if (res.data.success) {
        Alert.alert("MANTAP", "Profil lu udah ganteng sekarang, bre!");
        // Update state global via AuthContext lu
        updateUserData(res.data.data);
        setPassword(""); // Reset field password
      }
    } catch (err: any) {
      Alert.alert(
        "GAGAL",
        err.response?.data?.message || "Gagal update profile, mbot!",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("CABUT?", "Yakin mau logout? Cuan nungguin lu loh, bgsd!", [
      { text: "STAY", style: "cancel" },
      { text: "OUT", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={[styles.title, { color: theme.text }]}>PROFIL SAYA</Text>

        {/* AVATAR GANTENG */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
            {image ? (
              <Image
                key={image} // <--- KASIH INI BRE! Biar dipaksa render pas state ganti
                source={{ uri: image }}
                style={styles.avatar}
                onLoad={() => console.log("Berhasil Render!")}
                onError={(e) =>
                  console.log("Gagal Render:", e.nativeEvent.error)
                }
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}>
                <UserIcon size={50} color={theme.tabIconDefault} />
              </View>
            )}
            <View style={[styles.camBtn, { backgroundColor: theme.primary }]}>
              <Camera size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* SETTINGS CARD */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}>
          <View style={styles.row}>
            <View style={styles.iconCircle}>
              {isDark ? (
                <Moon size={18} color={theme.primary} />
              ) : (
                <Sun size={18} color={theme.primary} />
              )}
            </View>
            <Text style={[styles.cardText, { color: theme.text }]}>
              Dark Mode
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: "#767577", true: theme.primary }}
          />
        </View>

        {/* FORM INPUTS */}
        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.tabIconDefault }]}>
            Nama Lengkap
          </Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}>
            <UserCircle size={20} color={theme.tabIconDefault} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={fullname}
              onChangeText={setFullname}
              placeholder="Fullname"
            />
          </View>

          <Text style={[styles.label, { color: theme.tabIconDefault }]}>
            Username
          </Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}>
            <Mail size={20} color={theme.tabIconDefault} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              autoCapitalize="none"
            />
          </View>

          <Text style={[styles.label, { color: theme.tabIconDefault }]}>
            Password Baru (Isi jika ingin ganti)
          </Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}>
            <Lock size={20} color={theme.tabIconDefault} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />
          </View>
        </View>

        {/* TOMBOL-TOMBOL SAKTI */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.primary }]}
          onPress={handleUpdate}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" />
              <Text style={styles.saveBtnText}>SIMPAN PERUBAHAN</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color={theme.danger} />
          <Text style={[styles.logoutText, { color: theme.danger }]}>
            KELUAR DARI APLIKASI
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: "900", marginBottom: 25 },
  avatarSection: { alignItems: "center", marginBottom: 30 },
  imageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  camBtn: {
    position: "absolute",
    bottom: 5,
    right: 5,
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#fff",
  },
  roleLabel: {
    fontWeight: "900",
    marginTop: 12,
    letterSpacing: 2,
    fontSize: 12,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 25,
  },
  row: { flexDirection: "row", alignItems: "center" },
  iconCircle: {
    width: 35,
    height: 35,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,58,97,0.1)",
  },
  cardText: { marginLeft: 12, fontWeight: "bold", fontSize: 16 },
  form: { marginBottom: 25 },
  label: { fontSize: 12, fontWeight: "bold", marginBottom: 8, marginLeft: 5 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 15,
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16 },
  saveBtn: {
    height: 60,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
    marginLeft: 10,
  },
  logoutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
    padding: 15,
  },
  logoutText: { fontWeight: "900", marginLeft: 10, letterSpacing: 1 },
});

export default ProfileScreen;
