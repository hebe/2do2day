import { useRef, useState } from 'react'

export function useSwipeGesture({ 
  onSwipeLeft, 
  onSwipeRight,
  threshold = 50 // minimum distance for swipe
}) {
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = e.touches[0].clientX
    setIsSwiping(true)
  }

  const handleTouchMove = (e) => {
    if (!isSwiping) return
    touchEndX.current = e.touches[0].clientX
    const offset = touchEndX.current - touchStartX.current
    setSwipeOffset(offset)
  }

  const handleTouchEnd = () => {
    if (!isSwiping) return
    
    const swipeDistance = touchEndX.current - touchStartX.current
    const absDistance = Math.abs(swipeDistance)

    if (absDistance > threshold) {
      if (swipeDistance > 0) {
        // Swiped right
        onSwipeRight?.()
      } else {
        // Swiped left
        onSwipeLeft?.()
      }
    }

    // Reset
    setIsSwiping(false)
    setSwipeOffset(0)
    touchStartX.current = 0
    touchEndX.current = 0
  }

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    isSwiping,
    swipeOffset
  }
}

export default useSwipeGesture
