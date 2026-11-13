import { useEffect, useState } from 'react'
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useSheetSlide } from '@/hooks/use-sheet-slide'

export interface PickerItem {
  label: string
  value: string
  icon?: string | null
}

function PickerItemIcon({ icon }: { icon: string }) {
  if (icon.startsWith('http://') || icon.startsWith('https://')) {
    return <Image source={{ uri: icon }} style={{ width: 18, height: 18 }} contentFit="contain" />
  }
  return <Text className="text-base">{icon}</Text>
}

interface BottomSheetPickerProps {
  visible: boolean
  onClose: () => void
  items: PickerItem[]
  selected: string | null
  onSelect: (value: string) => void
  title: string
  searchable?: boolean
  loading?: boolean
  onSearchChange?: (text: string) => void
}

export function BottomSheetPicker({
  visible,
  onClose,
  items,
  selected,
  onSelect,
  title,
  searchable = false,
  loading = false,
  onSearchChange,
}: BottomSheetPickerProps) {
  const slideAnim = useSheetSlide(visible, 400)
  const [search, setSearch] = useState('')
  const [prevVisible, setPrevVisible] = useState(visible)

  // Clear the search box each time the sheet opens
  if (visible !== prevVisible) {
    setPrevVisible(visible)
    if (visible) setSearch('')
  }

  // Tell the parent the search was cleared (parent state, so it stays in an effect)
  useEffect(() => {
    if (visible) onSearchChange?.('')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on open; parent callback is often an inline fn
  }, [visible])

  const filtered = searchable && search.trim()
    ? items.filter((i) => i.label.toLowerCase().includes(search.toLowerCase()))
    : items

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable
        className="flex-1 bg-black/40 justify-end"
        onPress={onClose}
      >
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
          {searchable && (
            <View className="px-4 pt-3">
              <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-10 gap-x-2">
                <Ionicons name="search-outline" size={16} color="#9CA3AF" />
                <TextInput
                  value={search}
                  onChangeText={(text) => {
                    setSearch(text)
                    onSearchChange?.(text)
                  }}
                  placeholder="Search…"
                  className="flex-1 text-sm text-gray-800"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          )}

          {/* List */}
          {loading ? (
            <View className="py-12 items-center">
              <Text className="text-sm text-gray-400">Loading…</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              style={{ maxHeight: 320 }}
              contentContainerStyle={{ paddingVertical: 8 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item.value)
                    onClose()
                  }}
                  className="flex-row items-center gap-x-2.5 px-5 py-3.5 active:bg-gray-50"
                >
                  {item.icon && <PickerItemIcon icon={item.icon} />}
                  <Text className={`flex-1 text-sm ${selected === item.value ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}>
                    {item.label}
                  </Text>
                  {selected === item.value && (
                    <Ionicons name="checkmark" size={18} color="#208AEF" />
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <View className="py-8 items-center">
                  <Text className="text-sm text-gray-400">No results</Text>
                </View>
              }
            />
          )}

          {/* Bottom safe space */}
          <View className="h-6" />
        </Animated.View>
      </Pressable>
    </Modal>
  )
}
