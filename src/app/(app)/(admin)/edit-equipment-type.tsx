import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import {
  useCreateEquipmentTypeDefault,
  useUpdateEquipmentTypeDefault,
} from '@/services/admin/admin-queries'

type Params = {
  id?: string
  name?: string
  description?: string
  is_active?: string
}

export default function EditEquipmentTypeScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<Params>()

  const isEditing = !!params.id
  const [name, setName] = useState(params.name ?? '')
  const [description, setDescription] = useState(params.description ?? '')
  const [isActive, setIsActive] = useState(params.is_active !== 'false')

  const { mutate: create, isPending: creating, error: createError } = useCreateEquipmentTypeDefault()
  const { mutate: update, isPending: updating, error: updateError } = useUpdateEquipmentTypeDefault()

  const isPending = creating || updating
  const error = createError ?? updateError
  const errorMsg = (error as any)?.response?.data?.message ?? (error as any)?.message ?? null

  function handleSave() {
    if (!name.trim()) return
    if (isEditing && params.id) {
      update(
        {
          id: params.id,
          name: name.trim(),
          description: description.trim() || undefined,
          is_active: isActive,
        },
        { onSuccess: () => router.back() },
      )
    } else {
      create(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          is_active: isActive,
        },
        { onSuccess: () => router.back() },
      )
    }
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
        <Text className="flex-1 text-lg font-bold text-gray-900">
          {isEditing ? 'Edit Equipment Type' : 'Add Equipment Type'}
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            gap: 16,
            paddingBottom: insets.bottom + 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {errorMsg && (
            <View className="rounded-xl bg-red-50 border border-red-200 p-3">
              <Text className="text-sm text-red-600">{errorMsg}</Text>
            </View>
          )}

          <View className="bg-white rounded-2xl p-4 gap-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Hydraulic Press"
                placeholderTextColor="#9CA3AF"
                className="h-11 rounded-xl border border-gray-200 px-4 text-sm text-gray-800 bg-gray-50"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Optional description"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor="#9CA3AF"
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 bg-gray-50 min-h-[72px]"
              />
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-medium text-gray-800">Active</Text>
                <Text className="text-xs text-gray-400 mt-0.5">
                  Visible to companies when enabled
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#E5E7EB', true: '#208AEF' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={isPending || !name.trim()}
            className="h-12 rounded-xl bg-blue-600 items-center justify-center active:opacity-80"
          >
            <Text className="text-sm font-semibold text-white">
              {isPending ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Equipment Type'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
