import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Animated, Modal, Pressable, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { Ionicons } from '@expo/vector-icons'
import {
  useEquipmentQRCode,
  useRegenerateEquipmentQRCode,
} from '@/services/equipment/equipment-queries'

interface QRCodeModalProps {
  visible: boolean
  onClose: () => void
  equipmentId: string | undefined
  equipmentName?: string
}

export function QRCodeModal({ visible, onClose, equipmentId, equipmentName }: QRCodeModalProps) {
  const slideAnim = useRef(new Animated.Value(400)).current
  const [isDownloading, setIsDownloading] = useState(false)

  const { data, isLoading } = useEquipmentQRCode(visible ? equipmentId : undefined)
  const regenerateMutation = useRegenerateEquipmentQRCode()

  const url = data?.data.url ?? null

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
        toValue: 400,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }, [visible])

  async function handleDownload() {
    if (!url) return
    setIsDownloading(true)
    try {
      const downloadedFile = await File.downloadFileAsync(url, Paths.cache)
      await Sharing.shareAsync(downloadedFile.uri)
    } catch (e) {
      Alert.alert('Download QR Code', e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setIsDownloading(false)
    }
  }

  async function handleRegenerate() {
    if (!equipmentId) return
    try {
      await regenerateMutation.mutateAsync(equipmentId)
    } catch (e) {
      Alert.alert('Regenerate QR Code', e instanceof Error ? e.message : 'Something went wrong')
    }
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Animated.View
          style={{ transform: [{ translateY: slideAnim }] }}
          className="bg-white rounded-t-3xl"
          onStartShouldSetResponder={() => true}
        >
          <View className="items-center pt-3 pb-2">
            <View className="w-10 h-1 rounded-full bg-gray-300" />
          </View>

          <View className="flex-row items-center justify-between px-5 pb-3 border-b border-gray-100">
            <Text className="text-base font-semibold text-gray-900">QR Code</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </Pressable>
          </View>

          <View className="px-5 py-6 items-center">
            <View className="w-40 h-40 border border-gray-200 rounded-xl items-center justify-center overflow-hidden bg-gray-50">
              {isLoading ? (
                <ActivityIndicator color="#208AEF" />
              ) : url ? (
                <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
              ) : (
                <Ionicons name="qr-code-outline" size={56} color="#9CA3AF" />
              )}
            </View>

            {!isLoading && !url && (
              <Text className="text-sm text-amber-600 text-center mt-3">
                QR code is missing or failed to generate.
              </Text>
            )}

            {equipmentName && (
              <Text className="text-sm text-gray-500 mt-2">{equipmentName}</Text>
            )}

            <View className="flex-row gap-x-3 mt-5 w-full">
              {url ? (
                <Pressable
                  onPress={handleDownload}
                  disabled={isDownloading}
                  className="flex-1 flex-row items-center justify-center gap-x-2 bg-gray-900 rounded-xl h-11 active:opacity-80 disabled:opacity-40"
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                  )}
                  <Text className="text-white text-sm font-semibold">Download</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleRegenerate}
                  disabled={regenerateMutation.isPending}
                  className="flex-1 flex-row items-center justify-center gap-x-2 border border-amber-500 rounded-xl h-11 active:opacity-80 disabled:opacity-40"
                >
                  {regenerateMutation.isPending ? (
                    <ActivityIndicator size="small" color="#D97706" />
                  ) : (
                    <Ionicons name="refresh-outline" size={18} color="#D97706" />
                  )}
                  <Text className="text-amber-600 text-sm font-semibold">Regenerate</Text>
                </Pressable>
              )}
            </View>
          </View>

          <View className="h-6" />
        </Animated.View>
      </Pressable>
    </Modal>
  )
}
