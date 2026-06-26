import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  useUserById,
  useActivateUser,
  useDeactivateUser,
  useAdminDeleteUser,
} from "@/services/users/users-queries";
import { useAuthStore } from "@/store/auth-store";

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function InfoRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View>
      <View className="px-4 py-3 flex-row items-center justify-between">
        <Text className="text-xs text-gray-400 w-28">{label}</Text>
        <Text
          className="text-sm text-gray-800 flex-1 text-right"
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      {!isLast && <View className="h-px bg-gray-100 ml-4" />}
    </View>
  );
}

export default function UserDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin =
    currentUser?.role === "owner" || currentUser?.role === "admin" || currentUser?.role === "superadmin";

  const { data: userData, isLoading, error } = useUserById(id);
  const { mutate: activateUser } = useActivateUser();
  const { mutate: deactivateUser } = useDeactivateUser();
  const { mutate: deleteUser } = useAdminDeleteUser();

  function handleKebab() {
    if (!userData) return;
    const isActive =
      userData.is_active !== false && userData.status !== "inactive";
    Alert.alert(`${userData.first_name} ${userData.last_name}`, undefined, [
      {
        text: "Edit",
        onPress: () =>
          router.push({ pathname: "/(app)/(users)/edit", params: { id: id ?? "" } }),
      },
      {
        text: isActive ? "Deactivate" : "Activate",
        onPress: () =>
          Alert.alert(
            isActive ? "Deactivate User" : "Activate User",
            isActive
              ? "This will prevent the user from logging in."
              : "This will restore the users access.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: isActive ? "Deactivate" : "Activate",
                style: isActive ? "destructive" : "default",
                onPress: () =>
                  isActive ? deactivateUser(id ?? "") : activateUser(id ?? ""),
              },
            ],
          ),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          Alert.alert("Delete User", "This action cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () =>
                deleteUser(id ?? "", { onSuccess: () => router.back() }),
            },
          ]),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <View
          style={{ height: insets.top }}
          className="bg-black absolute top-0 left-0 right-0"
        />
        <ActivityIndicator color="#208AEF" />
      </View>
    );
  }

  if (error || !userData) {
    return (
      <View className="flex-1 bg-gray-50">
        <View style={{ height: insets.top }} className="bg-black" />
        <View className="flex-1 items-center justify-center gap-y-3">
          <Text className="text-sm text-gray-400">Failed to load user</Text>
          <Pressable
            onPress={() => router.back()}
            className="px-4 py-2 bg-blue-600 rounded-xl"
          >
            <Text className="text-sm text-white font-medium">Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isActive =
    userData.is_active !== false && userData.status !== "inactive";
  const initials = getInitials(userData.first_name, userData.last_name);

  return (
    <View className="flex-1 bg-gray-50">
      <View style={{ height: insets.top }} className="bg-black" />

      <View className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center gap-x-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="active:opacity-60"
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text
          className="flex-1 text-base font-bold text-gray-900"
          numberOfLines={1}
        >
          {userData.first_name} {userData.last_name}
        </Text>
        {isAdmin && (
          <Pressable
            onPress={handleKebab}
            hitSlop={8}
            className="active:opacity-60"
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          gap: 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* Avatar card */}
        <View className="bg-white rounded-2xl p-6 items-center gap-y-2">
          <View
            className="w-18 h-18 rounded-full bg-blue-100 items-center justify-center"
            style={{ width: 72, height: 72 }}
          >
            <Text className="text-2xl font-bold text-blue-700">{initials}</Text>
          </View>
          <Text className="text-lg font-bold text-gray-900 mt-1">
            {userData.first_name} {userData.last_name}
          </Text>
          <Text className="text-sm text-gray-500">{userData.email}</Text>
          <View className="flex-row items-center gap-x-2 mt-1">
            <View className="bg-blue-50 rounded-full px-3 py-1">
              <Text className="text-xs font-medium text-blue-700 capitalize">
                {userData.role}
              </Text>
            </View>
            <View
              className={`rounded-full px-3 py-1 ${isActive ? "bg-green-50" : "bg-gray-100"}`}
            >
              <Text
                className={`text-xs font-medium capitalize ${isActive ? "text-green-700" : "text-gray-500"}`}
              >
                {isActive ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
        </View>

        {/* Info card */}
        <View className="bg-white rounded-2xl overflow-hidden">
          <InfoRow label="Phone" value={userData.phone ?? "—"} />
          <InfoRow label="Team" value={userData.teams?.[0]?.name ?? "—"} />
          <InfoRow label="Joined" value={formatDate(userData.created_at)} />
          <InfoRow label="Last login" value={formatDate(userData.last_login)} />
          <InfoRow
            label="Email verified"
            value={userData.email_verified ? "Yes" : "No"}
            isLast
          />
        </View>

        <Text className="text-xs text-gray-400 text-center">
          ID · {userData.id.slice(0, 8)}…
        </Text>
      </ScrollView>
    </View>
  );
}
