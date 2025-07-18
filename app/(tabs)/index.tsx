import { useRoute } from '@react-navigation/native'
import { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { FAB } from '../../components'
import {
  TaskFilters,
  type TaskFilters as TaskFiltersType,
} from '../../components/TaskFilters'
import { TaskListFiltered } from '../../components/TaskListFiltered'
import { getActiveTasks, useTaskStore } from '../../store/taskStore'

export default function ActiveTasksScreen() {
  const tasks = useTaskStore((state) => state.tasks)
  const route = useRoute<{
    params?: { viewMode?: 'large' | 'compact'; showFilters?: boolean }
  }>()
  const viewMode = route.params?.viewMode || 'compact'
  const showFilters = route.params?.showFilters || false
  const [filters, setFilters] = useState<TaskFiltersType>({})

  const sortedTasks = useMemo(() => getActiveTasks(tasks), [tasks])

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Filters */}
        <TaskFilters
          visible={showFilters}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Task List */}
        <TaskListFiltered
          tasks={sortedTasks}
          viewMode={viewMode}
          filters={filters}
        />
      </View>

      {/* Floating Action Button */}
      <FAB />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
})
