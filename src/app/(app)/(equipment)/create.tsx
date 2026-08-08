import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
import {
  useCreateEquipment,
  useUpdateEquipment,
  useRegenerateEquipmentQRCode,
} from '@/services/equipment/equipment-queries'
import { useEquipmentTypes } from '@/services/equipment-types/equipment-types-queries'
import { useIngestDocument } from '@/services/documents/documents-queries'
import { useLocationsWithEquipment } from '@/services/locations/locations-queries'
import { useAuthStore } from '@/store/auth-store'
import { BottomSheetPicker } from '@/components/ui/bottom-sheet-picker'
import { LocationTreePicker } from '@/components/ui/location-tree-picker'
import { FileManagerSheet } from '@/components/ui/file-manager-sheet'
import type { EquipmentStatus } from '@/services/equipment/equipment-types'
import type { Location } from '@/services/locations/locations-types'

// Mirrors web's findEquipmentByReference: walk the same location/equipment
// tree the equipment list screen already loads, so this check is warm and
// matches what's actually visible in the hierarchy.
function findEquipmentByReference(
  nodes: Location[],
  refCode: string,
): { id: string; name: string } | null {
  for (const node of nodes) {
    const match = node.equipment?.find(
      (eq) => eq.reference_code.trim().toLowerCase() === refCode,
    )
    if (match) return { id: match.id, name: match.name }
    if (node.children?.length) {
      const found = findEquipmentByReference(node.children, refCode)
      if (found) return found
    }
  }
  return null
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

function PickerField({
  label,
  value,
  placeholder,
  onPress,
  disabled,
  required,
  error,
}: {
  label: string
  value: string
  placeholder: string
  onPress: () => void
  disabled?: boolean
  required?: boolean
  error?: string
}) {
  return (
    <View>
      <FieldLabel label={label} required={required} />
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className={`h-12 rounded-xl border px-4 flex-row items-center justify-between ${
          error
            ? 'border-red-400 bg-red-50'
            : disabled
              ? 'border-gray-100 bg-gray-50'
              : 'border-gray-200 bg-white'
        }`}
      >
        <Text
          className={`text-sm ${value ? 'text-gray-800' : disabled ? 'text-gray-300' : 'text-gray-400'}`}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={disabled ? '#D1D5DB' : '#9CA3AF'} />
      </Pressable>
      <FieldError message={error} />
    </View>
  )
}

export default function CreateEquipmentScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{
    prefill_location_id?: string
    prefill_location_name?: string
  }>()
  const company = useAuthStore((s) => s.company)
  const { mutateAsync: createEquipment, error: apiError } = useCreateEquipment()
  const { mutateAsync: updateEquipment } = useUpdateEquipment()
  const { mutateAsync: regenerateQr } = useRegenerateEquipmentQRCode()
  const { mutateAsync: ingestDocument } = useIngestDocument()

  const [typeId, setTypeId] = useState('')
  const [typeName, setTypeName] = useState('')
  const [locationId, setLocationId] = useState(params.prefill_location_id ?? '')
  const [locationName, setLocationName] = useState(params.prefill_location_name ?? '')
  const [name, setName] = useState('')
  const [referenceCode, setReferenceCode] = useState('')
  const [status, setStatus] = useState<EquipmentStatus>('draft')
  const [notes, setNotes] = useState('')
  const [image, setImage] = useState('')
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [documents, setDocuments] = useState<string[]>([])
  const [showDocumentPicker, setShowDocumentPicker] = useState(false)
  const [duplicateMatch, setDuplicateMatch] = useState<{ id: string; name: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [picker, setPicker] = useState<'type' | 'location' | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: typesData, isLoading: typesLoading } = useEquipmentTypes()
  const { data: hierarchyData } = useLocationsWithEquipment()

  const typeItems = (typesData?.data ?? []).map((t) => ({ label: t.name, value: t.id, icon: t.icon }))

  function validate() {
    const e: Record<string, string> = {}
    if (!typeId) e.type = 'Equipment type is required'
    if (!locationId) e.location = 'Location is required'
    if (!name.trim()) e.name = 'Name is required'
    if (!referenceCode.trim()) e.referenceCode = 'Reference code is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleReferenceCodeBlur() {
    const code = referenceCode.trim().toLowerCase()
    if (!code) {
      setDuplicateMatch(null)
      return
    }
    setDuplicateMatch(findEquipmentByReference(hierarchyData?.data ?? [], code))
  }

  async function handleSave() {
    if (!validate()) return
    setIsSaving(true)
    try {
      const created = await createEquipment({
        equipment_type_id: typeId,
        location_id: locationId,
        name: name.trim(),
        reference_code: referenceCode.trim(),
        notes: notes.trim(),
        status,
        image: image || undefined,
      })
      const newId = created.data.id

      let qrFailed = false
      try {
        await regenerateQr(newId)
      } catch {
        qrFailed = true
      }

      if (documents.length > 0) {
        try {
          await updateEquipment({ id: newId, data: { documents } })
          if (company?.id) {
            await Promise.all(
              documents.map((file_url) =>
                ingestDocument({ file_url, equipment_id: newId, company_id: company.id }).catch(() => null),
              ),
            )
          }
        } catch {
          // Equipment was created successfully; document attachment failure is non-fatal.
        }
      }

      if (qrFailed) {
        Alert.alert('Equipment created', 'Equipment created but QR code generation failed. You can retry from the equipment detail screen.')
      }
      router.replace({ pathname: '/(app)/(equipment)/[id]', params: { id: newId } })
    } catch (e) {
      const message =
        (e as any)?.response?.data?.message ??
        (e instanceof Error ? e.message : 'Something went wrong')
      Alert.alert('Create Equipment', message)
    } finally {
      setIsSaving(false)
    }
  }

  const apiErrorMsg =
    (apiError as any)?.response?.data?.message ?? (apiError as any)?.message ?? null

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
          <Text className="text-lg font-bold text-gray-900">New Equipment</Text>
        </View>
        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          className="px-4 py-1.5 bg-blue-600 rounded-xl active:opacity-70 flex-row items-center gap-x-1.5"
        >
          {isSaving && <ActivityIndicator size="small" color="#fff" />}
          <Text className="text-sm font-semibold text-white">{isSaving ? 'Saving…' : 'Save'}</Text>
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
              {documents.map((url, i) => (
                <View
                  key={url}
                  className="flex-row items-center justify-between bg-white rounded-xl border border-gray-100 px-3 py-2.5"
                >
                  <Text className="flex-1 text-sm text-gray-700 mr-2" numberOfLines={1}>
                    {url.split('/').pop()}
                  </Text>
                  <Pressable
                    onPress={() => setDocuments((prev) => prev.filter((_, idx) => idx !== i))}
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

        {/* Equipment Type */}
        <PickerField
          label="Equipment Type"
          required
          value={typeName}
          placeholder="Select equipment type"
          onPress={() => setPicker('type')}
          error={errors.type}
        />

        {/* Location */}
        <PickerField
          label="Location"
          required
          value={locationName}
          placeholder="Select location"
          onPress={() => setPicker('location')}
          error={errors.location}
        />

        {/* Name */}
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

        {/* Reference Code */}
        <View>
          <FieldLabel label="Reference Code" required />
          <TextInput
            value={referenceCode}
            onChangeText={(v) => {
              setReferenceCode(v)
              setErrors((e) => ({ ...e, referenceCode: '' }))
              if (duplicateMatch) setDuplicateMatch(null)
            }}
            onBlur={handleReferenceCodeBlur}
            placeholder="e.g. EQ-001"
            autoCapitalize="characters"
            className={`h-12 rounded-xl border px-4 text-sm text-gray-800 bg-white ${
              errors.referenceCode || duplicateMatch ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholderTextColor="#9CA3AF"
          />
          <FieldError message={errors.referenceCode} />
          {duplicateMatch && (
            <View className="mt-2 rounded-xl bg-amber-50 border border-amber-200 p-3 gap-y-1.5">
              <Text className="text-xs text-amber-700">
                Reference code exists! This code is already used by:{' '}
                <Text className="font-semibold">{duplicateMatch.name}</Text>
              </Text>
              <Pressable
                onPress={() =>
                  router.replace({
                    pathname: '/(app)/(equipment)/[id]',
                    params: { id: duplicateMatch.id },
                  })
                }
                className="active:opacity-60"
              >
                <Text className="text-xs font-semibold text-blue-600">View existing equipment</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Status */}
        <View>
          <FieldLabel label="Status" required />
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

        {/* Notes */}
        <View>
          <FieldLabel label="Notes" />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes (optional)"
            multiline
            numberOfLines={3}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 bg-white min-h-[80px]"
            placeholderTextColor="#9CA3AF"
            textAlignVertical="top"
          />
        </View>
      </KeyboardAwareScrollView>

      {/* Bottom sheet pickers */}
      <BottomSheetPicker
        visible={picker === 'type'}
        onClose={() => setPicker(null)}
        title="Select Equipment Type"
        items={typeItems}
        selected={typeId}
        searchable
        loading={typesLoading}
        onSelect={(value) => {
          const found = typeItems.find((t) => t.value === value)
          setTypeId(value)
          setTypeName(found?.label ?? '')
          setErrors((e) => ({ ...e, type: '' }))
        }}
      />

      <LocationTreePicker
        visible={picker === 'location'}
        onClose={() => setPicker(null)}
        selected={locationId}
        onSelect={(id, name) => {
          setLocationId(id)
          setLocationName(name)
          setErrors((e) => ({ ...e, location: '' }))
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
        onSelect={(url) => {
          setDocuments((prev) => (prev.includes(url) ? prev : [...prev, url]))
          setShowDocumentPicker(false)
        }}
      />
    </View>
  )
}
