import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useAuthStore } from '@/store/auth-store'
import { useEquipmentById, useDeleteEquipment } from '@/services/equipment/equipment-queries'
import type { UserRole } from '@/types/auth'

const ADMIN_ROLES: UserRole[] = ['superadmin', 'owner', 'admin']

const STATUS_BADGE = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Draft' },
  published: { bg: 'bg-green-100', text: 'text-green-700', label: 'Published' },
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-y-0.5">
      <Text className="text-xs text-gray-400 font-medium">{label}</Text>
      <Text className="text-sm text-gray-800 font-medium" numberOfLines={2}>
        {value}
      </Text>
    </View>
  )
}

export default function EquipmentDetailScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const user = useAuthStore((s) => s.user)
  const isAdmin = ADMIN_ROLES.includes((user?.role ?? '') as UserRole)

  const { data: equipmentData, isLoading, error } = useEquipmentById(id)
  const { mutate: deleteEquipment, isPending: isDeleting } = useDeleteEquipment()

  const equipment = equipmentData?.data

  function handleDelete() {
    if (!id) return
    Alert.alert('Delete Equipment', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteEquipment(id, { onSuccess: () => router.back() }),
      },
    ])
  }

  function handleKebab() {
    Alert.alert('Equipment Actions', undefined, [
      {
        text: 'Edit',
        onPress: () =>
          router.push({ pathname: '/(app)/(equipment)/edit', params: { id } }),
      },
      { text: 'Delete', style: 'destructive', onPress: handleDelete },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  if (isLoading) {
    return (
      <View
        className="flex-1 bg-gray-50 items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator color="#208AEF" />
      </View>
    )
  }

  if (error || !equipment) {
    return (
      <View
        className="flex-1 bg-gray-50 items-center justify-center gap-y-3"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-sm text-gray-400">Failed to load equipment</Text>
        <Pressable onPress={() => router.back()} className="px-4 py-2 bg-blue-600 rounded-xl">
          <Text className="text-sm text-white font-medium">Go back</Text>
        </Pressable>
      </View>
    )
  }

  const statusBadge = STATUS_BADGE[equipment.status] ?? STATUS_BADGE.draft

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
        <Text className="flex-1 text-base font-bold text-gray-900" numberOfLines={1}>
          {equipment.name}
        </Text>
        {isAdmin && (
          <Pressable
            onPress={handleKebab}
            disabled={isDeleting}
            hitSlop={8}
            className="active:opacity-60"
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }}
      >
        {/* Status + Type badges */}
        <View className="flex-row gap-x-2 flex-wrap">
          <View className={`px-3 py-1 rounded-full ${statusBadge.bg}`}>
            <Text className={`text-xs font-semibold ${statusBadge.text}`}>{statusBadge.label}</Text>
          </View>
          {equipment.equipmentType && (
            <View className="px-3 py-1 rounded-full bg-blue-100">
              <Text className="text-xs font-semibold text-blue-700">
                {equipment.equipmentType.name}
              </Text>
            </View>
          )}
        </View>

        {/* Info grid */}
        <View className="bg-white rounded-2xl p-4 gap-y-4">
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <InfoRow label="Reference Code" value={equipment.reference_code} />
            </View>
            <View className="flex-1">
              <InfoRow label="Status" value={statusBadge.label} />
            </View>
          </View>
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <InfoRow label="Equipment Type" value={equipment.equipmentType?.name ?? '—'} />
            </View>
            <View className="flex-1">
              <InfoRow label="Location" value={equipment.location?.name ?? '—'} />
            </View>
          </View>
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <InfoRow label="Created" value={formatDate(equipment.created_at)} />
            </View>
            <View className="flex-1">
              <InfoRow label="Updated" value={formatDate(equipment.updated_at)} />
            </View>
          </View>
        </View>

        {/* Notes */}
        {!!equipment.notes && (
          <View className="bg-white rounded-2xl p-4 gap-y-1.5">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Notes
            </Text>
            <Text className="text-sm text-gray-700 leading-5">{equipment.notes}</Text>
          </View>
        )}

        {/* QR Code indicator */}
        {!!equipment.qrcode && (
          <View className="bg-white rounded-2xl p-4 flex-row items-center gap-x-3">
            <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
              <Ionicons name="qr-code-outline" size={20} color="#208AEF" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-800">QR Code</Text>
              <Text className="text-xs text-gray-400 mt-0.5">QR code available for this equipment</Text>
            </View>
            <View className="w-2 h-2 rounded-full bg-green-400" />
          </View>
        )}
      </ScrollView>
    </View>
  )
}
