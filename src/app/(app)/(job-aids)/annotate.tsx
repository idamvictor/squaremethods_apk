import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Svg, { Ellipse, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg'
import { captureRef } from 'react-native-view-shot'
import { useUploadFile } from '@/services/job-aids/job-aids-queries'
import { useAnnotationStore } from '@/store/annotation-store'

// ─── Types ───────────────────────────────────────────────────────────────────

type Tool =
  | 'select'
  | 'draw'
  | 'rect'
  | 'rect-outline'
  | 'circle'
  | 'circle-outline'
  | 'triangle'
  | 'triangle-outline'
  | 'line'
  | 'arrow'
  | 'arrow-double'
  | 'text'

type PathAnnotation     = { type: 'path';         d: string; color: string; strokeWidth: number }
type RectAnnotation     = { type: 'rect';         x: number; y: number; w: number; h: number; filled: boolean; color: string; strokeWidth: number }
type CircleAnnotation   = { type: 'circle';       cx: number; cy: number; rx: number; ry: number; filled: boolean; color: string; strokeWidth: number }
type TriangleAnnotation = { type: 'triangle';     points: string; filled: boolean; color: string; strokeWidth: number }
type LineAnnotation     = { type: 'line';         x1: number; y1: number; x2: number; y2: number; color: string; strokeWidth: number }
type ArrowAnnotation    = { type: 'arrow';        x1: number; y1: number; x2: number; y2: number; color: string; strokeWidth: number }
type DblArrowAnnotation = { type: 'arrow-double'; x1: number; y1: number; x2: number; y2: number; color: string; strokeWidth: number }
type TextAnnotation     = { type: 'text';         x: number; y: number; text: string; color: string; fontSize: number }

type Annotation =
  | PathAnnotation | RectAnnotation | CircleAnnotation | TriangleAnnotation
  | LineAnnotation | ArrowAnnotation | DblArrowAnnotation | TextAnnotation

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = ['#000000', '#EF4444', '#3B82F6', '#F59E0B', '#22C55E', '#FFFFFF']
const WIDTHS = [2, 5, 10]
const TOOL_GROUPS: { label: string; tools: { id: Tool; icon: string; label: string }[] }[] = [
  {
    label: 'Action',
    tools: [
      { id: 'select', icon: 'hand-left-outline', label: 'Select' },
      { id: 'draw',   icon: 'pencil-outline',    label: 'Draw'   },
      { id: 'text',   icon: 'text',              label: 'Text'   },
    ],
  },
  {
    label: 'Filled',
    tools: [
      { id: 'rect',     icon: 'stop',     label: 'Rect'   },
      { id: 'circle',   icon: 'ellipse',  label: 'Circle' },
      { id: 'triangle', icon: 'triangle', label: 'Tri▲'   },
    ],
  },
  {
    label: 'Outline',
    tools: [
      { id: 'rect-outline',    icon: 'square-outline',   label: 'Rect○' },
      { id: 'circle-outline',  icon: 'ellipse-outline',  label: 'Circ○' },
      { id: 'triangle-outline',icon: 'triangle-outline', label: 'Tri△'  },
    ],
  },
  {
    label: 'Lines',
    tools: [
      { id: 'line',         icon: 'remove',          label: 'Line'  },
      { id: 'arrow',        icon: 'arrow-forward',   label: 'Arrow' },
      { id: 'arrow-double', icon: 'swap-horizontal', label: '↔ Arr' },
    ],
  },
]

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function buildArrowPath(x1: number, y1: number, x2: number, y2: number, double: boolean): string {
  const fmt = (n: number) => n.toFixed(1)
  const theta = Math.atan2(y2 - y1, x2 - x1)
  const len = Math.hypot(x2 - x1, y2 - y1)
  const headLen = Math.min(20, Math.max(8, len * 0.25))
  const a = Math.PI / 6
  let d = `M ${fmt(x1)} ${fmt(y1)} L ${fmt(x2)} ${fmt(y2)}`
  d += ` M ${fmt(x2 - headLen * Math.cos(theta - a))} ${fmt(y2 - headLen * Math.sin(theta - a))}`
  d += ` L ${fmt(x2)} ${fmt(y2)}`
  d += ` L ${fmt(x2 - headLen * Math.cos(theta + a))} ${fmt(y2 - headLen * Math.sin(theta + a))}`
  if (double) {
    const ts = theta + Math.PI
    d += ` M ${fmt(x1 - headLen * Math.cos(ts - a))} ${fmt(y1 - headLen * Math.sin(ts - a))}`
    d += ` L ${fmt(x1)} ${fmt(y1)}`
    d += ` L ${fmt(x1 - headLen * Math.cos(ts + a))} ${fmt(y1 - headLen * Math.sin(ts + a))}`
  }
  return d
}

function buildShapeAnnotation(
  tool: Tool, x1: number, y1: number, x2: number, y2: number,
  color: string, strokeWidth: number,
): Annotation | null {
  switch (tool) {
    case 'rect':
    case 'rect-outline':
      return { type: 'rect', x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), filled: tool === 'rect', color, strokeWidth }
    case 'circle':
    case 'circle-outline':
      return { type: 'circle', cx: (x1 + x2) / 2, cy: (y1 + y2) / 2, rx: Math.abs(x2 - x1) / 2, ry: Math.abs(y2 - y1) / 2, filled: tool === 'circle', color, strokeWidth }
    case 'triangle':
    case 'triangle-outline': {
      const mx = (x1 + x2) / 2
      const top = Math.min(y1, y2), bot = Math.max(y1, y2)
      const left = Math.min(x1, x2), right = Math.max(x1, x2)
      return { type: 'triangle', points: `${mx.toFixed(1)},${top.toFixed(1)} ${left.toFixed(1)},${bot.toFixed(1)} ${right.toFixed(1)},${bot.toFixed(1)}`, filled: tool === 'triangle', color, strokeWidth }
    }
    case 'line':         return { type: 'line',         x1, y1, x2, y2, color, strokeWidth }
    case 'arrow':        return { type: 'arrow',        x1, y1, x2, y2, color, strokeWidth }
    case 'arrow-double': return { type: 'arrow-double', x1, y1, x2, y2, color, strokeWidth }
    default:             return null
  }
}

