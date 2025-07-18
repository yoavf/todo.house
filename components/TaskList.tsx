import React, { useCallback } from "react";
import { Text, View, YStack, styled } from "tamagui";
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

const EmptyContainer = styled(YStack, {
	flex: 1,
	justifyContent: "center",
	alignItems: "center",
	paddingVertical: 60,
});

const EmptyText = styled(Text, {
	fontSize: 18,
	fontWeight: "600",
	color: "$gray10",
	marginBottom: "$3",
});

const EmptySubtext = styled(Text, {
	fontSize: 14,
	color: "$gray9",
	textAlign: "center",
});

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
			<EmptyContainer>
				<EmptyText>No tasks yet</EmptyText>
				<EmptySubtext>
					Tap the + button to add your first task
				</EmptySubtext>
			</EmptyContainer>
		);
	}

	return (
		<View style={{ flex: 1 }}>
			<DraggableFlatList
				data={tasks}
				keyExtractor={(item) => item.id}
				renderItem={renderItem}
				onDragEnd={handleDragEnd}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 100 }}
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
		</View>
	);
}