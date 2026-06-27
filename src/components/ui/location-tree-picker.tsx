import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocationsTree } from '@/services/locations/locations-queries'
import type { Location } from '@/services/locations/locations-types'

interface LocationTreePickerProps {
  visible: boolean
  onClose: () => void
  selected: string
  onSelect: (id: string, name: string) => void
  title?: string
}

interface FlatResult {
  location: Location
  breadcrumb: string
}

function flattenTree(nodes: Location[], ancestors: string[] = []): FlatResult[] {
  const results: FlatResult[] = []
  for (const node of nodes) {
    const path = [...ancestors, node.name]
    results.push({ location: node, breadcrumb: ancestors.join(' › ') })
    if (node.children?.length) {
      results.push(...flattenTree(node.children, path))
    }
  }
  return results
}

function initExpanded(nodes: Location[]): Set<string> {
  return new Set(nodes.map((n) => n.id))
}

interface LocationNodeProps {
  node: Location
  level: number
  selected: string
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onSelect: (id: string, name: string) => void
}

function LocationNode({ node, level, selected, expandedIds, onToggle, onSelect }: LocationNodeProps) {
  const hasChildren = (node.children?.length ?? 0) > 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = node.id === selected

  return (
    <View>
      <Pressable
        onPress={() => onSelect(node.id, node.name)}
        className="flex-row items-center py-3 pr-5 active:bg-gray-50"
        style={{ paddingLeft: level * 20 + 20 }}
      >
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation()
              onToggle(node.id)
            }}
            hitSlop={8}
            className="w-6 h-6 items-center justify-center mr-1"
          >
            <Ionicons
              name={isExpanded ? 'chevron-down' : 'chevron-forward'}
              size={14}
              color="#9CA3AF"
            />
          </Pressable>
        ) : (
          <View className="w-7" />
        )}

        {/* Location icon */}
        <Ionicons
          name="location-outline"
          size={16}
          color={isSelected ? '#208AEF' : '#6B7280'}
          style={{ marginRight: 8 }}
        />

        {/* Name */}
        <Text
          className={`flex-1 text-sm ${isSelected ? 'text-blue-600 font-semibold' : 'text-gray-800'}`}
          numberOfLines={1}
        >
          {node.name}
        </Text>

        {/* Selected checkmark */}
        {isSelected && <Ionicons name="checkmark" size={18} color="#208AEF" />}
      </Pressable>

      {/* Children */}
      {isExpanded && hasChildren && (
        <View>
          {node.children!.map((child) => (
            <LocationNode
              key={child.id}
              node={child}
              level={level + 1}
              selected={selected}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </View>
      )}
    </View>
  )
}

export function LocationTreePicker({
  visible,
  onClose,
  selected,
  onSelect,
  title = 'Select Location',
}: LocationTreePickerProps) {
  const slideAnim = useRef(new Animated.Value(500)).current
  const [search, setSearch] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const { data, isLoading } = useLocationsTree()
  const roots = data?.data ?? []

  // Initialize expanded state when data loads or sheet opens
  useEffect(() => {
    if (visible && roots.length > 0) {
      setExpandedIds(initExpanded(roots))
      setSearch('')
    }
  }, [visible, roots.length])

  // Slide animation
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start()
    } else {
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }, [visible])

  function handleToggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleSelect(id: string, name: string) {
    onSelect(id, name)
    onClose()
  }

  // Flat filtered list for search mode
  const flatResults = useMemo(() => {
    if (!search.trim()) return []
    const all = flattenTree(roots)
    const q = search.toLowerCase()
    return all.filter((r) => r.location.name.toLowerCase().includes(q))
  }, [search, roots])

  const isSearching = search.trim().length > 0

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Animated.View
          style={{ transform: [{ translateY: slideAnim }] }}
          className="bg-white rounded-t-3xl"
          onStartShouldSetResponder={() => true}
        >
          {/* Handle */}
          <View className="items-center pt-3 pb-2">
            <View className="w-10 h-1 rounded-full bg-gray-300" />
          </View>

          {/* Title row */}
          <View className="flex-row items-center justify-between px-5 pb-3 border-b border-gray-100">
            <Text className="text-base font-semibold text-gray-900">{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Search */}
          <View className="px-4 pt-3 pb-2">
            <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-10 gap-x-2">
              <Ionicons name="search-outline" size={16} color="#9CA3AF" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search locations…"
                className="flex-1 text-sm text-gray-800"
                placeholderTextColor="#9CA3AF"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Content */}
          {isLoading ? (
            <View className="py-12 items-center">
              <Text className="text-sm text-gray-400">Loading…</Text>
            </View>
          ) : isSearching ? (
            /* Search results — flat list with breadcrumb */
            <ScrollView
              style={{ maxHeight: 360 }}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingVertical: 8 }}
            >
              {flatResults.length === 0 ? (
                <View className="py-8 items-center">
                  <Text className="text-sm text-gray-400">No locations found</Text>
                </View>
              ) : (
                flatResults.map(({ location, breadcrumb }) => {
                  const isSelected = location.id === selected
                  return (
                    <Pressable
                      key={location.id}
                      onPress={() => handleSelect(location.id, location.name)}
                      className="flex-row items-center px-5 py-3 active:bg-gray-50"
                    >
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color={isSelected ? '#208AEF' : '#6B7280'}
                        style={{ marginRight: 10 }}
                      />
                      <View className="flex-1">
                        <Text
                          className={`text-sm ${isSelected ? 'text-blue-600 font-semibold' : 'text-gray-800'}`}
                          numberOfLines={1}
                        >
                          {location.name}
                        </Text>
                        {breadcrumb.length > 0 && (
                          <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
                            {breadcrumb}
                          </Text>
                        )}
                      </View>
                      {isSelected && <Ionicons name="checkmark" size={18} color="#208AEF" />}
                    </Pressable>
                  )
                })
              )}
            </ScrollView>
          ) : (
            /* Tree view */
            <ScrollView
              style={{ maxHeight: 360 }}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingVertical: 8 }}
            >
              {roots.length === 0 ? (
                <View className="py-8 items-center">
                  <Text className="text-sm text-gray-400">No locations available</Text>
                </View>
              ) : (
                roots.map((node) => (
                  <LocationNode
                    key={node.id}
                    node={node}
                    level={0}
                    selected={selected}
                    expandedIds={expandedIds}
                    onToggle={handleToggle}
                    onSelect={handleSelect}
                  />
                ))
              )}
            </ScrollView>
          )}

          <View className="h-6" />
        </Animated.View>
      </Pressable>
    </Modal>
  )
}
