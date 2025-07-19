import { Ionicons } from '@expo/vector-icons'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { withLayoutContext } from 'expo-router'
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TabsProvider, useTabs } from '../../components/TabsContext'

const { Navigator } = createMaterialTopTabNavigator()

const MaterialTopTabs = withLayoutContext(Navigator)

function TabsLayoutContent() {
  const { viewMode, setViewMode, showFilters, setShowFilters } = useTabs()

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Home Tasks</Text>
        <View style={styles.headerButtons}>
          {/* View Toggle */}
          <View style={styles.viewToggleContainer}>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                viewMode === 'large' && styles.viewToggleButtonActive,
              ]}
              onPress={() => setViewMode('large')}
              testID="grid-view-button"
            >
              <Ionicons
                name="grid"
                size={16}
                color={viewMode === 'large' ? '#2c3e50' : '#6c757d'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                viewMode === 'compact' && styles.viewToggleButtonActive,
              ]}
              onPress={() => setViewMode('compact')}
              testID="list-view-button"
            >
              <Ionicons
                name="list"
                size={16}
                color={viewMode === 'compact' ? '#2c3e50' : '#6c757d'}
              />
            </TouchableOpacity>
          </View>

          {/* Filter Button */}
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
            testID="filter-button"
          >
            <Ionicons
              name="filter"
              size={18}
              color={showFilters ? '#007bff' : '#6c757d'}
            />
            {showFilters && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>
      </View>

      <MaterialTopTabs
        screenOptions={{
          tabBarActiveTintColor: '#007bff',
          tabBarInactiveTintColor: '#6c757d',
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: '500',
            textTransform: 'capitalize',
          },
          tabBarStyle: {
            backgroundColor: 'transparent',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#e9ecef',
            paddingHorizontal: 24,
          },
          tabBarIndicatorStyle: {
            backgroundColor: '#007bff',
            height: 2,
            borderRadius: 1,
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
                <Text style={[styles.tabLabel, { color }]}>Active</Text>
                <Text
                  style={[
                    styles.tabCount,
                    { color: focused ? '#007bff' : '#6c757d' },
                  ]}
                >
                  (3)
                </Text>
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
                <Text style={[styles.tabLabel, { color }]}>Snoozed</Text>
                <Text
                  style={[
                    styles.tabCount,
                    { color: focused ? '#007bff' : '#6c757d' },
                  ]}
                >
                  (1)
                </Text>
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
                <Text style={[styles.tabLabel, { color }]}>Future</Text>
                <Text
                  style={[
                    styles.tabCount,
                    { color: focused ? '#007bff' : '#6c757d' },
                  ]}
                >
                  (2)
                </Text>
              </View>
            ),
          }}
        />
      </MaterialTopTabs>
    </SafeAreaView>
  )
}

export default function TabsLayout() {
  return (
    <TabsProvider>
      <TabsLayoutContent />
    </TabsProvider>
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
    gap: 8,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    padding: 2,
  },
  viewToggleButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewToggleButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'relative',
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007bff',
  },
  tabLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabCount: {
    fontSize: 12,
    marginLeft: 4,
  },
})
