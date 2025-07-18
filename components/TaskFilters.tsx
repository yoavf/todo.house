import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export interface TaskFilters {
  time?: string[]
  room?: string[]
  effort?: string[]
}

interface TaskFiltersProps {
  visible: boolean
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
}

const TIME_OPTIONS = [
  '10-15 min',
  '15-20 min',
  '20-30 min',
  '45-60 min',
  '60-90 min',
  '90-120 min',
]

const ROOM_OPTIONS = [
  'Kitchen',
  'Bedroom',
  'Bathroom',
  'Living Room',
  'Office',
  'General',
]

const EFFORT_OPTIONS = ['Easy', 'Medium', 'Hard']

export function TaskFilters({
  visible,
  filters,
  onFiltersChange,
}: TaskFiltersProps) {
  const [localFilters, setLocalFilters] = useState<TaskFilters>(filters)

  const toggleFilter = (category: keyof TaskFilters, value: string) => {
    const currentValues = localFilters[category] || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value]

    const newFilters = {
      ...localFilters,
      [category]: newValues.length > 0 ? newValues : undefined,
    }

    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  if (!visible) return null

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="filter" size={16} color="#6b7280" />
          <Text style={styles.title}>Filters</Text>
        </View>
        {localFilters.time?.length ||
        localFilters.room?.length ||
        localFilters.effort?.length ? (
          <TouchableOpacity
            onPress={() => {
              setLocalFilters({})
              onFiltersChange({})
            }}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={16} color="#6b7280" />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Time filters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TIME</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.optionsRow}
        >
          {TIME_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.filterChip,
                localFilters.time?.includes(option) &&
                  styles.filterChipTimeActive,
              ]}
              onPress={() => toggleFilter('time', option)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  localFilters.time?.includes(option) &&
                    styles.filterChipTextTimeActive,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Room filters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ROOM</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.optionsRow}
        >
          {ROOM_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.filterChip,
                localFilters.room?.includes(option) &&
                  styles.filterChipRoomActive,
              ]}
              onPress={() => toggleFilter('room', option)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  localFilters.room?.includes(option) &&
                    styles.filterChipTextRoomActive,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Effort filters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EFFORT</Text>
        <View style={styles.optionsRow}>
          {EFFORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.filterChip,
                localFilters.effort?.includes(option) &&
                  (option === 'Easy'
                    ? styles.filterChipEasyActive
                    : option === 'Medium'
                      ? styles.filterChipMediumActive
                      : styles.filterChipHardActive),
              ]}
              onPress={() => toggleFilter('effort', option)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  localFilters.effort?.includes(option) &&
                    (option === 'Easy'
                      ? styles.filterChipTextEasyActive
                      : option === 'Medium'
                        ? styles.filterChipTextMediumActive
                        : styles.filterChipTextHardActive),
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearText: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  optionsRow: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipTimeActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  filterChipRoomActive: {
    backgroundColor: '#e9d5ff',
    borderColor: '#c084fc',
  },
  filterChipEasyActive: {
    backgroundColor: '#d1fae5',
    borderColor: '#6ee7b7',
  },
  filterChipMediumActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
  },
  filterChipHardActive: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  filterChipText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterChipTextTimeActive: {
    color: '#1e40af',
    fontWeight: '600',
  },
  filterChipTextRoomActive: {
    color: '#6b21a8',
    fontWeight: '600',
  },
  filterChipTextEasyActive: {
    color: '#047857',
    fontWeight: '600',
  },
  filterChipTextMediumActive: {
    color: '#92400e',
    fontWeight: '600',
  },
  filterChipTextHardActive: {
    color: '#991b1b',
    fontWeight: '600',
  },
})
