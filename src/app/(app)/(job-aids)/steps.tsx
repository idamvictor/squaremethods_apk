import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useDeleteProcedure, useJobAidById } from '@/services/job-aids/job-aids-queries'
import type { Procedure } from '@/services/job-aids/job-aids-types'
import { useAuthStore } from '@/store/auth-store'

const ADMIN_ROLES = ['superadmin', 'owner', 'admin']

function StepCard({
  procedure,
  index,
  jobAidId,
  isAdmin,
}: {
  procedure: Procedure
  index: number
  jobAidId: string
  isAdmin: boolean
}) {
  const { mutate: deleteProcedure } = useDeleteProcedure()

  function handleMenu() {
    Alert.alert(`Step ${procedure.step}`, undefined, [
      {
        text: 'Edit Step',
        onPress: () =>
          router.push({
            pathname: '/(app)/(job-aids)/procedure-form',
            params: {
              job_aid_id: jobAidId,
              id: procedure.id,
              step: String(procedure.step),
              title: procedure.title,
              instruction: procedure.instruction,
              image: procedure.image ?? '',
              precautions: JSON.stringify(procedure.precautions),
            },
          }),
      },
      {
        text: 'Delete Step',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete Step', 'Remove this step? This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => deleteProcedure({ id: procedure.id, job_aid_id: jobAidId }),
            },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/(app)/(job-aids)/step-view',
          params: { id: jobAidId, step_index: String(index) },
        })
      }
      className="bg-white rounded-2xl overflow-hidden shadow-sm mb-3 active:opacity-80"
    >
      <View className="flex-row items-center p-4 gap-x-3">
        {/* Thumbnail */}
        <View
          className="rounded-xl overflow-hidden flex-shrink-0"
          style={{ width: 80, height: 80, backgroundColor: '#F3F4F6' }}
        >
          {procedure.image ? (
            <Image
              source={{ uri: procedure.image }}
              style={{ width: 80, height: 80 }}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="image-outline" size={28} color="#D1D5DB" />
            </View>
          )}
        </View>

        {/* Content */}
        <View className="flex-1 gap-y-1 min-w-0">
          <View className="flex-row items-center gap-x-2">
            <View className="w-5 h-5 rounded-full bg-gray-700 items-center justify-center flex-shrink-0">
              <Text className="text-xs font-bold text-white" style={{ fontSize: 10 }}>
                {procedure.step}
              </Text>
            </View>
            <Text className="flex-1 text-sm font-bold text-gray-900" numberOfLines={1}>
              {procedure.title || `Step ${procedure.step}`}
            </Text>
            {procedure.precautions.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 6 }}>
                <Ionicons name="warning-outline" size={11} color="#B45309" />
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#B45309' }}>{procedure.precautions.length}</Text>
              </View>
            )}
            {isAdmin && (
              <Pressable onPress={handleMenu} hitSlop={8} className="active:opacity-60">
                <Ionicons name="ellipsis-horizontal" size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>

          <Text className="text-xs text-gray-500 leading-4" numberOfLines={2}>
            {procedure.instruction}
          </Text>

          <Text className="text-xs font-semibold text-blue-600 mt-0.5">View step ›</Text>
        </View>
      </View>
    </Pressable>
  )
}

export default function StepsScreen() {
  const insets = useSafeAreaInsets()
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>()
  const { user } = useAuthStore()
  const isAdmin = ADMIN_ROLES.includes(user?.role ?? '')

  const { data, isLoading } = useJobAidById(id)
  const jobAid = data?.data
  const sortedProcedures = [...(jobAid?.procedures ?? [])].sort((a, b) => a.step - b.step)

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
          {title || 'Steps'}
        </Text>
        {isAdmin && (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(app)/(job-aids)/procedure-form',
                params: {
                  job_aid_id: id,
                  step: String(sortedProcedures.length + 1),
                },
              })
            }
            className="w-9 h-9 bg-blue-600 rounded-xl items-center justify-center active:opacity-70"
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#208AEF" />
        </View>
      ) : (
        <FlatList
          data={sortedProcedures}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 32,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center gap-y-3 py-24">
              <Ionicons name="clipboard-outline" size={48} color="#D1D5DB" />
              <Text className="text-sm text-gray-400">No steps yet</Text>
              {isAdmin && (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/(job-aids)/procedure-form',
                      params: { job_aid_id: id, step: '1' },
                    })
                  }
                  className="mt-2 px-5 py-2.5 bg-blue-600 rounded-xl active:opacity-70"
                >
                  <Text className="text-sm font-semibold text-white">Add First Step</Text>
                </Pressable>
              )}
            </View>
          }
          renderItem={({ item, index }) => (
            <StepCard
              procedure={item}
              index={index}
              jobAidId={id}
              isAdmin={isAdmin}
            />
          )}
        />
      )}
    </View>
  )
}
