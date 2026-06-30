import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { useFiles, useUploadFile } from '@/services/job-aids/job-aids-queries'
import type { BrowseFile } from '@/services/job-aids/job-aids-types'

const SCREEN_HEIGHT = Dimensions.get('window').height
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.72

interface FileManagerSheetProps {
  visible: boolean
  onClose: () => void
  onSelect: (url: string) => void
  folder?: string
}

type Tab = 'browse' | 'upload' | 'camera'

function TabPill({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 py-2 items-center rounded-xl ${active ? 'bg-blue-600' : 'bg-gray-100'}`}
    >
      <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-gray-500'}`}>
        {label}
      </Text>
    </Pressable>
  )
}

function BrowseTab({
  onSelect,
  onClose,
}: {
  onSelect: (url: string) => void
  onClose: () => void
}) {
  const [page, setPage] = useState(1)
  const [allFiles, setAllFiles] = useState<BrowseFile[]>([])
  const { data, isLoading, refetch, error } = useFiles(page)

  useEffect(() => {
    if (data?.data) {
      setAllFiles((prev) => {
        if (page === 1) return data.data
        const existingKeys = new Set(prev.map((f) => f.key))
        return [...prev, ...data.data.filter((f) => !existingKeys.has(f.key))]
      })
    }
  }, [data, page])

  const hasMore = data ? page < data.pagination.totalPages : false

  const THUMB_SIZE = (Dimensions.get('window').width - 32 - 8) / 3

  if (error && allFiles.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6 gap-y-3">
        <Ionicons name="cloud-offline-outline" size={40} color="#D1D5DB" />
        <Text className="text-sm text-gray-400 text-center">
          Could not load files. Check your connection and try again.
        </Text>
        <Pressable
          onPress={() => refetch()}
          className="px-4 py-2 bg-blue-600 rounded-xl active:opacity-70"
        >
          <Text className="text-sm font-semibold text-white">Retry</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <FlatList
      data={allFiles}
      keyExtractor={(item, index) => `${item.key ?? ''}-${index}`}
      numColumns={3}
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 4 }}
      columnWrapperStyle={{ gap: 4 }}
      onRefresh={() => {
        setPage(1)
        refetch()
      }}
      refreshing={isLoading && page === 1}
      onEndReached={() => {
        if (hasMore && !isLoading) setPage((p) => p + 1)
      }}
      onEndReachedThreshold={0.3}
      ListEmptyComponent={
        isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator color="#208AEF" />
          </View>
        ) : (
          <View className="py-12 items-center gap-y-2">
            <Ionicons name="images-outline" size={40} color="#D1D5DB" />
            <Text className="text-sm text-gray-400">No files yet — upload one</Text>
          </View>
        )
      }
      ListFooterComponent={
        hasMore ? (
          <View className="py-4 items-center">
            <ActivityIndicator color="#208AEF" />
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => {
            onSelect(item.url)
            onClose()
          }}
          className="active:opacity-70"
          style={{ width: THUMB_SIZE }}
        >
          <View
            style={{
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: 8,
              backgroundColor: '#F3F4F6',
            }}
          >
            <Image
              source={{ uri: item.url }}
              style={{ width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 8 }}
              contentFit="cover"
              transition={150}
            />
          </View>
          <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
            {item.originalName || item.name}
          </Text>
        </Pressable>
      )}
    />
  )
}

