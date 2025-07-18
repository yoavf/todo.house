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
        <Ionicons name="filter" size={20} color="#6c757d" />
        <Text style={styles.title}>Filters</Text>
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
                localFilters.time?.includes(option) && styles.filterChipActive,
              ]}
              onPress={() => toggleFilter('time', option)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  localFilters.time?.includes(option) &&
                    styles.filterChipTextActive,
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
                localFilters.room?.includes(option) && styles.filterChipActive,
              ]}
              onPress={() => toggleFilter('room', option)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  localFilters.room?.includes(option) &&
                    styles.filterChipTextActive,
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
                  styles.filterChipActive,
              ]}
              onPress={() => toggleFilter('effort', option)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  localFilters.effort?.includes(option) &&
                    styles.filterChipTextActive,
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
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  optionsRow: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterChipActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6c757d',
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: '500',
  },
})
