import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useJobAids } from '@/services/job-aids/job-aids-queries'
import type { JobAid } from '@/services/job-aids/job-aids-types'

function JobAidCard({ item }: { item: JobAid }) {
  const isPublished = item.status === 'published'
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(app)/(job-aids)/[id]', params: { id: item.id } })}
      className="bg-white rounded-2xl overflow-hidden shadow-sm mb-3 active:opacity-80"
    >
      <View className="w-full bg-gray-100" style={{ aspectRatio: 16 / 9 }}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="document-text-outline" size={32} color="#D1D5DB" />
          </View>
        )}
        <View
          className={`absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white ${
            isPublished ? 'bg-green-500' : 'bg-amber-400'
          }`}
        />
      </View>
      <View className="px-4 py-3 gap-y-1">
        <Text className="text-sm font-bold text-gray-900" numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="text-xs text-gray-500" numberOfLines={1}>
          {item.category ?? 'Uncategorized'}
        </Text>
        <Text className="text-xs text-gray-400" numberOfLines={1}>
          {item.estimated_duration != null ? `Duration: ${item.estimated_duration} min` : 'Duration: —'}
          {' · '}Views: {item.view_count}
        </Text>
      </View>
    </Pressable>
  )
}

export default function EquipmentJobAidsListScreen() {
  const insets = useSafeAreaInsets()
  const { equipment_id, title } = useLocalSearchParams<{ equipment_id: string; title: string }>()
  const { data, isLoading } = useJobAids({ equipment_id })
  const items = data?.data ?? []

  return (
    <View className="flex-1 bg-gray-50">
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center gap-x-3"
      >
        <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text className="flex-1 text-base font-bold text-gray-900" numberOfLines={1}>
          Job Aids · {title}
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#208AEF" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
          renderItem={({ item }) => <JobAidCard item={item} />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center gap-y-3 py-24">
              <Ionicons name="clipboard-outline" size={48} color="#D1D5DB" />
              <Text className="text-sm text-gray-400">No job aids attached</Text>
            </View>
          }
        />
      )}
    </View>
  )
}
