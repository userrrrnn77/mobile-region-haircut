import React from "react";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useColorScheme, ActivityIndicator, View } from "react-native";
import { useAuth } from "../store/AuthContext";
import { Colors } from "../constants/Colors";
import {
  LayoutDashboard,
  Users,
  MapPin,
  ClipboardList,
  UserCircle,
} from "lucide-react-native";

import LoginScreen from "../screens/auth/LoginScreen";
import ProfileScreen from "../screens/auth/ProfileScreen";
// owner
import DashboardOwnerScreen from "../screens/owner/DashboardOwnerScreen";
import MonitorAbsensiScreen from "../screens/owner/MonitorAbsensiScreen";
import ManageKaryawanScreen from "../screens/owner/ManageKaryawanScreen";
import ManageBranchScreen from "../screens/owner/ManageBranchScreen";
// karyawan
import CheckInScreen from "../screens/karyawan/CheckInScreen";
import DashboardKaryawanScreen from "../screens/karyawan/Dashboard";
import SetorLaporanScreen from "../screens/karyawan/SetorLaporanScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function OwnerTabNavigator() {
  const scheme = useColorScheme() || "light";
  const theme = Colors[scheme as "light" | "dark"];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 10,
        },
      }}>
      <Tab.Screen
        name="Stats"
        component={DashboardOwnerScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <LayoutDashboard color={color} size={24} />
          ),
          tabBarLabel: "Cuan",
        }}
      />
      <Tab.Screen
        name="Absensi"
        component={MonitorAbsensiScreen}
        options={{
          tabBarIcon: ({ color }) => <ClipboardList color={color} size={24} />,
          tabBarLabel: "Absen",
        }}
      />
      <Tab.Screen
        name="Staff"
        component={ManageKaryawanScreen}
        options={{
          tabBarIcon: ({ color }) => <Users color={color} size={24} />,
          tabBarLabel: "Staff",
        }}
      />
      <Tab.Screen
        name="Branch"
        component={ManageBranchScreen}
        options={{
          tabBarIcon: ({ color }) => <MapPin color={color} size={24} />,
          tabBarLabel: "Ruko",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <UserCircle color={color} size={24} />,
          tabBarLabel: "Me",
        }}
      />
    </Tab.Navigator>
  );
}

function KaryawanTabNavigator() {
  const scheme = useColorScheme() || "light";
  const theme = Colors[scheme as "light" | "dark"];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 10,
        },
      }}>
      <Tab.Screen
        name="Home"
        component={DashboardKaryawanScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <LayoutDashboard color={color} size={24} />
          ),
          tabBarLabel: "Beranda",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <UserCircle color={color} size={24} />,
          tabBarLabel: "Profil",
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const colorScheme = useColorScheme() || "light";
  const theme = Colors[colorScheme as "light" | "dark"];

  const MyTheme = {
    ...(colorScheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.primary,
      background: theme.background,
      card: theme.card,
      text: theme.text,
    },
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.background,
        }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={MyTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            {user.role === "owner" ? (
              <Stack.Screen name="OwnerRoot" component={OwnerTabNavigator} />
            ) : (
              <Stack.Screen
                name="KaryawanRoot"
                component={KaryawanTabNavigator}
              />
            )}
            <Stack.Screen name="CheckIn" component={CheckInScreen} />
            <Stack.Screen name="SetorLaporan" component={SetorLaporanScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
