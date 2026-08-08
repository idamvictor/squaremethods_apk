import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useAuthStore } from '@/store/auth-store'
import { useEquipmentById, useUpdateEquipment } from '@/services/equipment/equipment-queries'
import { useEquipmentTypes } from '@/services/equipment-types/equipment-types-queries'
import { useDeleteIngestedDocument, useIngestDocument } from '@/services/documents/documents-queries'
import { FileManagerSheet } from '@/components/ui/file-manager-sheet'
import { BottomSheetPicker } from '@/components/ui/bottom-sheet-picker'
import type { EquipmentStatus } from '@/services/equipment/equipment-types'

function formatFileNameFromUrl(url: string) {
  const last = url.split('/').pop() ?? url
  return decodeURIComponent(last)
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text className="text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <Text className="text-red-500"> *</Text>}
    </Text>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <Text className="text-xs text-red-500 mt-1">{message}</Text>
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <FieldLabel label={label} />
      <View className="h-12 rounded-xl border border-gray-100 px-4 bg-gray-50 justify-center">
        <Text className="text-sm text-gray-400" numberOfLines={1}>
          {value || '—'}
        </Text>
      </View>
    </View>
  )
}

export default function EditEquipmentScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const company = useAuthStore((s) => s.company)
  const { data: equipmentData, isLoading } = useEquipmentById(id)
  const { mutate: updateEquipment, isPending, error: apiError } = useUpdateEquipment()
  const { mutate: ingestDocument } = useIngestDocument()
  const { mutate: deleteIngestedDocument } = useDeleteIngestedDocument()

  const [name, setName] = useState('')
  const [status, setStatus] = useState<EquipmentStatus>('draft')
  const [notes, setNotes] = useState('')
  const [image, setImage] = useState('')
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [typeId, setTypeId] = useState('')
  const [typeName, setTypeName] = useState('')
  const [showTypePicker, setShowTypePicker] = useState(false)
  const [documents, setDocuments] = useState<string[]>([])
  const [showDocumentPicker, setShowDocumentPicker] = useState(false)
  const [addedDocuments, setAddedDocuments] = useState<string[]>([])
  const [removedDocuments, setRemovedDocuments] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const initialized = useRef(false)

  const { data: typesData, isLoading: typesLoading } = useEquipmentTypes()
  const typeItems = (typesData?.data ?? []).map((t) => ({ label: t.name, value: t.id, icon: t.icon }))

  useEffect(() => {
    if (equipmentData?.data && !initialized.current) {
      initialized.current = true
      setName(equipmentData.data.name)
      setStatus(equipmentData.data.status)
      setNotes(equipmentData.data.notes ?? '')
      setImage(equipmentData.data.image ?? '')
      setTypeId(equipmentData.data.equipmentType?.id ?? '')
      setTypeName(equipmentData.data.equipmentType?.name ?? '')
      setDocuments(equipmentData.data.documents ?? [])
    }
  }, [equipmentData])

  function handleAddDocument(url: string) {
    setDocuments((prev) => (prev.includes(url) ? prev : [...prev, url]))
    setAddedDocuments((prev) => (prev.includes(url) ? prev : [...prev, url]))
    setRemovedDocuments((prev) => prev.filter((d) => d !== url))
    setShowDocumentPicker(false)
  }

  function handleRemoveDocument(url: string) {
    setDocuments((prev) => prev.filter((d) => d !== url))
    setAddedDocuments((prev) => prev.filter((d) => d !== url))
    if ((equipment?.documents ?? []).includes(url)) {
      setRemovedDocuments((prev) => (prev.includes(url) ? prev : [...prev, url]))
    }
  }

  const equipment = equipmentData?.data
  const apiErrorMsg =
    (apiError as any)?.response?.data?.message ?? (apiError as any)?.message ?? null

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!id || !validate()) return
    updateEquipment(
      {
        id,
        data: {
          name: name.trim(),
          equipment_type_id: typeId || undefined,
          status,
          notes: notes.trim(),
          image: image || undefined,
          documents,
        },
      },
      {
        onSuccess: () => {
          if (company?.id) {
            addedDocuments.forEach((file_url) =>
              ingestDocument({ file_url, equipment_id: id, company_id: company.id }),
            )
            removedDocuments.forEach((file_url) =>
              deleteIngestedDocument({ file_url, company_id: company.id }),
            )
          }
          router.back()
        },
      },
    )
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

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-x-3">
          <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">Edit Equipment</Text>
        </View>
        <Pressable
          onPress={handleSave}
          disabled={isPending}
          className="px-4 py-1.5 bg-blue-600 rounded-xl active:opacity-70"
        >
          <Text className="text-sm font-semibold text-white">{isPending ? 'Saving…' : 'Save'}</Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {apiErrorMsg && (
          <View className="rounded-xl bg-red-50 border border-red-200 p-3">
            <Text className="text-sm text-red-600">{apiErrorMsg}</Text>
          </View>
        )}

        {/* Image */}
        <View>
          <FieldLabel label="Image" />
          <Pressable
            onPress={() => setShowImagePicker(true)}
            className="rounded-xl overflow-hidden border border-dashed border-gray-300 bg-white active:opacity-70"
            style={{ aspectRatio: 16 / 9 }}
          >
            {image ? (
              <>
                <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                <View className="absolute top-2 right-2 bg-black/50 rounded-lg px-2 py-1">
                  <Text className="text-xs text-white font-medium">Change</Text>
                </View>
              </>
            ) : (
              <View className="flex-1 items-center justify-center gap-y-2">
                <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
                <Text className="text-sm text-gray-400">Tap to add equipment image</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Documents */}
        <View>
          <View className="flex-row items-center justify-between mb-1">
            <FieldLabel label="Documents" />
            <Pressable onPress={() => setShowDocumentPicker(true)} className="active:opacity-60">
              <Text className="text-xs font-semibold text-blue-600">+ Add Document</Text>
            </Pressable>
          </View>
          {documents.length > 0 && (
            <View className="gap-y-2">
              {documents.map((url) => (
                <View
                  key={url}
                  className="flex-row items-center justify-between bg-white rounded-xl border border-gray-100 px-3 py-2.5"
                >
                  <Text className="flex-1 text-sm text-gray-700 mr-2" numberOfLines={1}>
                    {formatFileNameFromUrl(url)}
                  </Text>
                  <Pressable
                    onPress={() => handleRemoveDocument(url)}
                    hitSlop={8}
                    className="active:opacity-60"
                  >
                    <Text className="text-xs font-semibold text-red-500">Remove</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Editable: Equipment Type */}
        <View>
          <FieldLabel label="Equipment Type" />
          <Pressable
            onPress={() => setShowTypePicker(true)}
            className="h-12 rounded-xl border border-gray-200 bg-white px-4 flex-row items-center justify-between"
          >
            <Text className={`text-sm ${typeName ? 'text-gray-800' : 'text-gray-400'}`} numberOfLines={1}>
              {typeName || 'Select equipment type'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
          </Pressable>
        </View>

        {/* Read-only fields */}
        <ReadOnlyField label="Reference Code" value={equipment?.reference_code ?? ''} />
        <ReadOnlyField label="Location" value={equipment?.location?.name ?? ''} />

        {/* Editable: Name */}
        <View>
          <FieldLabel label="Name" required />
          <TextInput
            value={name}
            onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: '' })) }}
            placeholder="Equipment name"
            className={`h-12 rounded-xl border px-4 text-sm text-gray-800 bg-white ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
            placeholderTextColor="#9CA3AF"
          />
          <FieldError message={errors.name} />
        </View>

        {/* Editable: Status */}
        <View>
          <FieldLabel label="Status" />
          <View className="flex-row gap-x-2">
            {(['draft', 'published'] as EquipmentStatus[]).map((s) => (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                className={`flex-1 h-10 rounded-xl border items-center justify-center ${
                  status === s ? 'bg-blue-600 border-blue-600' : 'border-gray-200 bg-white'
                }`}
              >
                <Text
                  className={`text-xs font-semibold capitalize ${status === s ? 'text-white' : 'text-gray-600'}`}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Editable: Notes */}
        <View>
          <FieldLabel label="Notes" />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes (optional)"
            multiline
            numberOfLines={4}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 bg-white min-h-[80px]"
            placeholderTextColor="#9CA3AF"
            textAlignVertical="top"
          />
        </View>
      </KeyboardAwareScrollView>

      <BottomSheetPicker
        visible={showTypePicker}
        onClose={() => setShowTypePicker(false)}
        title="Select Equipment Type"
        items={typeItems}
        selected={typeId}
        searchable
        loading={typesLoading}
        onSelect={(value) => {
          const found = typeItems.find((t) => t.value === value)
          setTypeId(value)
          setTypeName(found?.label ?? '')
        }}
      />

      <FileManagerSheet
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={(url) => { setImage(url); setShowImagePicker(false) }}
      />

      <FileManagerSheet
        visible={showDocumentPicker}
        onClose={() => setShowDocumentPicker(false)}
        onSelect={handleAddDocument}
      />
    </View>
  )
}
