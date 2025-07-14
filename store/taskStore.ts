import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { Task } from '../types/Task';

interface TaskStore {
  tasks: Task[];
  hydrated: boolean;
  recentlyAddedId: string | null;
  add: (task: Omit<Task, 'id' | 'createdAt'>) => string;
  update: (id: string, partial: Partial<Task>) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  clearRecentlyAdded: () => void;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
}

const STORAGE_KEY = '@todo_house_tasks';

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  hydrated: false,
  recentlyAddedId: null,

  add: (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
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
          createdAt: new Date(task.createdAt),
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
}));