import { useCallback, useEffect, useState } from 'react'
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
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useCreateProcedure, useUpdateProcedure } from '@/services/job-aids/job-aids-queries'
import { FileManagerSheet } from '@/components/ui/file-manager-sheet'
import { useAnnotationStore } from '@/store/annotation-store'

type PrecautionItem = { id?: string; instruction: string }

export default function ProcedureFormScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{
    job_aid_id: string
    id?: string
    step?: string
    title?: string
    instruction?: string
    image?: string
    precautions?: string
  }>()

  const isEdit = !!params.id
  const stepNumber = Number(params.step ?? 1)

  const [image, setImage] = useState(params.image ?? '')
  const [title, setTitle] = useState(params.title ?? '')
  const [instruction, setInstruction] = useState(params.instruction ?? '')
  const [precautions, setPrecautions] = useState<PrecautionItem[]>(() => {
    if (params.precautions) {
      try {
        return JSON.parse(params.precautions) as PrecautionItem[]
      } catch {
        return []
      }
    }
    return []
  })
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { mutate: createProcedure, isPending: isCreating, error: createError } =
    useCreateProcedure()
  const { mutate: updateProcedure, isPending: isUpdating, error: updateError } =
    useUpdateProcedure()

  const isPending = isCreating || isUpdating
  const apiError = createError ?? updateError
  const apiErrorMsg =
    (apiError as any)?.response?.data?.message ?? (apiError as any)?.message ?? null

  useFocusEffect(
    useCallback(() => {
      const pending = useAnnotationStore.getState().pendingAnnotatedImage
      if (pending) {
        setImage(pending)
        useAnnotationStore.getState().setPendingAnnotatedImage(null)
      }
    }, []),
  )

  function validate() {
    const e: Record<string, string> = {}
    if (!instruction.trim()) e.instruction = 'Instruction is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const cleanPrecautions = precautions
      .filter((p) => p.instruction.trim())
      .map((p) => ({ id: p.id, instruction: p.instruction.trim() }))

    if (isEdit) {
      updateProcedure(
        {
          id: params.id!,
          job_aid_id: params.job_aid_id,
          title: title.trim() || undefined,
          step: stepNumber,
          instruction: instruction.trim(),
          image: image || undefined,
          precautions: cleanPrecautions,
        },
        { onSuccess: () => router.back() },
      )
    } else {
      createProcedure(
        {
          job_aid_id: params.job_aid_id,
          title: title.trim(),
          step: stepNumber,
          instruction: instruction.trim(),
          image: image || undefined,
          precautions: cleanPrecautions,
        },
        { onSuccess: () => router.back() },
      )
    }
  }

  function addPrecaution() {
    setPrecautions((prev) => [...prev, { instruction: '' }])
  }

  function updatePrecautionText(index: number, text: string) {
    setPrecautions((prev) => prev.map((p, i) => (i === index ? { ...p, instruction: text } : p)))
  }

  function removePrecaution(index: number) {
    setPrecautions((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-x-3">
          <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">
            {isEdit ? 'Edit Step' : `Add Step ${stepNumber}`}
          </Text>
        </View>
        <Pressable
          onPress={handleSave}
          disabled={isPending}
          className="px-4 py-1.5 bg-blue-600 rounded-xl active:opacity-70"
        >
          {isPending ? (
            <ActivityIndicator color="#fff" size="small" />
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

        {/* Step Image */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Step Image</Text>
          <Pressable
            onPress={() => setShowImagePicker(true)}
            className="rounded-xl overflow-hidden border border-dashed border-gray-300 bg-white active:opacity-70"
            style={{ aspectRatio: 16 / 9 }}
          >
            {image ? (
              <>
                <Image
                  source={{ uri: image }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
                <View className="absolute top-2 right-2 bg-black/50 rounded-lg px-2 py-1">
                  <Text className="text-xs text-white font-medium">Change</Text>
                </View>
              </>
            ) : (
              <View className="flex-1 items-center justify-center gap-y-2">
                <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                <Text className="text-sm text-gray-400">Tap to add step image (optional)</Text>
              </View>
            )}
          </Pressable>
          {image ? (
            <View className="flex-row items-center gap-x-4 mt-1">
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(app)/(job-aids)/annotate',
                    params: { imageUrl: image },
                  })
                }
                className="flex-row items-center gap-x-1 active:opacity-60"
              >
                <Ionicons name="pencil-outline" size={13} color="#3B82F6" />
                <Text className="text-xs text-blue-500 font-medium">Annotate</Text>
              </Pressable>
              <Pressable onPress={() => setImage('')} className="active:opacity-60">
                <Text className="text-xs text-red-500">Remove image</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Step Title */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Step Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Step title (optional)"
            className="h-12 rounded-xl border border-gray-200 px-4 text-sm text-gray-800 bg-white"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Instruction */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Instruction <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={instruction}
            onChangeText={(v) => {
              setInstruction(v)
              setErrors((e) => ({ ...e, instruction: '' }))
            }}
            placeholder="Describe what to do in this step…"
            multiline
            numberOfLines={4}
            className={`rounded-xl border px-4 py-3 text-sm text-gray-800 bg-white min-h-[100px] ${errors.instruction ? 'border-red-400' : 'border-gray-200'}`}
            placeholderTextColor="#9CA3AF"
            textAlignVertical="top"
          />
          {errors.instruction && (
            <Text className="text-xs text-red-500 mt-1">{errors.instruction}</Text>
          )}
        </View>

        {/* Precautions */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">Precautions</Text>
          {precautions.length === 0 ? (
            <Text className="text-sm text-gray-400 italic mb-2">No precautions added</Text>
          ) : (
            <View className="gap-y-2 mb-2">
              {precautions.map((p, i) => (
                <View
                  key={i}
                  className="flex-row items-center gap-x-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2"
                >
                  <Ionicons name="warning-outline" size={14} color="#B45309" />
                  <TextInput
                    value={p.instruction}
                    onChangeText={(v) => updatePrecautionText(i, v)}
                    placeholder="Describe this precaution…"
                    className="flex-1 text-sm text-amber-900"
                    placeholderTextColor="#B45309"
                    multiline
                  />
                  <Pressable
                    onPress={() => removePrecaution(i)}
                    hitSlop={8}
                    className="active:opacity-60"
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          <Pressable
            onPress={addPrecaution}
            className="flex-row items-center gap-x-1.5 active:opacity-60"
          >
            <Ionicons name="add-circle-outline" size={18} color="#208AEF" />
            <Text className="text-sm font-semibold text-blue-600">Add Precaution</Text>
          </Pressable>
        </View>
      </ScrollView>

      <FileManagerSheet
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={(url) => {
          setImage(url)
          setShowImagePicker(false)
        }}
      />
    </KeyboardAvoidingView>
  )
}
