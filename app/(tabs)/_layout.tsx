import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../../store/taskStore';
import { useMemo } from 'react';

export default function TabsLayout() {
  const getActiveTasks = useTaskStore((state) => state.getActiveTasks);
  const getSnoozedTasks = useTaskStore((state) => state.getSnoozedTasks);
  
  const { pendingCount, snoozedCount } = useMemo(() => {
    const activeTasks = getActiveTasks();
    const snoozedTasks = getSnoozedTasks();
    
    return {
      pendingCount: activeTasks.filter(task => !task.completed).length,
      snoozedCount: snoozedTasks.length
    };
  }, [getActiveTasks, getSnoozedTasks]);

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
          tabBarBadge: snoozedCount > 0 ? snoozedCount : undefined,
        }}
      />
    </Tabs>
  );
}