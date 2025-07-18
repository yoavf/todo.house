import { Ionicons } from '@expo/vector-icons'
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import type React from 'react'
import { useCallback, useMemo } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTaskStore } from '../store/taskStore'
import type { SnoozeDuration } from '../types/Task'
import { getSnoozeOptions } from '../utils/dateUtils'
import { getCurrentLocale } from '../utils/localeUtils'

interface SnoozeActionSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>
  taskId: string
  onClose: () => void
}

export const SnoozeActionSheet: React.FC<SnoozeActionSheetProps> = ({
  bottomSheetRef,
  taskId,
  onClose,
}) => {
  const { snoozeTask } = useTaskStore()

  const snoozeOptions = useMemo(() => {
    const locale = getCurrentLocale()
    return getSnoozeOptions(locale)
  }, [])

  const handleSnooze = useCallback(
    (duration: SnoozeDuration) => {
      try {
        snoozeTask(taskId, duration)
        onClose()
      } catch {
        Alert.alert('Error', 'Failed to snooze task')
      }
    },
    [snoozeTask, taskId, onClose],
  )

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={['60%']}
      onDismiss={onClose}
      backgroundStyle={styles.bottomSheet}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Snooze Task</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6c757d" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Choose when to be reminded about this task
        </Text>

        <View style={styles.optionsContainer}>
          {snoozeOptions.map((option) => (
            <TouchableOpacity
              key={option.duration}
              style={styles.option}
              onPress={() => handleSnooze(option.duration)}
            >
              <View style={styles.optionIcon}>
                <Ionicons
                  name={option.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color="#007bff"
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDescription}>
                  {option.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6c757d',
  },
})
