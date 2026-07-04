import { useMemo, useState, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import * as DocumentPicker from 'expo-document-picker'
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useAuthStore } from '@/store/auth-store'
import { useEquipmentById, useDeleteEquipment, useUpdateEquipment } from '@/services/equipment/equipment-queries'
import { useTasks } from '@/services/tasks/tasks-queries'
import {
  useDeleteIngestedDocument,
  useIngestDocument,
  useIngestStatus,
} from '@/services/documents/documents-queries'
import {
  useGeneratePmStrategy,
  useImportPmStrategy,
  getPmJobStatus,
} from '@/services/pm-strategy/pm-strategy-queries'
import { useGenerateJobAid } from '@/services/job-aids/job-aids-queries'
import { useLocationsTree } from '@/services/locations/locations-queries'
import type { Location } from '@/services/locations/locations-types'
import { FileManagerSheet } from '@/components/ui/file-manager-sheet'
import { QRCodeModal } from '@/components/ui/qr-code-modal'
import type { UserRole } from '@/types/auth'
import type { JobAid } from '@/services/job-aids/job-aids-types'
import type { IngestJob } from '@/services/documents/documents-types'
import type { FailureMode, FailureModeStatus } from '@/services/failure-mode/failure-mode-types'
import type { Task } from '@/services/tasks/tasks-types'

const ADMIN_ROLES: UserRole[] = ['superadmin', 'owner', 'admin']

function findAncestors(locationId: string, nodes: Location[], trail: Location[] = []): Location[] {
  for (const node of nodes) {
    const current = [...trail, node]
    if (node.id === locationId) return current
    if (node.children?.length) {
      const found = findAncestors(locationId, node.children, current)
      if (found.length) return found
    }
  }
  return []
}

const PM_MAX_POLLS = 10
const PM_POLL_INTERVAL_MS = 3000

const STATUS_BADGE = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Draft' },
  published: { bg: 'bg-green-100', text: 'text-green-700', label: 'Published' },
}

const FM_STATUS_BADGE: Record<FailureModeStatus, { bg: string; text: string; label: string }> = {
  open: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Open' },
  in_progress: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'In Progress' },
  resolved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Resolved' },
}

