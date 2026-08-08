import { useEffect, useRef, useState } from 'react'
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
}: BottomSheetPickerProps) {
  const slideAnim = useRef(new Animated.Value(400)).current
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (visible) {
      setSearch('')
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start()
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
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
                  onChangeText={setSearch}
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
