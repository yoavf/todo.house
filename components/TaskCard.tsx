import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Modal } from 'react-native';
import { Card, XStack, YStack, Text, Checkbox, Button, Image, View, AnimatePresence, styled } from 'tamagui';
import { useTaskStore } from '../store/taskStore';
import { Task } from '../types/Task';
import { InlineTextEdit } from './InlineTextEdit';
import { LocationPicker } from './LocationPicker';

interface TaskCardProps {
  task: Task;
}

const StyledCard = styled(Card, {
  padding: '$4',
  marginBottom: '$4',
  backgroundColor: '$background',
  borderRadius: '$4',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
  position: 'relative',
  
  variants: {
    completed: {
      true: {
        opacity: 0.6,
      },
    },
    recentlyAdded: {
      true: {
        borderWidth: 2,
        borderColor: '$green1',
        shadowColor: '$green1',
        shadowOpacity: 0.2,
      },
    },
  } as const,
});

const Badge = styled(View, {
  position: 'absolute',
  top: -6,
  right: -6,
  backgroundColor: '$green1',
  borderRadius: 8,
  paddingHorizontal: 6,
  paddingVertical: 2,
});

export function TaskCard({ task }: TaskCardProps) {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const { toggle, remove, update, recentlyAddedId, clearRecentlyAdded } = useTaskStore();
  const isRecentlyAdded = recentlyAddedId === task.id;

  // Clear the recently added highlight after a delay
  useEffect(() => {
    if (isRecentlyAdded) {
      const timer = setTimeout(() => {
        clearRecentlyAdded();
      }, 3000); // Show highlight for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isRecentlyAdded, clearRecentlyAdded]);

  const handleToggleComplete = () => {
    toggle(task.id);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove(task.id) },
      ]
    );
  };

  const handleTitleUpdate = (newTitle: string) => {
    if (newTitle.trim() !== task.title) {
      update(task.id, { title: newTitle.trim() });
    }
  };

  const handleLocationUpdate = (newLocation: string) => {
    update(task.id, { location: newLocation || undefined });
    setShowLocationPicker(false);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  return (
    <>
      <StyledCard
        completed={task.completed}
        recentlyAdded={isRecentlyAdded}
        animation="quick"
        scale={0.9}
        hoverStyle={{ scale: 0.95 }}
        pressStyle={{ scale: 0.95 }}
      >
        <XStack alignItems="flex-start" gap="$3">
          {/* Completion Checkbox */}
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            size="$4"
            circular
            theme={task.completed ? "green" : undefined}
          >
            <Checkbox.Indicator>
              <Ionicons name="checkmark" size={16} color="white" />
            </Checkbox.Indicator>
          </Checkbox>

          {/* Task Content */}
          <YStack flex={1} gap="$2">
            {/* Title */}
            <InlineTextEdit
              value={task.title}
              onUpdate={handleTitleUpdate}
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: task.completed ? '#6c757d' : '#2c3e50',
                textDecorationLine: task.completed ? 'line-through' : 'none',
              }}
              placeholder="Task title"
            />

            {/* Location */}
            <Button
              size="$2"
              variant="ghost"
              onPress={() => setShowLocationPicker(true)}
              justifyContent="flex-start"
              padding={0}
              color={task.completed ? '$gray9' : '$gray10'}
            >
              <Text 
                fontSize={14} 
                color={task.location ? (task.completed ? '$gray9' : '$gray10') : '$gray8'}
                fontStyle={task.location ? 'normal' : 'italic'}
              >
                {task.location ? `in ${task.location}` : 'Add location'}
              </Text>
            </Button>

            {/* Image thumbnail if available */}
            {task.imageUri && (
              <Button
                onPress={() => setShowImageModal(true)}
                padding={0}
                backgroundColor="transparent"
                borderWidth={0}
                alignSelf="flex-start"
              >
                <View position="relative">
                  <Image 
                    source={{ uri: task.imageUri }} 
                    width={60}
                    height={60}
                    borderRadius="$button"
                    borderWidth={1}
                    borderColor="$gray5"
                  />
                  <View
                    position="absolute"
                    bottom={4}
                    right={4}
                    backgroundColor="rgba(0, 0, 0, 0.6)"
                    borderRadius={10}
                    width={20}
                    height={20}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Ionicons name="expand-outline" size={16} color="white" />
                  </View>
                </View>
              </Button>
            )}

            {/* Date */}
            <Text fontSize={12} color={task.completed ? '$gray8' : '$gray9'}>
              {formatDate(task.createdAt)}
            </Text>
          </YStack>

          {/* Delete Button */}
          <Button
            size="$3"
            variant="ghost"
            icon={<Ionicons name="trash-outline" size={20} color="#dc3545" />}
            onPress={handleDelete}
            circular
          />
        </XStack>

        {/* Recently Added Indicator */}
        <AnimatePresence>
          {isRecentlyAdded && (
            <Badge
              animation="quick"
              enterStyle={{ scale: 0, opacity: 0 }}
              exitStyle={{ scale: 0, opacity: 0 }}
            >
              <Text color="white" fontSize={10} fontWeight="bold">
                NEW
              </Text>
            </Badge>
          )}
        </AnimatePresence>
      </StyledCard>

      {/* Location Picker Modal */}
      <LocationPicker
        visible={showLocationPicker}
        currentLocation={task.location}
        onSelect={handleLocationUpdate}
        onClose={() => setShowLocationPicker(false)}
      />

      {/* Image Modal */}
      {task.imageUri && (
        <Modal
          visible={showImageModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowImageModal(false)}
        >
          <View 
            flex={1} 
            backgroundColor="rgba(0, 0, 0, 0.9)"
            justifyContent="center"
            alignItems="center"
            onPress={() => setShowImageModal(false)}
          >
            <View width="90%" height="80%" position="relative">
              <Image 
                source={{ uri: task.imageUri }} 
                width="100%"
                height="100%"
                resizeMode="contain"
              />
              <Button
                position="absolute"
                top={16}
                right={16}
                backgroundColor="rgba(0, 0, 0, 0.6)"
                circular
                size="$4"
                icon={<Ionicons name="close" size={24} color="white" />}
                onPress={() => setShowImageModal(false)}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}