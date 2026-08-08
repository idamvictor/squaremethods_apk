import { useRef, useState } from 'react'
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { DayCell } from '@/hooks/use-contribution-weeks'

const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const MONTH_ROW_HEIGHT = 14
const FADE_WIDTH = 26

const LEVEL_CLASSES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-gray-100',
  1: 'bg-blue-100',
  2: 'bg-blue-300',
  3: 'bg-blue-500',
  4: 'bg-blue-700',
}

// Opacity from the outer edge inward, i.e. near-opaque at the very edge fading to transparent toward the content.
const FADE_OPACITIES = [0.95, 0.78, 0.55, 0.32, 0.15, 0.0]

function levelForCount(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 5) return 3
  return 4
}

function EdgeFade({ side }: { side: 'left' | 'right' }) {
  const isLeft = side === 'left'
  const opacities = isLeft ? FADE_OPACITIES : [...FADE_OPACITIES].reverse()
  return (
    <View
      pointerEvents="none"
      style={
        isLeft
          ? { position: 'absolute', left: 0, top: MONTH_ROW_HEIGHT, bottom: 0, width: FADE_WIDTH, flexDirection: 'row' }
          : { position: 'absolute', right: 0, top: MONTH_ROW_HEIGHT, bottom: 0, width: FADE_WIDTH, flexDirection: 'row' }
      }
    >
      {opacities.map((opacity, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: `rgba(255,255,255,${opacity})` }} />
      ))}
      <View style={isLeft ? { position: 'absolute', left: 1, top: '50%', marginTop: -8 } : { position: 'absolute', right: 1, top: '50%', marginTop: -8 }}>
        <Ionicons name={isLeft ? 'chevron-back' : 'chevron-forward'} size={14} color="#9CA3AF" />
      </View>
    </View>
  )
}

interface ContributionHeatmapGridProps {
  weeks: DayCell[][]
  monthLabels: string[]
  cellSize: number
  gap: number
  onDayPress: (day: DayCell) => void
}

export function ContributionHeatmapGrid({
  weeks,
  monthLabels,
  cellSize,
  gap,
  onDayPress,
}: ContributionHeatmapGridProps) {
  const scrollRef = useRef<ScrollView>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [contentWidth, setContentWidth] = useState(0)
  // Assume landed at the end, matching the initial scrollToEnd() below, so no flash of the wrong arrow on mount.
  const [atStart, setAtStart] = useState(false)
  const [atEnd, setAtEnd] = useState(true)

  const canScroll = contentWidth > containerWidth + 1
  const maxScroll = Math.max(0, contentWidth - containerWidth)

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = e.nativeEvent.contentOffset.x
    setAtStart(x <= 2)
    setAtEnd(x >= maxScroll - 2)
  }

  return (
    <View>
      <View className="flex-row">
        {/* Static weekday labels — never scrolls */}
        <View style={{ marginRight: 4, marginTop: MONTH_ROW_HEIGHT }}>
          {WEEKDAY_LABELS.map((label, i) => (
            <Text
              key={i}
              className="text-[10px] text-gray-400"
              style={{ height: cellSize, width: cellSize + 8, marginBottom: gap }}
            >
              {label}
            </Text>
          ))}
        </View>

        {/* Scrollable month labels + grid */}
        <View style={{ flex: 1 }} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={(w) => {
              setContentWidth(w)
              scrollRef.current?.scrollToEnd({ animated: false })
            }}
          >
            <View>
              {/* Month labels */}
              <View style={{ height: MONTH_ROW_HEIGHT }}>
                {monthLabels.map((label, i) =>
                  label ? (
                    <Text
                      key={i}
                      numberOfLines={1}
                      className="text-[10px] text-gray-400"
                      style={{ position: 'absolute', left: i * (cellSize + gap), top: 0 }}
                    >
                      {label}
                    </Text>
                  ) : null,
                )}
              </View>

              {/* Grid */}
              <View className="flex-row">
                {weeks.map((week, wi) => (
                  <View key={wi} style={{ marginRight: gap }}>
                    {week.map((day) => {
                      const clickable = day.count > 0 && !day.isOutOfRange
                      return (
                        <Pressable
                          key={day.key}
                          onPress={clickable ? () => onDayPress(day) : undefined}
                          hitSlop={2}
                          className={`rounded-[2px] ${
                            day.isOutOfRange ? 'bg-transparent' : LEVEL_CLASSES[levelForCount(day.count)]
                          } ${clickable ? 'active:opacity-60' : ''}`}
                          style={{ width: cellSize, height: cellSize, marginBottom: gap }}
                        />
                      )
                    })}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {canScroll && !atStart && <EdgeFade side="left" />}
          {canScroll && !atEnd && <EdgeFade side="right" />}
        </View>
      </View>

      {/* Static legend — never scrolls */}
      <View className="flex-row items-center justify-end gap-x-1 mt-2">
        <Text className="text-[10px] text-gray-400 mr-0.5">Less</Text>
        {([0, 1, 2, 3, 4] as const).map((l) => (
          <View
            key={l}
            className={`rounded-[2px] ${LEVEL_CLASSES[l]}`}
            style={{ width: cellSize, height: cellSize }}
          />
        ))}
        <Text className="text-[10px] text-gray-400 ml-0.5">More</Text>
      </View>
    </View>
  )
}
