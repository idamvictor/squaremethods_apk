import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useJobAids } from '@/services/job-aids/job-aids-queries'
import { useEquipment } from '@/services/equipment/equipment-queries'
import { useCreateTask } from '@/services/tasks/tasks-queries'
import { BottomSheetPicker } from '@/components/ui/bottom-sheet-picker'
import type { JobAid, TaskEquipment } from '@/services/tasks/tasks-types'

export default function CreateTaskScreen() {
  const insets = useSafeAreaInsets()
  const { mutate: createTask, isPending, error: apiError } = useCreateTask()

  const [title, setTitle] = useState('')
  const [selectedJobAidIds, setSelectedJobAidIds] = useState<string[]>([])
  const [selectedJobAids, setSelectedJobAids] = useState<JobAid[]>([])
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([])
  const [selectedEquipments, setSelectedEquipments] = useState<TaskEquipment[]>([])
  const [showJobAidPicker, setShowJobAidPicker] = useState(false)
  const [showEquipmentPicker, setShowEquipmentPicker] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: jobAidsData, isLoading: jobAidsLoading } = useJobAids({ page: 1, limit: 100 })
  const { data: equipmentData, isLoading: equipmentLoading } = useEquipment()

  const availableJobAidItems = (jobAidsData?.data ?? [])
    .filter((ja) => !selectedJobAidIds.includes(ja.id))
    .map((ja) => ({ label: ja.title, value: ja.id }))

  const availableEquipmentItems = (equipmentData?.data ?? [])
    .filter((e) => !selectedEquipmentIds.includes(e.id))
    .map((e) => ({ label: e.name, value: e.id }))

  function handleJobAidSelect(id: string) {
    const found = jobAidsData?.data.find((ja) => ja.id === id)
    if (!found) return
    setSelectedJobAidIds((prev) => [...prev, id])
    setSelectedJobAids((prev) => [...prev, found])
    setErrors((e) => ({ ...e, jobAids: '' }))
  }

  function removeJobAid(id: string) {
    setSelectedJobAidIds((prev) => prev.filter((v) => v !== id))
    setSelectedJobAids((prev) => prev.filter((ja) => ja.id !== id))
  }

  function handleEquipmentSelect(id: string) {
    const found = equipmentData?.data.find((e) => e.id === id)
    if (!found) return
    setSelectedEquipmentIds((prev) => [...prev, id])
    setSelectedEquipments((prev) => [...prev, { id: found.id, name: found.name, reference_code: found.reference_code ?? '' }])
  }

  function removeEquipment(id: string) {
    setSelectedEquipmentIds((prev) => prev.filter((v) => v !== id))
    setSelectedEquipments((prev) => prev.filter((e) => e.id !== id))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    if (selectedJobAidIds.length === 0) e.jobAids = 'At least one job aid is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    createTask(
      {
        title: title.trim(),
        job_aid_ids: selectedJobAidIds,
        equipment_ids: selectedEquipmentIds.length > 0 ? selectedEquipmentIds : undefined,
      },
      { onSuccess: () => router.back() },
    )
  }

  const apiErrorMsg = (apiError as any)?.response?.data?.message ?? (apiError as any)?.message ?? null

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      {/* Dark status bar fill */}
      <View style={{ height: insets.top }} className="bg-black" />

      {/* Header */}
      <View className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-x-3">
          <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">New Task</Text>
        </View>
        <Pressable
          onPress={handleSave}
          disabled={isPending}
          className="px-4 py-1.5 bg-blue-600 rounded-xl active:opacity-70"
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-sm font-semibold text-white">Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {apiErrorMsg && (
          <View className="rounded-xl bg-red-50 border border-red-200 p-3">
            <Text className="text-sm text-red-600">{apiErrorMsg}</Text>
          </View>
        )}

        {/* Title */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Title <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={title}
            onChangeText={(v) => { setTitle(v); setErrors((e) => ({ ...e, title: '' })) }}
            placeholder="Enter task title"
            className={`h-12 rounded-xl border px-4 text-sm text-gray-800 bg-white ${
              errors.title ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholderTextColor="#9CA3AF"
          />
          {!!errors.title && <Text className="text-xs text-red-500 mt-1">{errors.title}</Text>}
        </View>

        {/* Job Aids */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Job Aids <Text className="text-red-500">*</Text>
          </Text>

          {selectedJobAids.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-2">
              {selectedJobAids.map((ja) => (
                <View
                  key={ja.id}
                  className="bg-blue-100 rounded-full px-3 py-1.5 flex-row items-center gap-x-1.5"
                >
                  <Text className="text-xs font-medium text-blue-700" numberOfLines={1}>
                    {ja.title.length > 24 ? ja.title.slice(0, 24) + '…' : ja.title}
                  </Text>
                  <Pressable onPress={() => removeJobAid(ja.id)} hitSlop={4}>
                    <Ionicons name="close-circle" size={14} color="#2563EB" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {availableJobAidItems.length > 0 && (
            <Pressable
              onPress={() => setShowJobAidPicker(true)}
              className="flex-row items-center gap-x-1.5 border border-blue-300 bg-white rounded-full px-3 py-1.5 self-start active:opacity-70"
            >
              <Ionicons name="add" size={14} color="#3B82F6" />
              <Text className="text-xs font-medium text-blue-600">Add Job Aid</Text>
            </Pressable>
          )}

          {!!errors.jobAids && <Text className="text-xs text-red-500 mt-1">{errors.jobAids}</Text>}
        </View>

        {/* Equipment */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Equipment <Text className="text-gray-400 font-normal">(optional)</Text>
          </Text>

          {selectedEquipments.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-2">
              {selectedEquipments.map((eq) => (
                <View
                  key={eq.id}
                  className="bg-gray-100 rounded-full px-3 py-1.5 flex-row items-center gap-x-1.5"
                >
                  <Text className="text-xs font-medium text-gray-700" numberOfLines={1}>
                    {eq.name.length > 24 ? eq.name.slice(0, 24) + '…' : eq.name}
                  </Text>
                  <Pressable onPress={() => removeEquipment(eq.id)} hitSlop={4}>
                    <Ionicons name="close-circle" size={14} color="#6B7280" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {availableEquipmentItems.length > 0 && (
            <Pressable
              onPress={() => setShowEquipmentPicker(true)}
              className="flex-row items-center gap-x-1.5 border border-gray-300 bg-white rounded-full px-3 py-1.5 self-start active:opacity-70"
            >
              <Ionicons name="add" size={14} color="#6B7280" />
              <Text className="text-xs font-medium text-gray-600">Add Equipment</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <BottomSheetPicker
        visible={showJobAidPicker}
        onClose={() => setShowJobAidPicker(false)}
        title="Select Job Aid"
        items={availableJobAidItems}
        selected={null}
        searchable
        loading={jobAidsLoading}
        onSelect={handleJobAidSelect}
      />

      <BottomSheetPicker
        visible={showEquipmentPicker}
        onClose={() => setShowEquipmentPicker(false)}
        title="Select Equipment"
        items={availableEquipmentItems}
        selected={null}
        searchable
        loading={equipmentLoading}
        onSelect={handleEquipmentSelect}
      />
    </KeyboardAvoidingView>
  )
}
