import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { Task, SnoozeDuration } from '../types/Task';
import { 
  parseDateField, 
  parseRequiredDateField,
  getNextWeekendStart,
  getNextWeekday,
  getFirstWorkday,
  isWeekend,
  isLastDayOfWeekend
} from '../utils/dateUtils';
import { getCurrentLocale } from '../utils/localeUtils';

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
  isSnoozed: (task: Task) => boolean;
}

const STORAGE_KEY = '@todo_house_tasks';

const calculateSnoozeDate = (duration: SnoozeDuration): Date | undefined => {
  const now = new Date();
  const locale = getCurrentLocale();
  
  switch (duration) {
    case SnoozeDuration.TOMORROW:
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow
      return tomorrow;
      
    case SnoozeDuration.THIS_WEEKEND:
      return getNextWeekendStart(now, locale);
      
    case SnoozeDuration.NEXT_WORKDAY:
      const firstWorkday = getFirstWorkday(locale);
      const today = now.getDay();
      
      // If today is the last day of weekend, go to next week's first workday
      if (isLastDayOfWeekend(now, locale)) {
        const nextWeekStart = new Date(now);
        nextWeekStart.setDate(nextWeekStart.getDate() + 8);
        return getNextWeekday(firstWorkday, nextWeekStart);
      }
      
      // Otherwise, go to the next occurrence of first workday
      return getNextWeekday(firstWorkday, now);
      
    case SnoozeDuration.WHENEVER:
      // No specific date - return undefined to indicate indefinite snooze
      return undefined;
      
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
    console.log('TaskStore: remove called for task:', id);
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }));

    get().persist();
  },

  toggle: (id) => {
    console.log('TaskStore: toggle called for task:', id);
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
          isWheneverSnoozed: task.isWheneverSnoozed || false,
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
    const isWheneverSnoozed = duration === SnoozeDuration.WHENEVER;
    
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, snoozeUntil, isWheneverSnoozed } : task
      ),
    }));

    get().persist();
  },

  unsnoozeTask: (id: string) => {
    console.log('TaskStore: unsnoozeTask called for task:', id);
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, snoozeUntil: undefined, isWheneverSnoozed: false } : task
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
      .filter(task => !task.isWheneverSnoozed && (!task.snoozeUntil || task.snoozeUntil <= now))
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
      .filter(task => task.isWheneverSnoozed || (task.snoozeUntil && task.snoozeUntil > now))
      .sort((a, b) => {
        // Whenever tasks go to the bottom
        if (a.isWheneverSnoozed && !b.isWheneverSnoozed) return 1;
        if (!a.isWheneverSnoozed && b.isWheneverSnoozed) return -1;
        
        // Sort by snooze date for timed snoozes
        if (a.snoozeUntil && b.snoozeUntil) {
          return a.snoozeUntil.getTime() - b.snoozeUntil.getTime();
        }
        return 0;
      });
  },

  isSnoozed: (task: Task) => {
    const now = new Date();
    return task.isWheneverSnoozed || (task.snoozeUntil ? task.snoozeUntil > now : false);
  },
}));