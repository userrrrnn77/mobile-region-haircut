// src/components/CustomButton.tsx

import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Colors } from "../constants/Colors";

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  type?: "primary" | "danger" | "disabled";
  disabled?: boolean;
}

export const CustomButton = ({
  title,
  onPress,
  loading,
  type = "primary",
  disabled,
}: Props) => {
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { backgroundColor: type === "danger" ? "#FF3B30" : "#003a61" },
      ]}
      onPress={onPress}
      disabled={loading || disabled || type === "disabled"}>
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textTransform: "uppercase",
  },
});