function getBoundingBox(a: Annotation): { x: number; y: number; w: number; h: number } {
  switch (a.type) {
    case 'path': {
      const nums = a.d.match(/-?\d+\.?\d*/g)?.map(Number) ?? []
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (let i = 0; i + 1 < nums.length; i += 2) {
        minX = Math.min(minX, nums[i]);   maxX = Math.max(maxX, nums[i])
        minY = Math.min(minY, nums[i+1]); maxY = Math.max(maxY, nums[i+1])
      }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
    }
    case 'rect':
      return { x: a.x, y: a.y, w: a.w, h: a.h }
    case 'circle':
      return { x: a.cx - a.rx, y: a.cy - a.ry, w: a.rx * 2, h: a.ry * 2 }
    case 'triangle': {
      const pairs = a.points.split(' ').map((p) => p.split(',').map(Number))
      const xs = pairs.map((p) => p[0])
      const ys = pairs.map((p) => p[1])
      const minX = Math.min(...xs), maxX = Math.max(...xs)
      const minY = Math.min(...ys), maxY = Math.max(...ys)
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
    }
    case 'line':
    case 'arrow':
    case 'arrow-double': {
      const pad = 20
      return {
        x: Math.min(a.x1, a.x2) - pad,
        y: Math.min(a.y1, a.y2) - pad,
        w: Math.abs(a.x2 - a.x1) + pad * 2,
        h: Math.abs(a.y2 - a.y1) + pad * 2,
      }
    }
    case 'text':
      return { x: a.x, y: a.y - a.fontSize, w: a.text.length * a.fontSize * 0.55, h: a.fontSize * 1.4 }
  }
}

