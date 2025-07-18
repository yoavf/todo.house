import { Ionicons } from "@expo/vector-icons";
import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { Navigator } = createMaterialTopTabNavigator();

const MaterialTopTabs = withLayoutContext(Navigator);

export default function TabsLayout() {
	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
			
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.title}>todo.house</Text>
			</View>

			<MaterialTopTabs
				screenOptions={{
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
									name={focused ? "list" : "list-outline"} 
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
									name={focused ? "time" : "time-outline"} 
									size={20} 
									color={color}
									style={styles.tabIcon}
								/>
								<Text style={[styles.tabLabel, { color }]}>Snoozed</Text>
							</View>
						),
					}}
				/>
			</MaterialTopTabs>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f8f9fa',
	},
	header: {
		paddingHorizontal: 24,
		paddingVertical: 16,
	},
	title: {
		fontSize: 32,
		fontWeight: 'bold',
		color: '#2c3e50',
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
});
