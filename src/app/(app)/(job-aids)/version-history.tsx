import { useState } from 'react'
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import {
  useJobAidVersions,
  useRestoreJobAidVersion,
} from '@/services/job-aids/job-aids-queries'
import type { JobAidVersion } from '@/services/job-aids/job-aids-types'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function VersionCard({ version, onPress }: { version: JobAidVersion; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl p-4 flex-row items-center gap-x-3 active:opacity-80"
    >
      <View className="w-9 h-9 rounded-full bg-blue-50 items-center justify-center">
        <Text className="text-xs font-bold text-blue-700">v{version.version_number}</Text>
      </View>
      <View className="flex-1 gap-y-0.5">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
          {version.snapshot.title}
        </Text>
        <Text className="text-xs text-gray-400">{formatDate(version.created_at)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </Pressable>
  )
}

export default function VersionHistoryScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data, isLoading } = useJobAidVersions(id)
  const { mutate: restoreVersion, isPending: isRestoring } = useRestoreJobAidVersion(id)

  const [previewVersion, setPreviewVersion] = useState<JobAidVersion | null>(null)

  const versions = [...(data?.data ?? [])].sort((a, b) => b.version_number - a.version_number)

  function handleRestore() {
    if (!previewVersion) return
    Alert.alert(
      `Restore version ${previewVersion.version_number}?`,
      'The job aid will revert to this version. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: () =>
            restoreVersion(previewVersion.id, {
              onSuccess: () => {
                setPreviewVersion(null)
                router.back()
              },
            }),
        },
      ],
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center gap-x-3"
      >
        <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Version History</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#208AEF" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 24 }}>
          {versions.length === 0 ? (
            <View className="items-center py-24 gap-y-3">
              <Ionicons name="time-outline" size={40} color="#D1D5DB" />
              <Text className="text-sm text-gray-400">No previous versions yet</Text>
            </View>
          ) : (
            versions.map((v) => (
              <VersionCard key={v.id} version={v} onPress={() => setPreviewVersion(v)} />
            ))
          )}
        </ScrollView>
      )}

      <Modal
        visible={!!previewVersion}
        animationType="slide"
        transparent
        onRequestClose={() => setPreviewVersion(null)}
      >
        <View className="flex-1 justify-end bg-black/30">
          <View
            className="bg-white rounded-t-3xl max-h-[85%]"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
              <Text className="text-base font-bold text-gray-900">
                Version {previewVersion?.version_number}
              </Text>
              <Pressable onPress={() => setPreviewVersion(null)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </Pressable>
            </View>

            {previewVersion && (
              <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
                <Text className="text-xs text-gray-400">
                  Saved {formatDate(previewVersion.created_at)}
                </Text>
                <Text className="text-lg font-bold text-gray-900">
                  {previewVersion.snapshot.title}
                </Text>
                {previewVersion.snapshot.category && (
                  <Text className="text-xs text-gray-500">{previewVersion.snapshot.category}</Text>
                )}
                <Text className="text-sm text-gray-700 leading-5">
                  {previewVersion.snapshot.instruction}
                </Text>

                {previewVersion.snapshot.procedures.length > 0 && (
                  <View className="gap-y-2 mt-2">
                    <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Steps ({previewVersion.snapshot.procedures.length})
                    </Text>
                    {previewVersion.snapshot.procedures
                      .sort((a, b) => a.step - b.step)
                      .map((p, i) => (
                        <View key={i} className="flex-row gap-x-3 py-1.5">
                          <View className="w-5 h-5 rounded-full bg-gray-700 items-center justify-center mt-0.5">
                            <Text className="text-[10px] font-bold text-white">{p.step}</Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-sm font-medium text-gray-900">{p.title}</Text>
                            <Text className="text-xs text-gray-500">{p.instruction}</Text>
                          </View>
                        </View>
                      ))}
                  </View>
                )}
              </ScrollView>
            )}

            <View className="px-5 pt-4">
              <Pressable
                onPress={handleRestore}
                disabled={isRestoring}
                className="h-12 bg-blue-600 rounded-xl items-center justify-center active:opacity-70"
              >
                {isRestoring ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-sm font-semibold text-white">Restore this version</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}
