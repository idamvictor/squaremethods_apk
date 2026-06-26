import { useEffect, useState } from 'react'
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
import { router, useLocalSearchParams } from 'expo-router'
import { useTaskById, useUpdateTask } from '@/services/tasks/tasks-queries'
import { useEquipment } from '@/services/equipment/equipment-queries'
import { BottomSheetPicker } from '@/components/ui/bottom-sheet-picker'
import type { JobAid, TaskEquipment } from '@/services/tasks/tasks-types'

export default function EditTaskScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const { data: task, isLoading: taskLoading } = useTaskById(id)
  const { mutate: updateTask, isPending, error: apiError } = useUpdateTask()
  const { data: equipmentData, isLoading: equipmentLoading } = useEquipment()

  const [title, setTitle] = useState('')
  const [existingJobAids, setExistingJobAids] = useState<JobAid[]>([])
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([])
  const [selectedEquipments, setSelectedEquipments] = useState<TaskEquipment[]>([])
  const [showEquipmentPicker, setShowEquipmentPicker] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (task && !initialized) {
      setTitle(task.title ?? '')
      setExistingJobAids(task.jobAids ?? [])
      setSelectedEquipmentIds(task.equipment_ids ?? [])
      setSelectedEquipments(task.equipments ?? [])
      setInitialized(true)
    }
  }, [task, initialized])

  const availableEquipmentItems = (equipmentData?.data ?? [])
    .filter((e) => !selectedEquipmentIds.includes(e.id))
    .map((e) => ({ label: e.name, value: e.id }))

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
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!id || !validate()) return
    updateTask(
      { taskId: id, title: title.trim(), equipment_ids: selectedEquipmentIds },
      { onSuccess: () => router.back() },
    )
  }

  const apiErrorMsg = (apiError as any)?.response?.data?.message ?? (apiError as any)?.message ?? null

  if (taskLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator color="#208AEF" />
      </View>
    )
  }

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
          <Text className="text-lg font-bold text-gray-900">Edit Task</Text>
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

        {/* Job Aids (locked) */}
        <View>
          <View className="flex-row items-center gap-x-1.5 mb-2">
            <Text className="text-sm font-medium text-gray-700">Job Aids</Text>
            <Ionicons name="lock-closed-outline" size={12} color="#9CA3AF" />
          </View>

          {existingJobAids.length > 0 ? (
            <View className="flex-row flex-wrap gap-2 mb-1">
              {existingJobAids.map((ja) => (
                <View key={ja.id} className="bg-gray-100 rounded-full px-3 py-1.5">
                  <Text className="text-xs font-medium text-gray-600" numberOfLines={1}>
                    {ja.title.length > 24 ? ja.title.slice(0, 24) + '…' : ja.title}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-gray-50 rounded-xl p-3 mb-1">
              <Text className="text-xs text-gray-400">No job aids linked</Text>
            </View>
          )}
          <Text className="text-xs text-gray-400">Job aids cannot be changed after creation</Text>
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
