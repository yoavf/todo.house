import { useTaskStore } from '../store/taskStore';

export const addDemoTasks = () => {
  const { add } = useTaskStore.getState();

  // Add some demo tasks that match the screenshot
  add({
    title: 'Vacuum carpet',
    location: 'Living Room',
    completed: false,
  });

  add({
    title: 'Clean mirror',
    location: 'Main Bathroom',
    completed: true,
  });

  add({
    title: 'Organize closet',
    location: 'Master Bedroom',
    completed: false,
  });
};