function hitTest(a: Annotation, tx: number, ty: number, tol = 14): boolean {
  const bb = getBoundingBox(a)
  return tx >= bb.x - tol && tx <= bb.x + bb.w + tol &&
         ty >= bb.y - tol && ty <= bb.y + bb.h + tol
}

function shiftPath(d: string, dx: number, dy: number): string {
  let i = 0
  return d.replace(/-?\d+\.?\d*/g, (num) => {
    const shifted = parseFloat(num) + (i % 2 === 0 ? dx : dy)
    i++
    return shifted.toFixed(1)
  })
}

function shiftPoints(points: string, dx: number, dy: number): string {
  return points.split(' ').map((p) => {
    const [x, y] = p.split(',').map(Number)
    return `${(x + dx).toFixed(1)},${(y + dy).toFixed(1)}`
  }).join(' ')
}

function applyOffset(a: Annotation, dx: number, dy: number): Annotation {
  switch (a.type) {
    case 'path':         return { ...a, d: shiftPath(a.d, dx, dy) }
    case 'rect':         return { ...a, x: a.x + dx, y: a.y + dy }
    case 'circle':       return { ...a, cx: a.cx + dx, cy: a.cy + dy }
    case 'triangle':     return { ...a, points: shiftPoints(a.points, dx, dy) }
    case 'line':         return { ...a, x1: a.x1 + dx, y1: a.y1 + dy, x2: a.x2 + dx, y2: a.y2 + dy }
    case 'arrow':        return { ...a, x1: a.x1 + dx, y1: a.y1 + dy, x2: a.x2 + dx, y2: a.y2 + dy }
    case 'arrow-double': return { ...a, x1: a.x1 + dx, y1: a.y1 + dy, x2: a.x2 + dx, y2: a.y2 + dy }
    case 'text':         return { ...a, x: a.x + dx, y: a.y + dy }
  }
}

function updateAnnotationColor(a: Annotation, c: string): Annotation {
  return { ...a, color: c }
}

function updateAnnotationWidth(a: Annotation, w: number): Annotation {
  if (a.type === 'text') return a
  return { ...a, strokeWidth: w }
}

