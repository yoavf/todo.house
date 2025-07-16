import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { Task, SnoozeDuration } from '../types/Task';
import { parseDateField, parseRequiredDateField } from '../utils/dateUtils';

interface TaskStore {
  tasks: Task[];
  hydrated: boolean;
  recentlyAddedId: string | null;
  add: (task: Omit<Task, 'id' | 'createdAt' | 'order'>) => string;
  update: (id: string, partial: Partial<Task>) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  clearRecentlyAdded: () => void;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  reorderTasks: (newTaskOrder: Task[]) => void;
  snoozeTask: (id: string, duration: SnoozeDuration) => void;
  unsnoozeTask: (id: string) => void;
  setDueDate: (id: string, dueDate?: Date) => void;
  getActiveTasks: () => Task[];
  getSnoozedTasks: () => Task[];
}

const STORAGE_KEY = '@todo_house_tasks';

const calculateSnoozeDate = (duration: SnoozeDuration): Date => {
  const now = new Date();
  
  switch (duration) {
    case '1hour':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case '3hours':
      return new Date(now.getTime() + 3 * 60 * 60 * 1000);
    case 'tomorrow':
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow
      return tomorrow;
    case 'nextweek':
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(9, 0, 0, 0); // 9 AM next week
      return nextWeek;
    default:
      return now;
  }
};

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  hydrated: false,
  recentlyAddedId: null,

  add: (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      order: Date.now(), // New tasks appear at top
    };

    set((state) => ({
      tasks: [...state.tasks, newTask],
      recentlyAddedId: newTask.id,
    }));

    get().persist();
    return newTask.id;
  },

  update: (id, partial) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...partial } : task
      ),
    }));

    get().persist();
  },

  remove: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }));

    get().persist();
  },

  toggle: (id) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      ),
    }));

    get().persist();
  },

  clearRecentlyAdded: () => {
    set({ recentlyAddedId: null });
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const tasks = JSON.parse(stored).map((task: any) => ({
          ...task,
          createdAt: parseRequiredDateField(task.createdAt),
          dueDate: parseDateField(task.dueDate),
          snoozeUntil: parseDateField(task.snoozeUntil),
          order: task.order !== undefined ? task.order : (task.createdAt ? parseRequiredDateField(task.createdAt).getTime() : Date.now()),
          imageUri: task.imageUri || undefined,
        }));
        set({ tasks, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch (error) {
      console.error('Failed to hydrate tasks:', error);
      set({ hydrated: true });
    }
  },

  persist: async () => {
    try {
      const { tasks } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to persist tasks:', error);
    }
  },

  // Enhanced task list methods
  reorderTasks: (newTaskOrder: Task[]) => {
    set((state) => {
      const snoozedTasks = state.tasks.filter(task => task.snoozeUntil && task.snoozeUntil > new Date());
      
      // Update order values based on new array order
      const baseTimestamp = Date.now();
      const reorderedTasks = newTaskOrder.map((task, index) => ({
        ...task,
        order: baseTimestamp - index,
      }));

      return {
        tasks: [...reorderedTasks, ...snoozedTasks],
      };
    });
    
    get().persist();
  },

  snoozeTask: (id: string, duration: SnoozeDuration) => {
    const snoozeUntil = calculateSnoozeDate(duration);
    
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, snoozeUntil } : task
      ),
    }));

    get().persist();
  },

  unsnoozeTask: (id: string) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, snoozeUntil: undefined } : task
      ),
    }));

    get().persist();
  },

  setDueDate: (id: string, dueDate?: Date) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, dueDate } : task
      ),
    }));

    get().persist();
  },

  getActiveTasks: () => {
    const { tasks } = get();
    const now = new Date();
    
    return tasks
      .filter(task => !task.snoozeUntil || task.snoozeUntil <= now)
      .sort((a, b) => {
        // Sort by completion status first
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        
        // Within each completion group, sort by due date first
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        
        // Then by order (newest first)
        return b.order - a.order;
      });
  },

  getSnoozedTasks: () => {
    const { tasks } = get();
    const now = new Date();
    
    return tasks
      .filter(task => task.snoozeUntil && task.snoozeUntil > now)
      .sort((a, b) => {
        if (a.snoozeUntil && b.snoozeUntil) {
          return a.snoozeUntil.getTime() - b.snoozeUntil.getTime();
        }
        return 0;
      });
  },
}));