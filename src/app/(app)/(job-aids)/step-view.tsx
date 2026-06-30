import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useJobAidById } from '@/services/job-aids/job-aids-queries'
import { useAuthStore } from '@/store/auth-store'

const ADMIN_ROLES = ['superadmin', 'owner', 'admin']

export default function StepViewScreen() {
  const insets = useSafeAreaInsets()
  const { id, step_index } = useLocalSearchParams<{ id: string; step_index: string }>()
  const { user } = useAuthStore()
  const isAdmin = ADMIN_ROLES.includes(user?.role ?? '')

  const [index, setIndex] = useState(Number(step_index ?? 0))
  const scrollRef = useRef<ScrollView>(null)

  const { data, isLoading } = useJobAidById(id)
  const jobAid = data?.data
  const sorted = [...(jobAid?.procedures ?? [])].sort((a, b) => a.step - b.step)
  const total = sorted.length
  const procedure = sorted[index]

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false })
  }, [index])

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator color="#208AEF" />
      </View>
    )
  }

  if (!procedure) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-8 gap-y-3">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-sm text-gray-500 text-center">Step not found.</Text>
        <Pressable onPress={() => router.back()} className="active:opacity-60">
          <Text className="text-sm font-semibold text-blue-600">Go back</Text>
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
        <Text className="flex-1 text-base font-bold text-gray-900">
          Step {index + 1} of {total}
        </Text>
        {isAdmin && (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(app)/(job-aids)/procedure-form',
                params: {
                  job_aid_id: id,
                  id: procedure.id,
                  step: String(procedure.step),
                  title: procedure.title,
                  instruction: procedure.instruction,
                  image: procedure.image ?? '',
                },
              })
            }
            hitSlop={8}
            className="active:opacity-60"
          >
            <Text className="text-sm font-semibold text-blue-600">Edit</Text>
          </Pressable>
        )}
      </View>

      {/* Scrollable content */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Step image */}
        <View style={{ aspectRatio: 16 / 9, backgroundColor: '#F3F4F6' }}>
          {procedure.image ? (
            <Image
              source={{ uri: procedure.image }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="image-outline" size={48} color="#D1D5DB" />
            </View>
          )}
        </View>

        {/* Step body */}
        <View className="p-4 gap-y-4">
          {/* Step number + title */}
          <View className="flex-row items-start gap-x-3">
            <View
              className="items-center justify-center rounded-full bg-gray-700 flex-shrink-0"
              style={{ width: 32, height: 32 }}
            >
              <Text className="text-sm font-bold text-white">{procedure.step}</Text>
            </View>
            <Text className="flex-1 text-xl font-bold text-gray-900 pt-0.5">
              {procedure.title || `Step ${procedure.step}`}
            </Text>
          </View>

          {/* Instructions */}
          <View className="gap-y-2">
            <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Instructions
            </Text>
            <Text className="text-sm text-gray-700 leading-6">{procedure.instruction}</Text>
          </View>

          {/* Precautions */}
          {procedure.precautions.length > 0 && (
            <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 gap-y-2">
              <View className="flex-row items-center gap-x-1.5">
                <Ionicons name="warning-outline" size={16} color="#B45309" />
                <Text className="text-sm font-semibold text-amber-700">Precautions</Text>
              </View>
              {procedure.precautions.map((p, i) => (
                <Text key={p.id || i} className="text-sm text-amber-800 leading-5">
                  • {p.instruction}
                </Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom navigation */}
      <View
        style={{
          paddingBottom: insets.bottom + 8,
          paddingTop: 12,
          paddingHorizontal: 16,
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          backgroundColor: '#FFFFFF',
        }}
        className="flex-row items-center justify-between gap-x-4"
      >
        <Pressable
          onPress={() => setIndex((i) => i - 1)}
          disabled={index === 0}
          className="flex-1 flex-row items-center justify-center gap-x-1 py-3 active:opacity-70"
          style={{ opacity: index === 0 ? 0.4 : 1 }}
        >
          <Ionicons name="arrow-back" size={16} color="#208AEF" />
          <Text className="text-sm font-semibold text-blue-600">Previous</Text>
        </Pressable>

        <Text className="text-sm text-gray-500">
          {index + 1} / {total}
        </Text>

        <Pressable
          onPress={() => setIndex((i) => i + 1)}
          disabled={index === total - 1}
          className="flex-1 flex-row items-center justify-center gap-x-1 py-3 active:opacity-70"
          style={{ opacity: index === total - 1 ? 0.4 : 1 }}
        >
          <Text className="text-sm font-semibold text-blue-600">Next</Text>
          <Ionicons name="arrow-forward" size={16} color="#208AEF" />
        </Pressable>
      </View>
    </View>
  )
}
