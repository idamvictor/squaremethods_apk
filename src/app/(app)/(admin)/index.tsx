import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useAuthStore } from '@/store/auth-store'

interface NavRow {
  label: string
  subtitle: string
  icon: keyof typeof Ionicons.glyphMap
  href: string
}

const NAV_ROWS: NavRow[] = [
  {
    label: 'Companies',
    subtitle: 'Manage company accounts',
    icon: 'business-outline',
    href: '/(app)/(admin)/companies',
  },
  {
    label: 'Users',
    subtitle: 'Manage platform users',
    icon: 'people-outline',
    href: '/(app)/(admin)/users',
  },
  {
    label: 'Equipment Types',
    subtitle: 'Global equipment catalog',
    icon: 'cube-outline',
    href: '/(app)/(admin)/equipment-types',
  },
]

function Divider() {
  return <View className="h-px bg-gray-100 ml-16" />
}

export default function AdminIndexScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)

  if (user?.role !== 'superadmin') {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center gap-y-4">
        <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center">
          <Ionicons name="shield-outline" size={32} color="#D1D5DB" />
        </View>
        <Text className="text-base font-semibold text-gray-700">Access Denied</Text>
        <Text className="text-sm text-gray-400 text-center px-8">
          This area is restricted to superadmins only.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="px-6 py-2.5 bg-blue-600 rounded-xl active:opacity-80"
        >
          <Text className="text-sm font-semibold text-white">Go Back</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center gap-x-3"
      >
        <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text className="flex-1 text-lg font-bold text-gray-900">Admin Console</Text>
        <Ionicons name="shield-checkmark" size={22} color="#208AEF" />
      </View>

      <View className="px-4 pt-6">
        <View className="bg-white rounded-2xl overflow-hidden">
          {NAV_ROWS.map((row, index) => (
            <View key={row.label}>
              <Pressable
                onPress={() => router.push(row.href as any)}
                className="flex-row items-center px-4 py-3.5 active:bg-gray-50 gap-x-3"
              >
                <View className="w-9 h-9 rounded-full bg-blue-50 items-center justify-center">
                  <Ionicons name={row.icon} size={18} color="#208AEF" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-800">{row.label}</Text>
                  <Text className="text-xs text-gray-400 mt-0.5">{row.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </Pressable>
              {index < NAV_ROWS.length - 1 && <Divider />}
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