const INGEST_BADGE: Record<IngestJob['status'], { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  pending: { icon: 'time-outline', color: '#D97706', label: 'Ingestion pending' },
  ready: { icon: 'checkmark-circle', color: '#16A34A', label: 'Ingested' },
  failed: { icon: 'close-circle', color: '#EF4444', label: 'Ingestion failed' },
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatFileNameFromUrl(url: string) {
  const last = url.split('/').pop() ?? url
  return decodeURIComponent(last)
}

function fileExtension(url: string) {
  const name = formatFileNameFromUrl(url)
  const parts = name.split('.')
  return parts.length > 1 ? parts.pop()!.toUpperCase() : 'FILE'
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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

function SectionHeader({
  title,
  count,
  onViewAll,
  rightSlot,
}: {
  title: string
  count: number
  onViewAll: () => void
  rightSlot?: ReactNode
}) {
  return (
    <View className="flex-row items-center justify-between mb-1">
      <Text className="text-sm font-bold text-gray-900">{title}</Text>
      <View className="flex-row items-center gap-x-3">
        {rightSlot}
        {count > 3 && (
          <Pressable onPress={onViewAll} className="active:opacity-60">
            <Text className="text-xs font-semibold text-blue-600">View All {count} →</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

function JobAidPreviewRow({ item }: { item: JobAid }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(app)/(job-aids)/[id]', params: { id: item.id } })}
      className="flex-row items-center gap-x-3 py-2.5 border-b border-gray-50 active:opacity-70"
    >
      <View
        className="rounded-lg overflow-hidden flex-shrink-0"
        style={{ width: 40, height: 40, backgroundColor: '#F3F4F6' }}
      >
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={{ width: 40, height: 40 }}
            contentFit="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="document-text-outline" size={18} color="#D1D5DB" />
          </View>
        )}
      </View>
      <View className="flex-1 gap-y-0.5 min-w-0">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-xs text-gray-400" numberOfLines={1}>
          {item.category ?? 'Uncategorized'} · {item.status}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </Pressable>
  )
}

function TaskPreviewRow({ item }: { item: Task }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(app)/(tasks)/[id]', params: { id: item.id } })}
      className="flex-row items-center gap-x-3 py-2.5 border-b border-gray-50 active:opacity-70"
    >
      <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center flex-shrink-0">
        <Ionicons name="checkbox-outline" size={18} color="#208AEF" />
      </View>
      <View className="flex-1 gap-y-0.5 min-w-0">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-xs text-gray-400" numberOfLines={1}>
          {item.jobAids.length} job aid{item.jobAids.length !== 1 ? 's' : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </Pressable>
  )
}

function FailureModePreviewRow({ item }: { item: FailureMode }) {
  const badge = FM_STATUS_BADGE[item.status] ?? FM_STATUS_BADGE.open
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(app)/(failure-mode)/[id]', params: { id: item.id } })}
      className="flex-row items-center gap-x-3 py-2.5 border-b border-gray-50 active:opacity-70"
    >
      <View className="flex-1 gap-y-0.5 min-w-0">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-xs text-gray-400" numberOfLines={1}>
          Due {formatDate(item.due_date)}
        </Text>
      </View>
      <View className={`px-2 py-0.5 rounded-full ${badge.bg}`}>
        <Text className={`text-xs font-medium ${badge.text}`}>{badge.label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </Pressable>
  )
}

export default function EquipmentDetailScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const user = useAuthStore((s) => s.user)
  const company = useAuthStore((s) => s.company)
  const isAdmin = ADMIN_ROLES.includes((user?.role ?? '') as UserRole)

  const [fileManagerOpen, setFileManagerOpen] = useState(false)
  const [qrModalVisible, setQrModalVisible] = useState(false)
  const [isGeneratingPm, setIsGeneratingPm] = useState(false)
  const [isImportingPm, setIsImportingPm] = useState(false)

  const { data: equipmentData, isLoading, error } = useEquipmentById(id)
  const { mutate: deleteEquipment, isPending: isDeleting } = useDeleteEquipment()
  const { mutate: updateEquipment, isPending: isUpdatingDocuments } = useUpdateEquipment()

  const equipment = equipmentData?.data
  const { data: tasksData } = useTasks(id ? { equipment_id: id } : undefined)
  const tasks = tasksData?.data ?? []

  const { data: ingestStatusData } = useIngestStatus(
    id && company?.id ? { equipment_id: id, company_id: company.id } : undefined
  )
  const ingestJobs = ingestStatusData?.jobs ?? []
  const { mutate: ingestDocument, isPending: isIngesting } = useIngestDocument()
  const { mutate: deleteIngestedDocument } = useDeleteIngestedDocument()

  const generatePmStrategyMutation = useGeneratePmStrategy()
  const importPmStrategyMutation = useImportPmStrategy()
  const generateJobAidMutation = useGenerateJobAid()
  const { data: locationsTreeData } = useLocationsTree()
  const breadcrumbs = useMemo(() => {
    if (!equipment?.location_id || !locationsTreeData?.data) return []
    return findAncestors(equipment.location_id, locationsTreeData.data)
  }, [equipment?.location_id, locationsTreeData])

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

  function handleAddDocument(url: string) {
    if (!id || !equipment) return
    updateEquipment(
      { id, data: { documents: [...(equipment.documents ?? []), url] } },
      {
        onSuccess: () => {
          if (company?.id) {
            ingestDocument({ file_url: url, equipment_id: id, company_id: company.id })
          }
        },
      }
    )
  }

  function handleDeleteDocument(url: string) {
    if (!id || !equipment) return
    Alert.alert('Delete Document', `Remove "${formatFileNameFromUrl(url)}" from this equipment?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          updateEquipment({
            id,
            data: { documents: (equipment.documents ?? []).filter((d) => d !== url) },
          })
          if (company?.id) {
            deleteIngestedDocument({ file_url: url, company_id: company.id })
          }
        },
      },
    ])
  }

  function handleReingest(url: string) {
    if (!id || !company?.id) return
    ingestDocument({ file_url: url, equipment_id: id, company_id: company.id })
  }

  async function handleGeneratePmStrategy() {
    if (!id || !company?.id) return
    setIsGeneratingPm(true)
    try {
      const { job_id } = await generatePmStrategyMutation.mutateAsync({
        equipment_id: id,
        company_id: company.id,
      })

      let downloadUrl: string | undefined
      for (let i = 0; i < PM_MAX_POLLS; i++) {
        await sleep(PM_POLL_INTERVAL_MS)
        const status = await getPmJobStatus(job_id, company.id)
        if (status.status === 'ready') {
          downloadUrl = status.download_url
          break
        }
        if (status.status === 'failed') {
          throw new Error(status.error ?? 'PM strategy generation failed')
        }
      }

      if (!downloadUrl) throw new Error('Timed out waiting for PM strategy to generate')

      const downloadedFile = await File.downloadFileAsync(downloadUrl, Paths.cache)
      await Sharing.shareAsync(downloadedFile.uri)
    } catch (e) {
      Alert.alert('Generate PM Strategy', e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setIsGeneratingPm(false)
    }
  }

  async function handleImportPmStrategy() {
    if (!id || !company?.id || !user?.id) return
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      copyToCacheDirectory: true,
    })
    if (result.canceled || !result.assets?.[0]) return
    const asset = result.assets[0]

    setIsImportingPm(true)
    try {
      const response = await importPmStrategyMutation.mutateAsync({
        file: {
          uri: asset.uri,
          name: asset.name,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        equipment_id: id,
        company_id: company.id,
        created_by: user.id,
      })
      Alert.alert(
        'Import PM Strategy',
        `${response.job_aids_created} job aid${response.job_aids_created !== 1 ? 's' : ''} created.`
      )
    } catch (e) {
      Alert.alert('Import PM Strategy', e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setIsImportingPm(false)
    }
  }

  async function handleGenerateJobAid() {
    if (!id || !company?.id || !user?.id || !equipment) return
    try {
      const result = await generateJobAidMutation.mutateAsync({
        component_type: equipment.equipmentType?.name ?? '',
        equipment_id: id,
        company_id: company.id,
        created_by: user.id,
      })
      router.push({ pathname: '/(app)/(job-aids)/[id]', params: { id: result.id } })
    } catch (e) {
      Alert.alert('Generate Job Aid', e instanceof Error ? e.message : 'Something went wrong')
    }
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
  const jobAids = equipment.jobAids ?? []
  const failureModes = equipment.failureModes ?? []
  const documents = equipment.documents ?? []

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100 px-4 pb-3 gap-y-1"
      >
        <View className="flex-row items-center gap-x-3">
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

        {breadcrumbs.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="ml-8">
            <View className="flex-row items-center gap-x-1">
              {breadcrumbs.map((crumb, i) => (
                <View key={crumb.id} className="flex-row items-center gap-x-1">
                  {i > 0 && <Ionicons name="chevron-forward" size={13} color="#9CA3AF" />}
                  <Text className="text-sm text-gray-400">{crumb.name}</Text>
                </View>
              ))}
              <Ionicons name="chevron-forward" size={13} color="#9CA3AF" />
              <Text className="text-sm font-semibold text-gray-600">{equipment.name}</Text>
            </View>
          </ScrollView>
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

        {/* AI actions */}
        {isAdmin && (
          <View className="flex-row gap-x-3">
            <Pressable
              onPress={handleGeneratePmStrategy}
              disabled={isGeneratingPm}
              className="flex-1 flex-row items-center justify-center gap-x-1.5 bg-white rounded-xl py-2.5 shadow-sm active:opacity-70"
            >
              {isGeneratingPm ? (
                <ActivityIndicator size="small" color="#208AEF" />
              ) : (
                <Ionicons name="sparkles-outline" size={16} color="#208AEF" />
              )}
              <Text className="text-xs font-semibold text-blue-600">
                {isGeneratingPm ? 'Generating...' : 'Generate PM Strategy'}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleImportPmStrategy}
              disabled={isImportingPm}
              className="flex-1 flex-row items-center justify-center gap-x-1.5 bg-white rounded-xl py-2.5 shadow-sm active:opacity-70"
            >
              {isImportingPm ? (
                <ActivityIndicator size="small" color="#208AEF" />
              ) : (
                <Ionicons name="cloud-upload-outline" size={16} color="#208AEF" />
              )}
              <Text className="text-xs font-semibold text-blue-600">
                {isImportingPm ? 'Importing...' : 'Import PM Strategy'}
              </Text>
            </Pressable>
          </View>
        )}

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
          <Pressable
            onPress={() => setQrModalVisible(true)}
            className="bg-white rounded-2xl p-4 flex-row items-center gap-x-3 active:opacity-80"
          >
            <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
              <Ionicons name="qr-code-outline" size={20} color="#208AEF" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-800">QR Code</Text>
              <Text className="text-xs text-gray-400 mt-0.5">QR code available for this equipment</Text>
            </View>
            <View className="w-2 h-2 rounded-full bg-green-400" />
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </Pressable>
        )}

        {/* Attached Job Aids */}
        {jobAids.length > 0 && (
          <View className="bg-white rounded-2xl p-4 shadow-sm gap-y-1">
            <SectionHeader
              title="Attached Job Aids"
              count={jobAids.length}
              onViewAll={() =>
                router.push({
                  pathname: '/(app)/(equipment)/job-aids-list',
                  params: { equipment_id: id, title: equipment.name },
                })
              }
              rightSlot={
                isAdmin ? (
                  <Pressable
                    onPress={handleGenerateJobAid}
                    disabled={generateJobAidMutation.isPending}
                    className="flex-row items-center gap-x-1 active:opacity-60"
                  >
                    {generateJobAidMutation.isPending ? (
                      <ActivityIndicator size="small" color="#208AEF" />
                    ) : (
                      <Ionicons name="sparkles-outline" size={14} color="#208AEF" />
                    )}
                    <Text className="text-xs font-semibold text-blue-600">
                      {generateJobAidMutation.isPending ? 'Generating...' : 'Generate'}
                    </Text>
                  </Pressable>
                ) : undefined
              }
            />
            {jobAids.slice(0, 3).map((ja) => (
              <JobAidPreviewRow key={ja.id} item={ja} />
            ))}
          </View>
        )}

        {/* Attached Tasks */}
        {tasks.length > 0 && (
          <View className="bg-white rounded-2xl p-4 shadow-sm gap-y-1">
            <SectionHeader
              title="Attached Tasks"
              count={tasks.length}
              onViewAll={() =>
                router.push({
                  pathname: '/(app)/(equipment)/tasks-list',
                  params: { equipment_id: id, title: equipment.name },
                })
              }
            />
            {tasks.slice(0, 3).map((t) => (
              <TaskPreviewRow key={t.id} item={t} />
            ))}
          </View>
        )}

        {/* Failure Mode */}
        {failureModes.length > 0 && (
          <View className="bg-white rounded-2xl p-4 shadow-sm gap-y-1">
            <SectionHeader
              title="Failure Mode"
              count={failureModes.length}
              onViewAll={() =>
                router.push({
                  pathname: '/(app)/(equipment)/failure-mode-list',
                  params: { equipment_id: id, title: equipment.name },
                })
              }
            />
            {failureModes.slice(0, 3).map((fm) => (
              <FailureModePreviewRow key={fm.id} item={fm} />
            ))}
          </View>
        )}

        {/* Documents */}
        <View className="bg-white rounded-2xl p-4 shadow-sm gap-y-3">
          <Text className="text-sm font-bold text-gray-900">Documents</Text>
          <View className="flex-row flex-wrap gap-3">
            {documents.map((url) => {
              const ingestJob = ingestJobs.find((j) => j.file_url === url)
              const ingestBadge = ingestJob ? INGEST_BADGE[ingestJob.status] : null
              const showReingest = !ingestJob || ingestJob.status === 'failed'
              return (
                <View
                  key={url}
                  className="border border-gray-100 rounded-xl p-3 items-center gap-y-2"
                  style={{ width: '47%' }}
                >
                  <View className="relative">
                    <Ionicons name="document-outline" size={28} color="#9CA3AF" />
                    {ingestBadge && (
                      <View className="absolute -top-1 -right-1 bg-white rounded-full">
                        <Ionicons name={ingestBadge.icon} size={14} color={ingestBadge.color} />
                      </View>
                    )}
                  </View>
                  <Text className="text-xs font-semibold text-gray-800 text-center" numberOfLines={1}>
                    {formatFileNameFromUrl(url)}
                  </Text>
                  <Text className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                    {fileExtension(url)}
                  </Text>
                  <View className="flex-row gap-x-2">
                    <Pressable
                      onPress={() => Linking.openURL(url)}
                      hitSlop={6}
                      className="active:opacity-60"
                    >
                      <Ionicons name="eye-outline" size={18} color="#208AEF" />
                    </Pressable>
                    {isAdmin && showReingest && (
                      <Pressable
                        onPress={() => handleReingest(url)}
                        disabled={isIngesting}
                        hitSlop={6}
                        className="active:opacity-60"
                      >
                        <Ionicons name="refresh-outline" size={18} color="#6B7280" />
                      </Pressable>
                    )}
                    {isAdmin && (
                      <Pressable
                        onPress={() => handleDeleteDocument(url)}
                        disabled={isUpdatingDocuments}
                        hitSlop={6}
                        className="active:opacity-60"
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </Pressable>
                    )}
                  </View>
                </View>
              )
            })}

            {isAdmin && (
              <Pressable
                onPress={() => setFileManagerOpen(true)}
                disabled={isUpdatingDocuments}
                className="border border-dashed border-gray-300 rounded-xl p-3 items-center justify-center gap-y-2 active:opacity-70"
                style={{ width: '47%', minHeight: 96 }}
              >
                <Ionicons name="add-circle-outline" size={28} color="#9CA3AF" />
                <Text className="text-xs font-semibold text-gray-500">Add Document</Text>
              </Pressable>
            )}
          </View>

          {documents.length === 0 && !isAdmin && (
            <Text className="text-sm text-gray-400 italic">No documents yet</Text>
          )}
        </View>
      </ScrollView>

      <FileManagerSheet
        visible={fileManagerOpen}
        onClose={() => setFileManagerOpen(false)}
        onSelect={handleAddDocument}
        folder="equipment-documents"
      />

      <QRCodeModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        equipmentId={id}
        equipmentName={equipment?.name}
      />

      {!!equipment && (
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/(app)/(equipment)/chat',
              params: {
                equipment_id: equipment.id,
                equipment_name: equipment.name,
                location_name: equipment.location?.name ?? '',
              },
            })
          }
          style={{ bottom: insets.bottom + 20 }}
          className="absolute right-5 w-14 h-14 rounded-full bg-[#208AEF] items-center justify-center shadow-lg active:opacity-80"
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
        </Pressable>
      )}

      {isDeleting && (
        <View className="absolute inset-0 bg-black/20 items-center justify-center">
          <ActivityIndicator color="#208AEF" size="large" />
        </View>
      )}
    </View>
  )
}
