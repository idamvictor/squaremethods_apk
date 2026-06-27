import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
import { useAuthStore } from '@/store/auth-store'
import { useDeleteEquipment } from '@/services/equipment/equipment-queries'
import { useLocationsWithEquipment } from '@/services/locations/locations-queries'
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

  function handleLongPress() {
    if (!isAdmin) return
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
      onLongPress={handleLongPress}
      className="flex-row items-center py-2.5 pr-4 active:bg-blue-50"
      style={{ paddingLeft: level * 16 + 24 }}
    >
      {/* connector line feel */}
      <View className="w-6 h-6 items-center justify-center mr-2">
        <Ionicons name="cube-outline" size={17} color="#208AEF" />
      </View>

      <View className="flex-1 gap-y-0.5">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-xs text-gray-400">#{item.reference_code}</Text>
      </View>

      <View className={`px-2 py-0.5 rounded-full ml-2 ${badge.bg}`}>
        <Text className={`text-xs font-medium capitalize ${badge.text}`}>{item.status}</Text>
      </View>
    </Pressable>
  )
}

// ─── HierarchyNode ────────────────────────────────────────────────────────────

function HierarchyNode({
  node,
  level,
  expandedIds,
  onToggle,
  isAdmin,
  onDelete,
}: {
  node: Location
  level: number
  expandedIds: Set<string>
  onToggle: (id: string) => void
  isAdmin: boolean
  onDelete: (id: string, name: string) => void
}) {
  const isExpanded = expandedIds.has(node.id)
  const hasChildren = (node.children?.length ?? 0) > 0
  const hasEquipment = (node.equipment?.length ?? 0) > 0
  const hasContent = hasChildren || hasEquipment
  const total = countItems(node)

  return (
    <View>
      {/* Location row */}
      <Pressable
        onPress={() => onToggle(node.id)}
        className="flex-row items-center py-3 pr-4 active:bg-gray-50"
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
          <View className="px-2 py-0.5 rounded-full bg-gray-100 ml-2">
            <Text className="text-xs text-gray-500">{total}</Text>
          </View>
        )}
      </Pressable>

      {/* Expanded content */}
      {isExpanded && (
        <View>
          {/* Child locations */}
          {node.children?.map((child) => (
            <HierarchyNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              isAdmin={isAdmin}
              onDelete={onDelete}
            />
          ))}
          {/* Equipment items */}
          {node.equipment?.map((eq) => (
            <EquipmentRow
              key={eq.id}
              item={eq}
              level={level + 1}
              isAdmin={isAdmin}
              onDelete={onDelete}
            />
          ))}
          {/* Empty location */}
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

export default function EquipmentScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const isAdmin = ADMIN_ROLES.includes((user?.role ?? '') as UserRole)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { mutate: deleteEquipment } = useDeleteEquipment()
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
    } else {
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
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  function handleDelete(id: string, name: string) {
    Alert.alert(`Delete "${name}"?`, 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteEquipment(id, { onSuccess: () => refetch() }),
      },
    ])
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
            <Pressable
              onPress={() => router.push('/(app)/(equipment)/create')}
              className="w-8 h-8 items-center justify-center rounded-full bg-blue-600 active:opacity-70"
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </Pressable>
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
                onDelete={handleDelete}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  )
}