function renderAnnotation(a: Annotation, key: number | string) {
  switch (a.type) {
    case 'path':
      return <Path key={key} d={a.d} stroke={a.color} strokeWidth={a.strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    case 'rect':
      return <Rect key={key} x={a.x} y={a.y} width={a.w} height={a.h} fill={a.filled ? a.color : 'none'} stroke={a.filled ? 'none' : a.color} strokeWidth={a.strokeWidth} />
    case 'circle':
      return <Ellipse key={key} cx={a.cx} cy={a.cy} rx={a.rx} ry={a.ry} fill={a.filled ? a.color : 'none'} stroke={a.filled ? 'none' : a.color} strokeWidth={a.strokeWidth} />
    case 'triangle':
      return <Polygon key={key} points={a.points} fill={a.filled ? a.color : 'none'} stroke={a.filled ? 'none' : a.color} strokeWidth={a.strokeWidth} strokeLinejoin="round" />
    case 'line':
      return <Line key={key} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke={a.color} strokeWidth={a.strokeWidth} strokeLinecap="round" />
    case 'arrow':
    case 'arrow-double':
      return <Path key={key} d={buildArrowPath(a.x1, a.y1, a.x2, a.y2, a.type === 'arrow-double')} stroke={a.color} strokeWidth={a.strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    case 'text':
      return <SvgText key={key} x={a.x} y={a.y} fill={a.color} fontSize={a.fontSize} fontWeight="500">{a.text}</SvgText>
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnnotateScreen() {
  const insets = useSafeAreaInsets()
  const { imageUrl } = useLocalSearchParams<{ imageUrl: string }>()
  const { mutate: upload } = useUploadFile()
  const setPendingAnnotatedImage = useAnnotationStore((s) => s.setPendingAnnotatedImage)

  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [redoStack, setRedoStack] = useState<Annotation[]>([])
  const [tool, setTool] = useState<Tool>('draw')
  const [color, setColor] = useState('#EF4444')
  const [strokeWidth, setStrokeWidth] = useState(5)
  const [isSaving, setIsSaving] = useState(false)
  const [imageReady, setImageReady] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [textModal, setTextModal] = useState<{ x: number; y: number } | null>(null)
  const [textInput, setTextInput] = useState('')
  const [fontSize, setFontSize] = useState(28)
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [openControl, setOpenControl] = useState<'color' | 'size' | null>(null)
  const [, setTick] = useState(0)

  const drawingRef = useRef<View>(null)
  const toolRef = useRef<Tool>('draw')
  const startRef = useRef({ x: 0, y: 0 })
  const currentRef = useRef<Annotation | null>(null)
  const colorRef = useRef(color)
  const strokeWidthRef = useRef(strokeWidth)

  // Selection / move refs
  const annotationsRef = useRef<Annotation[]>([])
  const draggedIndexRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const liveOffsetRef = useRef({ dx: 0, dy: 0 })

  // Keep annotationsRef in sync on every render
  annotationsRef.current = annotations

  const forceUpdate = useCallback(() => setTick((t) => t + 1), [])

  function selectTool(t: Tool) {
    setTool(t)
    toolRef.current = t
    if (t !== 'select') setSelectedIndex(null)
    setOpenGroup(null)
  }

  function selectColor(c: string) {
    setColor(c)
    colorRef.current = c
    if (selectedIndex != null) {
      setAnnotations((prev) => prev.map((a, i) => (i === selectedIndex ? updateAnnotationColor(a, c) : a)))
    }
  }

  function selectWidth(w: number) {
    setStrokeWidth(w)
    strokeWidthRef.current = w
    if (selectedIndex != null) {
      setAnnotations((prev) => prev.map((a, i) => (i === selectedIndex ? updateAnnotationWidth(a, w) : a)))
    }
  }

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .runOnJS(true)
        .onBegin((e) => {
          startRef.current = { x: e.x, y: e.y }

          // ── Select mode ──
          if (toolRef.current === 'select') {
            let hit: number | null = null
            const anns = annotationsRef.current
            for (let i = anns.length - 1; i >= 0; i--) {
              if (hitTest(anns[i], e.x, e.y)) { hit = i; break }
            }
            draggedIndexRef.current = hit
            isDraggingRef.current = false
            dragStartRef.current = { x: e.x, y: e.y }
            liveOffsetRef.current = { dx: 0, dy: 0 }
            setSelectedIndex(hit)
            forceUpdate()
            return
          }

          // ── Drawing modes ── (deselect when starting a draw)
          setSelectedIndex(null)

          if (toolRef.current === 'text') {
            currentRef.current = null
          } else if (toolRef.current === 'draw') {
            currentRef.current = {
              type: 'path',
              d: `M ${e.x.toFixed(1)} ${e.y.toFixed(1)}`,
              color: colorRef.current,
              strokeWidth: strokeWidthRef.current,
            }
          } else {
            currentRef.current = buildShapeAnnotation(
              toolRef.current, e.x, e.y, e.x, e.y,
              colorRef.current, strokeWidthRef.current,
            )
          }
          forceUpdate()
        })
        .onUpdate((e) => {
          // ── Select mode ──
          if (toolRef.current === 'select') {
            if (draggedIndexRef.current != null) {
              const dx = e.x - dragStartRef.current.x
              const dy = e.y - dragStartRef.current.y
              liveOffsetRef.current = { dx, dy }
              if (Math.abs(dx) > 5 || Math.abs(dy) > 5) isDraggingRef.current = true
              forceUpdate()
            }
            return
          }

          // ── Drawing modes ──
          if (toolRef.current === 'draw') {
            const p = currentRef.current
            if (p?.type === 'path') p.d += ` L ${e.x.toFixed(1)} ${e.y.toFixed(1)}`
          } else if (toolRef.current !== 'text') {
            currentRef.current = buildShapeAnnotation(
              toolRef.current,
              startRef.current.x, startRef.current.y,
              e.x, e.y,
              colorRef.current, strokeWidthRef.current,
            )
          }
          forceUpdate()
        })
        .onEnd((e) => {
          // ── Select mode ──
          if (toolRef.current === 'select') {
            if (draggedIndexRef.current != null) {
              if (isDraggingRef.current) {
                const { dx, dy } = liveOffsetRef.current
                const idx = draggedIndexRef.current
                setAnnotations((prev) =>
                  prev.map((a, i) => (i === idx ? applyOffset(a, dx, dy) : a)),
                )
                liveOffsetRef.current = { dx: 0, dy: 0 }
              } else {
                // Tap with no drag → edit text if text annotation
                const a = annotationsRef.current[draggedIndexRef.current]
                if (a?.type === 'text') {
                  const idx = draggedIndexRef.current
                  setEditingIndex(idx)
                  setTextInput(a.text)
                  setFontSize(a.fontSize)
                  setTextModal({ x: a.x, y: a.y })
                }
              }
            }
            isDraggingRef.current = false
            forceUpdate()
            return
          }

          // ── Drawing modes ──
          if (toolRef.current === 'text') {
            const dx = Math.abs(e.x - startRef.current.x)
            const dy = Math.abs(e.y - startRef.current.y)
            if (dx < 10 && dy < 10) {
              setEditingIndex(null)
              setTextInput('')
              setTextModal({ x: startRef.current.x, y: startRef.current.y })
            }
          } else if (currentRef.current) {
            const snapshot = currentRef.current
            setAnnotations((prev) => [...prev, snapshot])
            setRedoStack([])
            currentRef.current = null
          }
          forceUpdate()
        }),
    [forceUpdate],
  )

  function handleUndo() {
    if (annotations.length === 0) return
    if (selectedIndex != null) setSelectedIndex(null)
    const last = annotations[annotations.length - 1]
    setRedoStack((prev) => [...prev, last])
    setAnnotations((prev) => prev.slice(0, -1))
  }

  function handleRedo() {
    if (redoStack.length === 0) return
    const top = redoStack[redoStack.length - 1]
    setRedoStack((prev) => prev.slice(0, -1))
    setAnnotations((prev) => [...prev, top])
  }

  function handleClear() {
    setAnnotations([])
    setRedoStack([])
    setSelectedIndex(null)
    currentRef.current = null
    forceUpdate()
  }

  function handleDeleteSelected() {
    if (selectedIndex == null) return
    const idx = selectedIndex
    setSelectedIndex(null)
    setRedoStack([])
    setAnnotations((prev) => prev.filter((_, i) => i !== idx))
  }

  function openEditTextModal() {
    if (selectedIndex == null) return
    const a = annotations[selectedIndex]
    if (a?.type !== 'text') return
    setEditingIndex(selectedIndex)
    setTextInput(a.text)
    setFontSize(a.fontSize)
    setTextModal({ x: a.x, y: a.y })
  }

  function placeText() {
    if (!textInput.trim() || !textModal) return
    const newA: TextAnnotation = {
      type: 'text',
      x: textModal.x,
      y: textModal.y,
      text: textInput.trim(),
      color,
      fontSize,
    }
    if (editingIndex != null) {
      const idx = editingIndex
      setAnnotations((prev) => prev.map((a, i) => (i === idx ? newA : a)))
      setEditingIndex(null)
    } else {
      setAnnotations((prev) => [...prev, newA])
      setRedoStack([])
    }
    setTextModal(null)
    setTextInput('')
  }

  function cancelTextModal() {
    setTextModal(null)
    setTextInput('')
    setEditingIndex(null)
  }

  async function handleDone() {
    if (!drawingRef.current) return
    setIsSaving(true)
    try {
      const localUri = await captureRef(drawingRef, { format: 'png', quality: 0.92 })
      upload(
        { uri: localUri, folder: 'job-aids' },
        {
          onSuccess: (url) => {
            setPendingAnnotatedImage(url)
            router.back()
          },
          onError: () => {
            setIsSaving(false)
            Alert.alert('Upload failed', 'Could not upload the annotated image. Please try again.')
          },
        },
      )
    } catch {
      setIsSaving(false)
      Alert.alert('Capture failed', 'Could not capture the drawing. Please try again.')
    }
  }

  const hasAnnotations = annotations.length > 0
  const hasRedo = redoStack.length > 0
  const selectedAnnotation = selectedIndex != null ? annotations[selectedIndex] : null

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top, backgroundColor: '#030712', borderBottomWidth: 1, borderBottomColor: '#1F2937' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} disabled={isSaving} style={{ width: 40 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Annotate Image</Text>
          <Pressable onPress={handleDone} disabled={isSaving || !imageReady} style={{ width: 56, alignItems: 'flex-end' }}>
            {isSaving ? (
              <ActivityIndicator color="#60A5FA" size="small" />
            ) : (
              <Text style={{ fontSize: 15, fontWeight: '600', color: imageReady ? '#60A5FA' : '#374151' }}>Done</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* Drawing area */}
      <GestureDetector gesture={panGesture}>
        <View ref={drawingRef} style={{ flex: 1, backgroundColor: '#111' }}>
          <Image
            source={{ uri: imageUrl }}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            contentFit="contain"
            onLoad={() => setImageReady(true)}
          />
          <Svg style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
            {annotations.map((a, i) => {
              if (i === selectedIndex) {
                const { dx, dy } = liveOffsetRef.current
                return (
                  <G key={i} transform={dx || dy ? `translate(${dx}, ${dy})` : undefined}>
                    {renderAnnotation(a, `sel-${i}`)}
                  </G>
                )
              }
              return renderAnnotation(a, i)
            })}

            {/* Selection indicator */}
            {selectedAnnotation != null && selectedIndex != null && (() => {
              const { dx, dy } = liveOffsetRef.current
              const bb = getBoundingBox(selectedAnnotation)
              const pad = 8
              return (
                <Rect
                  x={bb.x - pad + dx}
                  y={bb.y - pad + dy}
                  width={bb.w + pad * 2}
                  height={bb.h + pad * 2}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  rx={5}
                />
              )
            })()}

            {/* In-progress annotation preview */}
            {currentRef.current ? renderAnnotation(currentRef.current, 'preview') : null}
          </Svg>
        </View>
      </GestureDetector>

      {/* Selection action bar */}
      {selectedAnnotation != null && (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderTopWidth: 1, borderTopColor: '#1F2937', paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
          <Text style={{ flex: 1, fontSize: 12, color: '#6B7280' }}>1 selected</Text>

          {selectedAnnotation.type === 'text' && (
            <Pressable
              onPress={openEditTextModal}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1E3A5F' }}
            >
              <Ionicons name="create-outline" size={14} color="#60A5FA" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#60A5FA' }}>Edit</Text>
            </Pressable>
          )}

          <Pressable
            onPress={handleDeleteSelected}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#3B1010' }}
          >
            <Ionicons name="trash-outline" size={14} color="#EF4444" />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#EF4444' }}>Delete</Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedIndex(null)}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#374151' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#9CA3AF' }}>Done</Text>
          </Pressable>
        </View>
      )}

      {/* Toolbar */}
      <View style={{ paddingBottom: insets.bottom + 6, backgroundColor: '#030712', borderTopWidth: 1, borderTopColor: '#1F2937' }}>
        {/* Expanded tools panel — shown when a group is open */}
        {openGroup != null && (() => {
          const group = TOOL_GROUPS.find((g) => g.label === openGroup)
          if (!group) return null
          return (
            <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#1F2937', backgroundColor: '#0D1117' }}>
              {group.tools.map((t) => {
                const isActive = tool === t.id
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => selectTool(t.id)}
                    style={{
                      flex: 1, alignItems: 'center', gap: 3, paddingVertical: 8, borderRadius: 10,
                      backgroundColor: isActive ? '#1D4ED8' : 'transparent',
                      borderWidth: 1, borderColor: isActive ? '#3B82F6' : '#374151',
                    }}
                  >
                    <Ionicons name={t.icon as any} size={18} color={isActive ? '#fff' : '#9CA3AF'} />
                    <Text style={{ fontSize: 9, color: isActive ? '#fff' : '#6B7280', fontWeight: '500' }}>{t.label}</Text>
                  </Pressable>
                )
              })}
            </View>
          )
        })()}

        {/* Group trigger buttons — always visible */}
        <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 }}>
          {TOOL_GROUPS.map((group) => {
            const activeTool = group.tools.find((t) => t.id === tool)
            const groupIsActive = !!activeTool
            const isOpen = openGroup === group.label
            const displayTool = activeTool ?? group.tools[0]
            return (
              <Pressable
                key={group.label}
                onPress={() => setOpenGroup(isOpen ? null : group.label)}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 4, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
                  backgroundColor: groupIsActive ? '#1E3A5F' : isOpen ? '#1F2937' : 'transparent',
                  borderColor: groupIsActive ? '#3B82F6' : isOpen ? '#6B7280' : '#374151',
                }}
              >
                <Ionicons
                  name={displayTool.icon as any}
                  size={15}
                  color={groupIsActive ? '#60A5FA' : '#9CA3AF'}
                />
                <Text style={{ fontSize: 10, fontWeight: '600', color: groupIsActive ? '#60A5FA' : '#9CA3AF' }}>
                  {activeTool ? activeTool.label : group.label}
                </Text>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={11}
                  color={groupIsActive ? '#60A5FA' : '#6B7280'}
                />
              </Pressable>
            )
          })}
        </View>

        {/* Expanded color panel */}
        {openControl === 'color' && (
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1F2937', backgroundColor: '#0D1117' }}>
            {COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => { selectColor(c); setOpenControl(null) }}
                style={{
                  flex: 1, height: 34, borderRadius: 8, backgroundColor: c,
                  borderWidth: color === c ? 3 : 1.5,
                  borderColor: color === c ? '#60A5FA' : '#4B5563',
                }}
              />
            ))}
          </View>
        )}

        {/* Expanded size panel */}
        {openControl === 'size' && (
          <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#1F2937', backgroundColor: '#0D1117' }}>
            {WIDTHS.map((w) => {
              const isActive = strokeWidth === w
              const label = w === 2 ? 'Thin' : w === 5 ? 'Medium' : 'Thick'
              return (
                <Pressable
                  key={w}
                  onPress={() => { selectWidth(w); setOpenControl(null) }}
                  style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: isActive ? '#3B82F6' : 'transparent', backgroundColor: isActive ? '#1E3A5F' : 'transparent' }}
                >
                  <View style={{
                    width: Math.min(w * 5, 30), height: Math.min(w * 5, 30),
                    borderRadius: Math.min(w * 5, 30) / 2,
                    backgroundColor: isActive ? '#60A5FA' : '#6B7280',
                  }} />
                  <Text style={{ fontSize: 9, fontWeight: '600', color: isActive ? '#60A5FA' : '#6B7280' }}>{label}</Text>
                </Pressable>
              )
            })}
          </View>
        )}

        {/* Controls row: Color trigger | Size trigger | spacer | Undo | Clear */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 4, gap: 6 }}>
          {/* Color trigger */}
          <Pressable
            onPress={() => setOpenControl(openControl === 'color' ? null : 'color')}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7,
              borderRadius: 10, borderWidth: 1,
              borderColor: openControl === 'color' ? '#6B7280' : '#374151',
              backgroundColor: openControl === 'color' ? '#1F2937' : 'transparent',
            }}
          >
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: color, borderWidth: 1.5, borderColor: '#4B5563' }} />
            <Text style={{ fontSize: 10, fontWeight: '600', color: '#9CA3AF' }}>Color</Text>
            <Ionicons name={openControl === 'color' ? 'chevron-up' : 'chevron-down'} size={11} color="#6B7280" />
          </Pressable>

          {/* Size trigger */}
          <Pressable
            onPress={() => setOpenControl(openControl === 'size' ? null : 'size')}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7,
              borderRadius: 10, borderWidth: 1,
              borderColor: openControl === 'size' ? '#6B7280' : '#374151',
              backgroundColor: openControl === 'size' ? '#1F2937' : 'transparent',
            }}
          >
            <View style={{
              width: Math.min(strokeWidth * 3, 16), height: Math.min(strokeWidth * 3, 16),
              borderRadius: Math.min(strokeWidth * 3, 16) / 2,
              backgroundColor: '#60A5FA',
            }} />
            <Text style={{ fontSize: 10, fontWeight: '600', color: '#9CA3AF' }}>Size</Text>
            <Ionicons name={openControl === 'size' ? 'chevron-up' : 'chevron-down'} size={11} color="#6B7280" />
          </Pressable>

          <View style={{ flex: 1 }} />

          <View style={{ width: 1, height: 20, backgroundColor: '#374151', marginHorizontal: 2 }} />

          <Pressable
            onPress={handleUndo}
            disabled={!hasAnnotations}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: '#1F2937', opacity: hasAnnotations ? 1 : 0.35 }}
          >
            <Ionicons name="arrow-undo" size={16} color="#D1D5DB" />
          </Pressable>

          <Pressable
            onPress={handleRedo}
            disabled={!hasRedo}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: '#1F2937', opacity: hasRedo ? 1 : 0.35 }}
          >
            <Ionicons name="arrow-redo" size={16} color="#D1D5DB" />
          </Pressable>

          <Pressable
            onPress={handleClear}
            disabled={!hasAnnotations}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: '#1F2937', opacity: hasAnnotations ? 1 : 0.35 }}
          >
            <Ionicons name="trash-outline" size={13} color="#D1D5DB" />
            <Text style={{ fontSize: 10, color: '#D1D5DB', fontWeight: '500' }}>Clear</Text>
          </Pressable>
        </View>
      </View>

      {/* Text modal (add new or edit existing) */}
      <Modal visible={!!textModal} transparent animationType="fade" onRequestClose={cancelTextModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', paddingHorizontal: 24 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                {editingIndex != null ? 'Edit Text' : 'Add Text'}
              </Text>

              <TextInput
                value={textInput}
                onChangeText={setTextInput}
                placeholder="Type your annotation…"
                multiline
                autoFocus
                placeholderTextColor="#9CA3AF"
                style={{
                  borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
                  paddingHorizontal: 12, paddingVertical: 10,
                  fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB',
                  minHeight: 72, textAlignVertical: 'top',
                }}
              />

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>Size:</Text>
                {([18, 28, 40] as const).map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setFontSize(s)}
                    style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: fontSize === s ? '#1D4ED8' : '#F3F4F6' }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: fontSize === s ? '#fff' : '#4B5563' }}>
                      {s === 18 ? 'S' : s === 28 ? 'M' : 'L'}
                    </Text>
                  </Pressable>
                ))}
                <View style={{ marginLeft: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: color, borderWidth: 1.5, borderColor: '#D1D5DB' }} />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={cancelTextModal}
                  style={{ flex: 1, height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={placeText}
                  style={{ flex: 1, height: 44, backgroundColor: '#1D4ED8', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                    {editingIndex != null ? 'Update' : 'Place'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}
