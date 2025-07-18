import { Ionicons } from '@expo/vector-icons'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { withLayoutContext } from 'expo-router'
import { useState } from 'react'
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { Navigator } = createMaterialTopTabNavigator()

const MaterialTopTabs = withLayoutContext(Navigator)

export default function TabsLayout() {
  const [viewMode, setViewMode] = useState<'large' | 'compact'>('compact')
  const [showFilters, setShowFilters] = useState(false)

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Home Tasks</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() =>
              setViewMode(viewMode === 'large' ? 'compact' : 'large')
            }
          >
            <Ionicons
              name={viewMode === 'large' ? 'grid' : 'list'}
              size={24}
              color="#2c3e50"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons
              name="filter"
              size={24}
              color={showFilters ? '#007bff' : '#2c3e50'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Swipe instructions */}
      <Text style={styles.swipeInstructions}>
        Swipe left to remove • Swipe right to snooze
      </Text>

      <MaterialTopTabs
        screenOptions={{
          viewMode,
          showFilters,
          tabBarActiveTintColor: '#007bff',
          tabBarInactiveTintColor: '#6c757d',
          tabBarLabelStyle: {
            fontSize: 16,
            fontWeight: '600',
            textTransform: 'none',
          },
          tabBarStyle: {
            backgroundColor: '#f8f9fa',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#e9ecef',
          },
          tabBarIndicatorStyle: {
            backgroundColor: '#007bff',
            height: 3,
          },
          swipeEnabled: true,
        }}
      >
        <MaterialTopTabs.Screen
          name="index"
          options={{
            title: 'Active',
            tabBarLabel: ({ focused, color }) => (
              <View style={styles.tabLabelContainer}>
                <Ionicons
                  name={focused ? 'list' : 'list-outline'}
                  size={20}
                  color={color}
                  style={styles.tabIcon}
                />
                <Text style={[styles.tabLabel, { color }]}>Active</Text>
              </View>
            ),
          }}
        />
        <MaterialTopTabs.Screen
          name="snoozed"
          options={{
            title: 'Snoozed',
            tabBarLabel: ({ focused, color }) => (
              <View style={styles.tabLabelContainer}>
                <Ionicons
                  name={focused ? 'time' : 'time-outline'}
                  size={20}
                  color={color}
                  style={styles.tabIcon}
                />
                <Text style={[styles.tabLabel, { color }]}>Snoozed</Text>
              </View>
            ),
          }}
        />
        <MaterialTopTabs.Screen
          name="future"
          options={{
            title: 'Future',
            tabBarLabel: ({ focused, color }) => (
              <View style={styles.tabLabelContainer}>
                <Ionicons
                  name={focused ? 'calendar' : 'calendar-outline'}
                  size={20}
                  color={color}
                  style={styles.tabIcon}
                />
                <Text style={[styles.tabLabel, { color }]}>Future</Text>
              </View>
            ),
          }}
        />
      </MaterialTopTabs>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    backgroundColor: '#e9ecef',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeInstructions: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  tabLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
})
