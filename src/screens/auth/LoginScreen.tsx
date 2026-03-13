import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../store/AuthContext";
import { Colors } from "../../constants/Colors";
import { CustomButton } from "../../components/CustomButton";
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";

const LoginScreen = () => {
  const scheme = useColorScheme() || "dark";
  const theme = Colors[scheme as "light" | "dark"];
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secure, setSecure] = useState(true);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Woy!", "Email ama Password isi dulu bgsddd!");
    }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      Alert.alert("Gagal Login", err);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={[styles.logoCircle, { backgroundColor: theme.primary }]}>
            <Text style={styles.logoIcon}>✂️</Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            HAIRCUT<Text style={{ color: theme.primary }}>REGION</Text>
          </Text>
          <Text style={[styles.subTitle, { color: theme.tabIconDefault }]}>
            Masuk buat pantau cuan & absen hari ini
          </Text>
        </View>

        {/* Form Section */}
        <View
          style={[
            styles.form,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}>
          {/* Input Email */}
          <Text style={[styles.label, { color: theme.text }]}>Email</Text>
          <View
            style={[
              styles.inputContainer,
              { borderColor: theme.border, backgroundColor: theme.background },
            ]}>
            <Mail size={20} color={theme.tabIconDefault} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="barber@region.com"
              placeholderTextColor={theme.tabIconDefault}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Input Password */}
          <Text style={[styles.label, { color: theme.text }]}>Password</Text>
          <View
            style={[
              styles.inputContainer,
              { borderColor: theme.border, backgroundColor: theme.background },
            ]}>
            <Lock size={20} color={theme.tabIconDefault} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="••••••••"
              placeholderTextColor={theme.tabIconDefault}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secure}
            />
            <TouchableOpacity onPress={() => setSecure(!secure)}>
              {secure ? (
                <Eye size={20} color={theme.tabIconDefault} />
              ) : (
                <EyeOff size={20} color={theme.tabIconDefault} />
              )}
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 10 }}>
            <CustomButton
              title="MASUK SEKARANG"
              onPress={handleLogin}
              loading={loading}
            />
          </View>
        </View>

        {/* Footer */}
        <TouchableOpacity style={styles.footer}>
          <Text style={{ color: theme.tabIconDefault }}>
            Lupa password?{" "}
            <Text style={{ color: theme.primary, fontWeight: "bold" }}>
              Hubungi Owner
            </Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: "center", padding: 25 },
  header: { alignItems: "center", marginBottom: 30 },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  logoIcon: { fontSize: 35 },
  title: { fontSize: 28, fontWeight: "900", letterSpacing: -1 },
  subTitle: { fontSize: 14, marginTop: 5, textAlign: "center" },
  form: {
    padding: 20,
    borderRadius: 25,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 20,
  },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 8, marginLeft: 4 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 55,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, height: "100%", fontSize: 15 },
  footer: { marginTop: 25, alignItems: "center" },
});

export default LoginScreen;
