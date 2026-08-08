import { useRef, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useScanEquipmentQRCode } from '@/services/equipment/equipment-queries'

const VF = 240
const CORNER = 32
const BORDER = 3

// Web encodes equipment QR codes as a link to its public detail page
// (".../equipment/{id}"); pull the id out of that path so we can hit the
// real scan endpoint (POST /equipment/{id}/scan) instead of guessing at it.
function extractEquipmentId(value: string): string | null {
  try {
    const url = new URL(value)
    const segments = url.pathname.split('/').filter(Boolean)
    const equipmentIdx = segments.findIndex((s) => s.toLowerCase() === 'equipment')
    if (equipmentIdx === -1 || equipmentIdx === segments.length - 1) return null
    return segments[equipmentIdx + 1]
  } catch {
    return null
  }
}

export default function ScanScreen() {
  const insets = useSafeAreaInsets()
  const [permission, requestPermission] = useCameraPermissions()
  const [scannedUrl, setScannedUrl] = useState<string | null>(null)
  const hasScanned = useRef(false)
  const scanMutation = useScanEquipmentQRCode()

  function handleBarcodeScanned({ data: value }: { data: string }) {
    if (hasScanned.current) return
    hasScanned.current = true
    setScannedUrl(value)

    const equipmentId = extractEquipmentId(value)
    if (!equipmentId) return

    scanMutation.mutate(equipmentId, {
      onSuccess: () => {
        router.replace({ pathname: '/(app)/(equipment)/[id]', params: { id: equipmentId } })
      },
      // On failure, fall through to the "Open Link" / "Scan Again" UI already showing.
    })
  }

  function handleScanAgain() {
    hasScanned.current = false
    setScannedUrl(null)
  }

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionRoot, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 12 }]}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
        <Ionicons name="camera-outline" size={56} color="#6B7280" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionBody}>
          Allow camera access to scan equipment QR codes
        </Text>
        {permission.canAskAgain ? (
          <Pressable onPress={requestPermission} style={styles.allowBtn}>
            <Text style={styles.allowBtnText}>Allow Camera</Text>
          </Pressable>
        ) : (
          <Text style={styles.permissionHint}>
            Enable camera access in your device Settings to use this feature.
          </Text>
        )}
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Camera preview */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scannedUrl ? undefined : handleBarcodeScanned}
      />

      {/* Overlay: 4 dark strips with a clear viewfinder window */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* Top dark strip */}
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.62)' }} pointerEvents="none" />

        {/* Middle row: left | clear viewfinder (with corners) | right */}
        <View style={{ flexDirection: 'row', height: VF }} pointerEvents="none">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.62)' }} />
          {/* Clear viewfinder — corner brackets live here */}
          <View style={{ width: VF, height: VF }}>
            <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER, borderTopLeftRadius: 8 }]} />
            <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER, borderTopRightRadius: 8 }]} />
            <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER, borderBottomLeftRadius: 8 }]} />
            <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER, borderBottomRightRadius: 8 }]} />
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.62)' }} />
        </View>

        {/* Bottom dark strip — status/result content */}
        <View style={[styles.bottomStrip, { paddingBottom: insets.bottom + 16 }]}>
          {!scannedUrl && (
            <Text style={styles.hintText}>Point your camera at an equipment QR code</Text>
          )}

          {scannedUrl && scanMutation.isPending && (
            <View style={styles.resultContainer}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.resultLabel}>Looking up equipment…</Text>
            </View>
          )}

          {scannedUrl && !scanMutation.isPending && (
            <View style={styles.resultContainer}>
              <View style={styles.resultIconRow}>
                <Ionicons name="checkmark-circle" size={20} color="#34D399" />
                <Text style={styles.resultLabel}>QR code scanned</Text>
              </View>
              <Text style={styles.resultUrl} numberOfLines={2}>{scannedUrl}</Text>
              <Pressable
                onPress={() => Linking.openURL(scannedUrl)}
                style={styles.openBtn}
              >
                <Ionicons name="open-outline" size={15} color="#FFFFFF" />
                <Text style={styles.openBtnText}>Open Link</Text>
              </Pressable>
              <Pressable onPress={handleScanAgain} style={styles.scanAgainBtn}>
                <Text style={styles.scanAgainText}>Scan Again</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Back button — always on top */}
      <Pressable
        onPress={() => router.back()}
        style={[styles.backBtn, { top: insets.top + 12 }]}
      >
        <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  permissionRoot: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  permissionBody: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  allowBtn: {
    backgroundColor: '#208AEF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  allowBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    padding: 4,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#208AEF',
  },
  bottomStrip: {
    flex: 1.4,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 28,
    gap: 12,
  },
  hintText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    textAlign: 'center',
  },
  resultContainer: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  resultIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultLabel: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '600',
  },
  resultUrl: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    textAlign: 'center',
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#208AEF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: '100%',
    justifyContent: 'center',
  },
  openBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scanAgainBtn: {
    paddingVertical: 8,
  },
  scanAgainText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
})
