import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import {
  useDeleteJobAid,
  useDeleteProcedure,
  useJobAidById,
  usePublishJobAid,
  useUnpublishJobAid,
} from '@/services/job-aids/job-aids-queries'
import type { Procedure } from '@/services/job-aids/job-aids-types'
import { useAuthStore } from '@/store/auth-store'

const ADMIN_ROLES = ['superadmin', 'owner', 'admin']

function StatusBadge({ status }: { status: 'draft' | 'published' }) {
  const isPublished = status === 'published'
  return (
    <View
      className={`flex-row items-center gap-x-1.5 px-3 py-1 rounded-full ${
        isPublished ? 'bg-green-100' : 'bg-amber-100'
      }`}
    >
      <View className={`w-2 h-2 rounded-full ${isPublished ? 'bg-green-500' : 'bg-amber-400'}`} />
      <Text className={`text-xs font-semibold ${isPublished ? 'text-green-700' : 'text-amber-700'}`}>
        {isPublished ? 'Published' : 'Draft'}
      </Text>
    </View>
  )
}

export default function JobAidDetailScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const isAdmin = ADMIN_ROLES.includes(user?.role ?? '')

  const [expanded, setExpanded] = useState(false)

  const { data, isLoading, error } = useJobAidById(id)
  const { mutate: deleteJobAid, isPending: isDeleting } = useDeleteJobAid()
  const { mutate: publishJobAid } = usePublishJobAid()
  const { mutate: unpublishJobAid } = useUnpublishJobAid()
  const { mutate: deleteProcedure } = useDeleteProcedure()

  const jobAid = data?.data

  function handleKebab() {
    if (!jobAid) return
    const publishLabel = jobAid.status === 'draft' ? 'Publish' : 'Unpublish'
    Alert.alert(jobAid.title, undefined, [
      {
        text: 'Edit',
        onPress: () =>
          router.push({ pathname: '/(app)/(job-aids)/edit', params: { id: jobAid.id } }),
      },
      {
        text: publishLabel,
        onPress: () => {
          if (jobAid.status === 'draft') {
            publishJobAid(jobAid.id)
          } else {
            unpublishJobAid(jobAid.id)
          }
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            'Delete Job Aid',
            `Delete "${jobAid.title}"? This cannot be undone.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () =>
                  deleteJobAid(jobAid.id, { onSuccess: () => router.back() }),
              },
            ],
          ),
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  function handleShare() {
    if (!jobAid) return
    Clipboard.setString(`/job-aids/${jobAid.slug}`)
    Alert.alert('Link copied', 'The job aid link has been copied to clipboard.')
  }

  function handleProcedureMenu(procedure: Procedure) {
    Alert.alert(`Step ${procedure.step}`, undefined, [
      {
        text: 'Edit Step',
        onPress: () =>
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
              onPress: () => deleteProcedure({ id: procedure.id, job_aid_id: id }),
            },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator color="#208AEF" />
      </View>
    )
  }

  if (error || !jobAid) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-8 gap-y-3">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-sm text-gray-500 text-center">
          Could not load this job aid. Pull to refresh or go back.
        </Text>
        <Pressable onPress={() => router.back()} className="active:opacity-60">
          <Text className="text-sm font-semibold text-blue-600">Go back</Text>
        </Pressable>
      </View>
    )
  }

  const sortedProcedures = [...(jobAid.procedures ?? [])].sort((a, b) => a.step - b.step)
  const previewSteps = sortedProcedures.slice(0, 3)
  const instructionLong = (jobAid.instruction ?? '').length > 200
  const displayInstruction =
    !expanded && instructionLong
      ? `${jobAid.instruction.slice(0, 200)}…`
      : jobAid.instruction

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
          Job Aid
        </Text>
        <Pressable onPress={handleShare} hitSlop={8} className="active:opacity-60">
          <Ionicons name="share-social-outline" size={22} color="#4B5563" />
        </Pressable>
        {isAdmin && (
          <Pressable onPress={handleKebab} hitSlop={8} className="active:opacity-60">
            <Ionicons name="ellipsis-horizontal" size={22} color="#4B5563" />
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 32 }}
      >
        {/* Hero image */}
        <View
          className="w-full bg-gray-200 rounded-2xl overflow-hidden"
          style={{ aspectRatio: 16 / 9 }}
        >
          {jobAid.image ? (
            <Image
              source={{ uri: jobAid.image }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
            </View>
          )}
        </View>

        {/* Title + badges */}
        <View className="gap-y-2">
          <Text className="text-xl font-bold text-gray-900">{jobAid.title}</Text>
          <View className="flex-row flex-wrap gap-2">
            {jobAid.category && (
              <View className="bg-blue-100 px-3 py-1 rounded-full">
                <Text className="text-xs font-semibold text-blue-700">{jobAid.category}</Text>
              </View>
            )}
            <StatusBadge status={jobAid.status} />
          </View>
        </View>

        {/* Meta row */}
        <View className="flex-row flex-wrap gap-x-4 gap-y-1">
          {jobAid.creator && (
            <Text className="text-xs text-gray-500">
              By {jobAid.creator.first_name} {jobAid.creator.last_name}
            </Text>
          )}
          {jobAid.estimated_duration != null && (
            <View className="flex-row items-center gap-x-1">
              <Ionicons name="time-outline" size={12} color="#9CA3AF" />
              <Text className="text-xs text-gray-500">{jobAid.estimated_duration} min</Text>
            </View>
          )}
        </View>

        {/* Instructions */}
        <View className="bg-white rounded-2xl p-4 shadow-sm gap-y-2">
          <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Instructions
          </Text>
          <Text className="text-sm text-gray-700 leading-5">{displayInstruction}</Text>
          {instructionLong && (
            <Pressable onPress={() => setExpanded((v) => !v)}>
              <Text className="text-xs font-semibold text-blue-600">
                {expanded ? 'Show less' : 'Read more'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Procedures preview */}
        <View className="bg-white rounded-2xl p-4 shadow-sm gap-y-1">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-bold text-gray-900">Step-by-Step Procedures</Text>
            {isAdmin && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(app)/(job-aids)/procedure-form',
                    params: {
                      job_aid_id: jobAid.id,
                      step: String(sortedProcedures.length + 1),
                    },
                  })
                }
                className="bg-blue-600 px-3 py-1 rounded-full active:opacity-70"
              >
                <Text className="text-xs font-semibold text-white">+ Add Step</Text>
              </Pressable>
            )}
          </View>

          {sortedProcedures.length === 0 ? (
            <Text className="text-sm text-gray-400 italic">No steps yet</Text>
          ) : (
            <>
              {previewSteps.map((procedure, index) => (
                <Pressable
                  key={procedure.id}
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/(job-aids)/step-view',
                      params: { id: jobAid.id, step_index: String(index) },
                    })
                  }
                  className="flex-row items-center gap-x-3 py-2.5 border-b border-gray-50 active:opacity-70"
                >
                  <View className="w-6 h-6 rounded-full bg-gray-700 items-center justify-center flex-shrink-0">
                    <Text className="text-xs font-bold text-white">{procedure.step}</Text>
                  </View>
                  <View className="flex-1 gap-y-0.5 min-w-0">
                    <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                      {procedure.title || `Step ${procedure.step}`}
                    </Text>
                    <Text className="text-xs text-gray-500" numberOfLines={1}>
                      {procedure.instruction}
                    </Text>
                  </View>
                  {isAdmin && (
                    <Pressable
                      onPress={() => handleProcedureMenu(procedure)}
                      hitSlop={8}
                      className="active:opacity-60 px-1"
                    >
                      <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
                    </Pressable>
                  )}
                  <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                </Pressable>
              ))}

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(app)/(job-aids)/steps',
                    params: { id: jobAid.id, title: jobAid.title },
                  })
                }
                className="py-3 items-center active:opacity-70"
              >
                <Text className="text-sm font-semibold text-blue-600">
                  View All {sortedProcedures.length} Steps →
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Assigned Equipment */}
        {jobAid.assignedEquipments.length > 0 && (
          <View className="bg-white rounded-2xl p-4 shadow-sm gap-y-3">
            <Text className="text-sm font-bold text-gray-900">Assigned Equipment</Text>
            {jobAid.assignedEquipments.map((eq) => (
              <Pressable
                key={eq.id}
                onPress={() =>
                  router.push({ pathname: '/(app)/(equipment)/[id]', params: { id: eq.id } })
                }
                className="flex-row items-center gap-x-3 py-2 border-b border-gray-50 active:opacity-70"
              >
                <View className="w-9 h-9 bg-blue-50 rounded-xl items-center justify-center">
                  <Ionicons name="cube-outline" size={18} color="#208AEF" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-900">{eq.name}</Text>
                  <Text className="text-xs text-gray-400">{eq.reference_code}</Text>
                </View>
                <View
                  className={`px-2 py-0.5 rounded-full ${
                    eq.status === 'published' ? 'bg-green-100' : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      eq.status === 'published' ? 'text-green-700' : 'text-gray-500'
                    }`}
                  >
                    {eq.status}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {isDeleting && (
        <View className="absolute inset-0 bg-black/20 items-center justify-center">
          <ActivityIndicator color="#208AEF" size="large" />
        </View>
      )}
    </View>
  )
}
