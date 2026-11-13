import { useEffect, useState } from 'react'
import { Animated } from 'react-native'

/**
 * Slide-up animation for bottom sheets: springs to 0 when visible,
 * slides back to `hiddenOffset` when hidden.
 */
export function useSheetSlide(visible: boolean, hiddenOffset: number) {
  const [slideAnim] = useState(() => new Animated.Value(hiddenOffset))

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
        toValue: hiddenOffset,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }, [visible, slideAnim, hiddenOffset])

  return slideAnim
}