function PickerTab({
  mode,
  folder,
  onSelect,
  onClose,
}: {
  mode: 'upload' | 'camera'
  folder: string
  onSelect: (url: string) => void
  onClose: () => void
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const { mutate: upload, isPending } = useUploadFile()

  async function pick() {
    setUploadError(null)
    const result =
      mode === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: 'images',
            quality: 0.85,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            quality: 0.85,
          })

    if (!result.canceled && result.assets[0]) {
      setPreview(result.assets[0].uri)
    }
  }

  function handleUpload() {
    if (!preview) return
    setUploadError(null)
    upload(
      { uri: preview, folder },
      {
        onSuccess: (url) => {
          onSelect(url)
          onClose()
        },
        onError: (e: any) => {
          setUploadError(
            e?.response?.data?.message ?? e?.message ?? 'Upload failed',
          )
        },
      },
    )
  }

  if (preview) {
    return (
      <View className="flex-1 items-center justify-center px-6 gap-y-4">
        <Image
          source={{ uri: preview }}
          style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12 }}
          contentFit="cover"
        />
        {uploadError && (
          <Text className="text-sm text-red-500 text-center">{uploadError}</Text>
        )}
        <View className="flex-row gap-x-3 w-full">
          <Pressable
            onPress={() => setPreview(null)}
            className="flex-1 h-11 border border-gray-200 rounded-xl items-center justify-center"
          >
            <Text className="text-sm font-semibold text-gray-700">Retake</Text>
          </Pressable>
          <Pressable
            onPress={handleUpload}
            disabled={isPending}
            className="flex-1 h-11 bg-blue-600 rounded-xl items-center justify-center active:opacity-70"
          >
            {isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-sm font-semibold text-white">Upload</Text>
            )}
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 items-center justify-center px-6 gap-y-4">
      <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center">
        <Ionicons
          name={mode === 'camera' ? 'camera-outline' : 'folder-outline'}
          size={36}
          color="#9CA3AF"
        />
      </View>
      <Text className="text-base font-semibold text-gray-800">
        {mode === 'camera' ? 'Take a photo' : 'Pick from gallery'}
      </Text>
      <Text className="text-sm text-gray-500 text-center">
        {mode === 'camera'
          ? 'Open your camera to capture a photo'
          : 'Choose an image from your device'}
      </Text>
      <Pressable
        onPress={pick}
        className="h-11 px-8 bg-blue-600 rounded-xl items-center justify-center active:opacity-70"
      >
        <Text className="text-sm font-semibold text-white">
          {mode === 'camera' ? 'Open Camera' : 'Choose File'}
        </Text>
      </Pressable>
    </View>
  )
}

export function FileManagerSheet({
  visible,
  onClose,
  onSelect,
  folder = 'job-aids',
}: FileManagerSheetProps) {
  const slideAnim = useRef(new Animated.Value(SHEET_MAX_HEIGHT)).current
  const [tab, setTab] = useState<Tab>('browse')

  useEffect(() => {
    if (visible) {
      setTab('browse')
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start()
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_MAX_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }, [visible])

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Animated.View
          style={[{ transform: [{ translateY: slideAnim }], height: SHEET_MAX_HEIGHT }]}
          className="bg-white rounded-t-3xl"
          onStartShouldSetResponder={() => true}
        >
          {/* Handle */}
          <View className="items-center pt-3 pb-2">
            <View className="w-10 h-1 rounded-full bg-gray-300" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pb-3 border-b border-gray-100">
            <Text className="text-base font-semibold text-gray-900">Select Image</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Tab pills */}
          <View className="flex-row gap-x-2 px-4 pt-3 pb-2">
            <TabPill label="Browse" active={tab === 'browse'} onPress={() => setTab('browse')} />
            <TabPill label="Upload" active={tab === 'upload'} onPress={() => setTab('upload')} />
            <TabPill label="Camera" active={tab === 'camera'} onPress={() => setTab('camera')} />
          </View>

          {/* Content */}
          <View style={{ flex: 1, minHeight: 280 }}>
            {tab === 'browse' && (
              <BrowseTab onSelect={onSelect} onClose={onClose} />
            )}
            {tab === 'upload' && (
              <PickerTab
                mode="upload"
                folder={folder}
                onSelect={onSelect}
                onClose={onClose}
              />
            )}
            {tab === 'camera' && (
              <PickerTab
                mode="camera"
                folder={folder}
                onSelect={onSelect}
                onClose={onClose}
              />
            )}
          </View>

          <View className="h-6" />
        </Animated.View>
      </Pressable>
    </Modal>
  )
}
