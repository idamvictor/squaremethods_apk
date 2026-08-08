import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import * as DocumentPicker from 'expo-document-picker'
import { useAuthStore } from '@/store/auth-store'
import { useDeleteEquipment, useImportEquipmentHierarchy } from '@/services/equipment/equipment-queries'
import {
  useLocationsWithEquipment,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from '@/services/locations/locations-queries'
import type { Location, LocationEquipmentItem } from '@/services/locations/locations-types'
import type { UserRole } from '@/types/auth'

const ADMIN_ROLES: UserRole[] = ['superadmin', 'owner', 'admin']

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-500' },
  published: { bg: 'bg-green-100', text: 'text-green-700' },
}

// ─── helpers ────────────────────────────────────────────────────────────────

function countItems(node: Location): number {
  return (node.children?.length ?? 0) + (node.equipment?.length ?? 0)
}

function getAllLocationIds(nodes: Location[]): Set<string> {
  const ids = new Set<string>()
  function walk(list: Location[]) {
    for (const n of list) {
      ids.add(n.id)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return ids
}

function filterTree(nodes: Location[], query: string): Location[] {
  const q = query.toLowerCase()
  return nodes.reduce<Location[]>((acc, node) => {
    const filteredChildren = filterTree(node.children ?? [], q)
    const filteredEquipment = (node.equipment ?? []).filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.reference_code.toLowerCase().includes(q),
    )
    const locationMatches = node.name.toLowerCase().includes(q)
    if (locationMatches || filteredChildren.length > 0 || filteredEquipment.length > 0) {
      acc.push({ ...node, children: filteredChildren, equipment: filteredEquipment })
    }
    return acc
  }, [])
}

function initExpanded(nodes: Location[]): Set<string> {
  return new Set(nodes.map((n) => n.id))
}

// ─── LocationFormModal ───────────────────────────────────────────────────────

interface LocationFormModalProps {
  visible: boolean
  onClose: () => void
  onSave: (name: string) => void
  initialName?: string
  title: string
  isSaving: boolean
}

function LocationFormModal({
  visible,
  onClose,
  onSave,
  initialName = '',
  title,
  isSaving,
}: LocationFormModalProps) {
  const [name, setName] = useState(initialName)

  useEffect(() => {
    if (visible) setName(initialName)
  }, [visible, initialName])

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed)
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/50 items-center justify-center px-6"
      >
        <View className="w-full bg-white rounded-2xl overflow-hidden shadow-lg">
          {/* Title */}
          <View className="px-5 pt-5 pb-3 border-b border-gray-100 flex-row items-center justify-between">
            <Text className="text-base font-semibold text-gray-900">{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Input */}
          <View className="px-5 py-4">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Location Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Assembly Building B"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
              className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-800"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Actions */}
          <View className="flex-row gap-x-3 px-5 pb-5">
            <Pressable
              onPress={onClose}
              className="flex-1 h-11 rounded-xl border border-gray-200 items-center justify-center active:bg-gray-50"
            >
              <Text className="text-sm font-medium text-gray-600">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!name.trim() || isSaving}
              className={`flex-1 h-11 rounded-xl items-center justify-center ${
                !name.trim() || isSaving ? 'bg-blue-300' : 'bg-blue-600 active:opacity-80'
              }`}
            >
              <Text className="text-sm font-semibold text-white">
                {isSaving ? 'Saving…' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── EquipmentRow ────────────────────────────────────────────────────────────

function EquipmentRow({
  item,
  level,
  isAdmin,
  onDelete,
}: {
  item: LocationEquipmentItem
  level: number
  isAdmin: boolean
  onDelete: (id: string, name: string) => void
}) {
  const badge = STATUS_BADGE[item.status] ?? { bg: 'bg-gray-100', text: 'text-gray-500' }

  function handleEllipsis() {
    Alert.alert(item.name, undefined, [
      {
        text: 'Edit',
        onPress: () =>
          router.push({ pathname: '/(app)/(equipment)/edit', params: { id: item.id } }),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(item.id, item.name),
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/(app)/(equipment)/[id]', params: { id: item.id } })
      }
      onLongPress={isAdmin ? handleEllipsis : undefined}
      className="flex-row items-center py-2.5 pr-3 active:bg-blue-50"
      style={{ paddingLeft: level * 16 + 28 }}
    >
      <View className="w-6 h-6 items-center justify-center mr-2">
        <Ionicons name="cube-outline" size={17} color="#208AEF" />
      </View>

      <View className="flex-1 gap-y-0.5">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-xs text-gray-400">#{item.reference_code}</Text>
      </View>

      <View className={`px-2 py-0.5 rounded-full mx-2 ${badge.bg}`}>
        <Text className={`text-xs font-medium capitalize ${badge.text}`}>{item.status}</Text>
      </View>

      {isAdmin && (
        <Pressable onPress={handleEllipsis} hitSlop={8} className="p-1 active:opacity-50">
          <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
        </Pressable>
      )}
    </Pressable>
  )
}

// ─── HierarchyNode ────────────────────────────────────────────────────────────

interface HierarchyNodeProps {
  node: Location
  level: number
  expandedIds: Set<string>
  onToggle: (id: string) => void
  isAdmin: boolean
  onDeleteEquipment: (id: string, name: string) => void
  onAddChild: (parentId: string, parentName: string) => void
  onEdit: (locationId: string, currentName: string) => void
  onDeleteLocation: (id: string, name: string) => void
}

function HierarchyNode({
  node,
  level,
  expandedIds,
  onToggle,
  isAdmin,
  onDeleteEquipment,
  onAddChild,
  onEdit,
  onDeleteLocation,
}: HierarchyNodeProps) {
  const isExpanded = expandedIds.has(node.id)
  const hasChildren = (node.children?.length ?? 0) > 0
  const hasEquipment = (node.equipment?.length ?? 0) > 0
  const hasContent = hasChildren || hasEquipment
  const total = countItems(node)

  function handleAddPress() {
    Alert.alert(`Add to "${node.name}"`, undefined, [
      {
        text: 'Add Sub-location',
        onPress: () => onAddChild(node.id, node.name),
      },
      {
        text: 'Add Equipment',
        onPress: () =>
          router.push({
            pathname: '/(app)/(equipment)/create',
            params: { prefill_location_id: node.id, prefill_location_name: node.name },
          }),
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  function handleEllipsis() {
    Alert.alert(node.name, undefined, [
      {
        text: 'Edit',
        onPress: () => onEdit(node.id, node.name),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDeleteLocation(node.id, node.name),
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  return (
    <View>
      {/* Location row */}
      <Pressable
        onPress={() => onToggle(node.id)}
        className="flex-row items-center py-3 pr-2 active:bg-gray-50"
        style={{ paddingLeft: level * 16 + 4 }}
      >
        {/* Chevron */}
        <View className="w-6 h-6 items-center justify-center mr-1">
          {hasContent ? (
            <Ionicons
              name={isExpanded ? 'chevron-down' : 'chevron-forward'}
              size={14}
              color="#9CA3AF"
            />
          ) : null}
        </View>

        {/* Folder icon */}
        <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center mr-3">
          <Ionicons
            name={isExpanded && hasContent ? 'folder-open-outline' : 'folder-outline'}
            size={17}
            color="#208AEF"
          />
        </View>

        {/* Name */}
        <Text className="flex-1 text-sm font-semibold text-gray-800" numberOfLines={1}>
          {node.name}
        </Text>

        {/* Count badge */}
        {total > 0 && (
          <View className="px-2 py-0.5 rounded-full bg-gray-100 mx-1">
            <Text className="text-xs text-gray-500">{total}</Text>
          </View>
        )}

        {/* Admin action buttons */}
        {isAdmin && (
          <>
            <Pressable
              onPress={handleAddPress}
              hitSlop={6}
              className="p-1.5 active:opacity-50"
            >
              <Ionicons name="add-circle-outline" size={18} color="#9CA3AF" />
            </Pressable>
            <Pressable
              onPress={handleEllipsis}
              hitSlop={6}
              className="p-1.5 active:opacity-50"
            >
              <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
            </Pressable>
          </>
        )}
      </Pressable>

      {/* Expanded content */}
      {isExpanded && (
        <View>
          {node.children?.map((child) => (
            <HierarchyNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              isAdmin={isAdmin}
              onDeleteEquipment={onDeleteEquipment}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDeleteLocation={onDeleteLocation}
            />
          ))}
          {node.equipment?.map((eq) => (
            <EquipmentRow
              key={eq.id}
              item={eq}
              level={level + 1}
              isAdmin={isAdmin}
              onDelete={onDeleteEquipment}
            />
          ))}
          {!hasContent && (
            <View style={{ paddingLeft: level * 16 + 48 }} className="py-2">
              <Text className="text-xs text-gray-400 italic">No items</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type LocationModalState = {
  mode: 'add' | 'edit'
  parentId?: string
  locationId?: string
  initialName?: string
  title: string
} | null

export default function EquipmentScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const company = useAuthStore((s) => s.company)
  const isAdmin = ADMIN_ROLES.includes((user?.role ?? '') as UserRole)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [locationModal, setLocationModal] = useState<LocationModalState>(null)
  const [isImportingHierarchy, setIsImportingHierarchy] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { mutate: deleteEquipment } = useDeleteEquipment()
  const { mutate: createLocation, isPending: isCreating } = useCreateLocation()
  const { mutate: updateLocation, isPending: isUpdating } = useUpdateLocation()
  const importHierarchyMutation = useImportEquipmentHierarchy()
  const { mutate: deleteLocation } = useDeleteLocation()

  const { data, isLoading, isFetching, refetch } = useLocationsWithEquipment()
  const roots = data?.data ?? []

  // Initialise expanded state when data first loads
  useEffect(() => {
    if (roots.length > 0 && expandedIds.size === 0) {
      setExpandedIds(initExpanded(roots))
    }
  }, [roots.length])

  // Debounce search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [search])

  // Auto-expand all when searching, restore root-only when cleared
  useEffect(() => {
    if (debouncedSearch.trim()) {
      setExpandedIds(getAllLocationIds(roots))
    } else if (roots.length > 0) {
      setExpandedIds(initExpanded(roots))
    }
  }, [debouncedSearch])

  const displayedRoots = useMemo(() => {
    if (!debouncedSearch.trim()) return roots
    return filterTree(roots, debouncedSearch)
  }, [roots, debouncedSearch])

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Location modal handlers
  function handleLocationSave(name: string) {
    if (!locationModal) return
    if (locationModal.mode === 'add') {
      createLocation(
        { name, parent_location_id: locationModal.parentId },
        { onSuccess: () => setLocationModal(null) },
      )
    } else {
      if (!locationModal.locationId) return
      updateLocation(
        { id: locationModal.locationId, name },
        { onSuccess: () => setLocationModal(null) },
      )
    }
  }

  function handleAddChild(parentId: string, parentName: string) {
    setLocationModal({ mode: 'add', parentId, title: `Add to "${parentName}"` })
  }

  function handleEditLocation(locationId: string, currentName: string) {
    setLocationModal({ mode: 'edit', locationId, initialName: currentName, title: 'Edit Location' })
  }

  function handleDeleteLocation(id: string, name: string) {
    Alert.alert(`Delete "${name}"?`, 'All sub-locations and equipment will also be affected.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteLocation(id),
      },
    ])
  }

  function handleDeleteEquipment(id: string, name: string) {
    Alert.alert(`Delete "${name}"?`, 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteEquipment(id, { onSuccess: () => refetch() }),
      },
    ])
  }

  function handleHeaderAdd() {
    setLocationModal({ mode: 'add', parentId: undefined, title: 'Add Root Location' })
  }

  async function handleImportHierarchy() {
    if (!company?.id || !user?.id) return
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
      ],
      copyToCacheDirectory: true,
    })
    if (result.canceled || !result.assets?.[0]) return
    const asset = result.assets[0]

    setIsImportingHierarchy(true)
    try {
      await importHierarchyMutation.mutateAsync({
        file: {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType ?? 'application/octet-stream',
        },
        company_id: company.id,
        created_by: user.id,
      })
      Alert.alert('Import', 'Equipment hierarchy imported successfully.')
      refetch()
    } catch (e) {
      Alert.alert('Import', e instanceof Error ? e.message : 'Failed to import equipment hierarchy')
    } finally {
      setIsImportingHierarchy(false)
    }
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100 px-4 pb-3"
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xl font-bold text-gray-900">Equipment</Text>
          {isAdmin && (
            <View className="flex-row items-center gap-x-2">
              <Pressable
                onPress={handleImportHierarchy}
                disabled={isImportingHierarchy}
                className="flex-row items-center gap-x-1.5 px-3 h-8 rounded-full border border-gray-200 bg-white active:opacity-70"
              >
                {isImportingHierarchy ? (
                  <ActivityIndicator size="small" color="#4B5563" />
                ) : (
                  <Ionicons name="cloud-upload-outline" size={15} color="#4B5563" />
                )}
                <Text className="text-xs font-semibold text-gray-700">
                  {isImportingHierarchy ? 'Importing…' : 'Import'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleHeaderAdd}
                className="w-8 h-8 items-center justify-center rounded-full bg-blue-600 active:opacity-70"
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          )}
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-9 gap-x-2">
          <Ionicons name="search-outline" size={15} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search equipment or locations…"
            className="flex-1 text-sm text-gray-800"
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Tree */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#208AEF" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: insets.bottom + 24 }}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor="#208AEF"
            />
          }
        >
          {displayedRoots.length === 0 ? (
            <View className="flex-1 items-center justify-center py-24">
              <Ionicons name="folder-open-outline" size={40} color="#D1D5DB" />
              <Text className="mt-3 text-sm text-gray-400">
                {debouncedSearch ? 'No results found' : 'No locations found'}
              </Text>
              {isAdmin && !debouncedSearch && (
                <Pressable
                  onPress={() =>
                    setLocationModal({ mode: 'add', title: 'Add Root Location' })
                  }
                  className="mt-4 px-4 py-2 bg-blue-600 rounded-xl active:opacity-70"
                >
                  <Text className="text-sm font-semibold text-white">Add Location</Text>
                </Pressable>
              )}
            </View>
          ) : (
            displayedRoots.map((node) => (
              <HierarchyNode
                key={node.id}
                node={node}
                level={0}
                expandedIds={expandedIds}
                onToggle={handleToggle}
                isAdmin={isAdmin}
                onDeleteEquipment={handleDeleteEquipment}
                onAddChild={handleAddChild}
                onEdit={handleEditLocation}
                onDeleteLocation={handleDeleteLocation}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Location form modal */}
      <LocationFormModal
        visible={locationModal !== null}
        onClose={() => setLocationModal(null)}
        onSave={handleLocationSave}
        initialName={locationModal?.initialName ?? ''}
        title={locationModal?.title ?? ''}
        isSaving={isCreating || isUpdating}
      />
    </View>
  )
}
