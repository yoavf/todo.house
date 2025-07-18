import React, { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import DraggableFlatList, {
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import { useTaskStore } from "../store/taskStore";
import type { Task } from "../types/Task";
import { DraggableTaskItem } from "./DraggableTaskItem";

const TASK_CARD_HEIGHT = 80;

interface TaskListProps {
	tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
	const { reorderTasks } = useTaskStore();

	const handleDragEnd = useCallback(
		({ data }: { data: Task[] }) => {
			reorderTasks(data);
		},
		[reorderTasks],
	);

	const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<Task>) => {
		return (
			<DraggableTaskItem
				task={item}
				drag={drag}
				isActive={isActive}
			/>
		);
	}, []);

	if (tasks.length === 0) {
		return (
			<View style={styles.emptyContainer} testID="empty-container">
				<Text style={styles.emptyText}>No tasks yet</Text>
				<Text style={styles.emptySubtext}>
					Tap the + button to add your first task
				</Text>
			</View>
		);
	}

	return (
		<DraggableFlatList
			data={tasks}
			keyExtractor={(item) => item.id}
			renderItem={renderItem}
			onDragEnd={handleDragEnd}
			showsVerticalScrollIndicator={false}
			contentContainerStyle={styles.listContainer}
			      getItemLayout={(_data, index) => ({
				length: TASK_CARD_HEIGHT, // Approximate task card height
				offset: TASK_CARD_HEIGHT * index,
				index,
			})}
			removeClippedSubviews={true}
			maxToRenderPerBatch={10}
			updateCellsBatchingPeriod={50}
			windowSize={10}
		/>
	);
}

const styles = StyleSheet.create({
	listContainer: {
		paddingBottom: 100, // Space for FAB
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 80,
	},
	emptyText: {
		fontSize: 20,
		fontWeight: "700",
		color: "#374151",
		marginBottom: 12,
		letterSpacing: -0.5,
	},
	emptySubtext: {
		fontSize: 16,
		color: "#9CA3AF",
		textAlign: "center",
		lineHeight: 22,
		fontWeight: "500",
	},
});
