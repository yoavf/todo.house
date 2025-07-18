import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore, getActiveTasks, getSnoozedTasks } from '../../store/taskStore';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const tasks = useTaskStore((state) => state.tasks);
  const insets = useSafeAreaInsets();
  
  const { pendingCount, snoozedCount } = useMemo(() => {
    const activeTasks = getActiveTasks(tasks);
    const snoozedTasks = getSnoozedTasks(tasks);
    return {
      pendingCount: activeTasks.filter(task => !task.completed).length,
      snoozedCount: snoozedTasks.length
    };
  }, [tasks]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: '#6c757d',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e9ecef',
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Active',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
        }}
      />
      <Tabs.Screen
        name="snoozed"
        options={{
          title: 'Snoozed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}