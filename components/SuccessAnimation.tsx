import { Ionicons } from '@expo/vector-icons'
import { useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'

interface SuccessAnimationProps {
  visible: boolean
  onComplete?: () => void
}

export function SuccessAnimation({
  visible,
  onComplete,
}: SuccessAnimationProps) {
  const [showIcon, setShowIcon] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (visible) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Show the icon immediately
      setShowIcon(true)

      // Hide after 1.5 seconds and call onComplete
      timeoutRef.current = setTimeout(() => {
        setShowIcon(false)
        if (onComplete) {
          onComplete()
        }
      }, 1500)
    } else {
      setShowIcon(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [visible, onComplete])

  if (!visible || !showIcon) return null

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#28a745" />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  iconContainer: {
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
})
