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
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { File, Paths } from 'expo-file-system'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import {
  useDeleteJobAid,
  useDeleteProcedure,
  useJobAidById,
} from '@/services/job-aids/job-aids-queries'
import type { JobAid, JobAidStatus, Procedure } from '@/services/job-aids/job-aids-types'
import { useAuthStore } from '@/store/auth-store'
import { usePermissions } from '@/lib/permissions'
import { useJobAidApprovalActions } from '@/hooks/use-job-aid-approval-actions'

function goBackToList() {
  if (router.canGoBack()) {
    router.back()
  } else {
    router.replace('/(app)/(job-aids)')
  }
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function buildJobAidHtml(jobAid: JobAid) {
  const sortedProcedures = [...(jobAid.procedures ?? [])].sort((a, b) => a.step - b.step)
  const proceduresHtml = sortedProcedures
    .map(
      (p) => `
        <div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #E5E7EB;">
          <h3 style="margin:0 0 6px;font-size:15px;">Step ${p.step}: ${p.title || ''}</h3>
          <p style="margin:0 0 8px;font-size:13px;color:#374151;">${p.instruction ?? ''}</p>
          ${p.image ? `<img src="${p.image}" style="max-width:100%;border-radius:8px;margin-bottom:8px;" />` : ''}
          ${
            p.precautions?.length
              ? `<ul style="margin:0;padding-left:18px;font-size:12px;color:#B45309;">${p.precautions
                  .map((pr) => `<li>${pr.instruction}</li>`)
                  .join('')}</ul>`
              : ''
          }
        </div>`
    )
    .join('')

  const authorName = jobAid.creator
    ? `${jobAid.creator.first_name} ${jobAid.creator.last_name}`
    : null
  const equipmentNames = (jobAid.assignedEquipments ?? []).map((e) => e.name)

  return `
    <html>
      <body style="font-family:-apple-system,Helvetica,Arial,sans-serif;padding:24px;">
        ${jobAid.image ? `<img src="${jobAid.image}" style="width:100%;max-height:240px;object-fit:cover;border-radius:12px;margin-bottom:16px;" />` : ''}
        <h1 style="font-size:22px;margin:0 0 4px;">${jobAid.title}</h1>
        <p style="font-size:12px;color:#6B7280;margin:0 0 8px;">
          ${jobAid.category ?? ''}${jobAid.estimated_duration != null ? ` · ${jobAid.estimated_duration} min` : ''}
        </p>
        <p style="font-size:12px;color:#6B7280;margin:0 0 4px;">
          ${authorName ? `Author: ${authorName}` : ''}${authorName ? ' · ' : ''}Status: ${STATUS_STYLE[jobAid.status].label} · Created: ${formatDate(jobAid.createdAt)}
        </p>
        ${
          equipmentNames.length
            ? `<p style="font-size:12px;color:#6B7280;margin:0 0 16px;">Assigned Equipment: ${equipmentNames.join(', ')}</p>`
            : '<div style="margin-bottom:16px;"></div>'
        }
        <p style="font-size:14px;color:#374151;margin:0 0 24px;">${jobAid.instruction ?? ''}</p>
        <h2 style="font-size:16px;margin:0 0 12px;">Step-by-Step Procedures</h2>
        ${proceduresHtml}
      </body>
    </html>
  `
}

const STATUS_STYLE: Record<JobAidStatus, { bg: string; dot: string; text: string; label: string }> = {
  draft: { bg: 'bg-amber-100', dot: 'bg-amber-400', text: 'text-amber-700', label: 'Draft' },
  pending_approval: { bg: 'bg-blue-100', dot: 'bg-blue-500', text: 'text-blue-700', label: 'Pending Approval' },
  published: { bg: 'bg-green-100', dot: 'bg-green-500', text: 'text-green-700', label: 'Published' },
}

function StatusBadge({ status }: { status: JobAidStatus }) {
  const style = STATUS_STYLE[status]
  return (
    <View className={`flex-row items-center gap-x-1.5 px-3 py-1 rounded-full ${style.bg}`}>
      <View className={`w-2 h-2 rounded-full ${style.dot}`} />
      <Text className={`text-xs font-semibold ${style.text}`}>{style.label}</Text>
    </View>
  )
}

function ApprovalActionsBar({ jobAid }: { jobAid: JobAid }) {
  const {
    canSubmitForApproval,
    canApprove,
    isPendingOwnApproval,
    canUnpublish,
    submitForApproval,
    approve,
    unpublish,
    isSubmitting,
    isApproving,
    isUnpublishing,
  } = useJobAidApprovalActions(jobAid)

  function handleApprove() {
    Alert.alert(
      'Approve this job aid?',
      `This publishes the job aid and notifies ${jobAid.creator?.first_name ?? 'the creator'}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: () => approve() },
      ],
    )
  }

  function handleUnpublish() {
    Alert.alert(
      'Revert to draft?',
      'It will no longer be visible to technicians and will need to go through approval again before it can be published.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unpublish', style: 'destructive', onPress: () => unpublish() },
      ],
    )
  }

  if (!canSubmitForApproval && !canApprove && !isPendingOwnApproval && !canUnpublish) {
    return null
  }

  return (
    <View className="flex-row items-center flex-wrap gap-2">
      {canSubmitForApproval && (
        <Pressable
          onPress={() => submitForApproval()}
          disabled={isSubmitting}
          className="flex-row items-center gap-x-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-full active:opacity-70"
        >
          <Ionicons name="send-outline" size={14} color="#4B5563" />
          <Text className="text-xs font-semibold text-gray-700">
            {isSubmitting ? 'Submitting…' : 'Submit for Approval'}
          </Text>
        </Pressable>
      )}
      {canApprove && (
        <Pressable
          onPress={handleApprove}
          disabled={isApproving}
          className="flex-row items-center gap-x-1.5 bg-blue-600 px-3 py-1.5 rounded-full active:opacity-70"
        >
          <Ionicons name="checkmark-circle-outline" size={14} color="#FFFFFF" />
          <Text className="text-xs font-semibold text-white">
            {isApproving ? 'Approving…' : 'Approve'}
          </Text>
        </Pressable>
      )}
      {isPendingOwnApproval && (
        <Text className="text-xs text-gray-400 italic">Awaiting approval from another admin</Text>
      )}
      {canUnpublish && (
        <Pressable
          onPress={handleUnpublish}
          disabled={isUnpublishing}
          className="flex-row items-center gap-x-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-full active:opacity-70"
        >
          <Ionicons name="arrow-undo-outline" size={14} color="#4B5563" />
          <Text className="text-xs font-semibold text-gray-700">
            {isUnpublishing ? 'Unpublishing…' : 'Unpublish'}
          </Text>
        </Pressable>
      )}
    </View>
  )
}

export default function JobAidDetailScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const { isTechnician } = usePermissions()
  const isAdmin = !isTechnician

  const [expanded, setExpanded] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading, error } = useJobAidById(id)
  const { mutate: deleteJobAid, isPending: isDeleting } = useDeleteJobAid()
  const { mutate: deleteProcedure } = useDeleteProcedure()

  const jobAid = data?.data

  function handleKebab() {
    if (!jobAid) return
    Alert.alert(jobAid.title, undefined, [
      {
        text: 'Edit',
        onPress: () =>
          router.push({ pathname: '/(app)/(job-aids)/edit', params: { id: jobAid.id } }),
      },
      {
        text: 'Version History',
        onPress: () =>
          router.push({ pathname: '/(app)/(job-aids)/version-history', params: { id: jobAid.id } }),
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
                  deleteJobAid(jobAid.id, { onSuccess: () => goBackToList() }),
              },
            ],
          ),
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  function handleShare() {
    if (!jobAid) return
    const webBaseUrl = process.env.EXPO_PUBLIC_WEB_BASE_URL
    const path = `/job-aids/${jobAid.id}`
    Clipboard.setString(webBaseUrl ? `${webBaseUrl}${path}` : path)
    Alert.alert('Link copied', 'The job aid link has been copied to clipboard.')
  }

  async function handleExportPdf() {
    if (!jobAid) return
    setIsExporting(true)
    try {
      const html = buildJobAidHtml(jobAid)
      const { base64 } = await Print.printToFileAsync({ html, base64: true })
      if (!base64) throw new Error('Failed to generate PDF')
      const shareableFile = new File(Paths.cache, `${jobAid.id}.pdf`)
      shareableFile.create({ overwrite: true })
      shareableFile.write(base64, { encoding: 'base64' })
      await Sharing.shareAsync(shareableFile.uri)
    } catch (e) {
      Alert.alert('Export PDF', e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setIsExporting(false)
    }
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
        <Pressable onPress={goBackToList} className="active:opacity-60">
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
        <Pressable onPress={goBackToList} hitSlop={8} className="active:opacity-60">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text className="flex-1 text-base font-bold text-gray-900" numberOfLines={1}>
          Job Aid
        </Text>
        <Pressable
          onPress={handleExportPdf}
          disabled={isExporting}
          hitSlop={8}
          className="active:opacity-60"
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#4B5563" />
          ) : (
            <Ionicons name="download-outline" size={22} color="#4B5563" />
          )}
        </Pressable>
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
            <View className="bg-blue-100 px-3 py-1 rounded-full">
              <Text className="text-xs font-semibold text-blue-700 capitalize">
                {jobAid.category || 'General'}
              </Text>
            </View>
            <StatusBadge status={jobAid.status} />
          </View>
          {isAdmin && <ApprovalActionsBar jobAid={jobAid} />}
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
          <Text className="text-xs text-gray-500">Updated {formatDate(jobAid.updatedAt)}</Text>
          {jobAid.approver && (
            <Text className="text-xs text-gray-500">
              Approved by {jobAid.approver.first_name} {jobAid.approver.last_name}
            </Text>
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
                  {procedure.precautions.length > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 6 }}>
                      <Ionicons name="warning-outline" size={11} color="#B45309" />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#B45309' }}>{procedure.precautions.length}</Text>
                    </View>
                  )}
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
