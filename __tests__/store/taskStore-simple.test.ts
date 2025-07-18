import { useTaskStore } from '../../store/taskStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock locale and date utils
jest.mock('../../utils/localeUtils', () => ({
  getCurrentLocale: jest.fn(() => 'en-US'),
  getCurrentRegion: jest.fn(() => 'US'),
}));

jest.mock('../../utils/dateUtils', () => ({
  ...jest.requireActual('../../utils/dateUtils'),
  getCurrentLocale: jest.fn(() => 'en-US'),
}));

describe('TaskStore Basic Functionality', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTaskStore.setState({ 
      tasks: [], 
      hydrated: false, 
      recentlyAddedId: null 
    });
  });

  describe('add task', () => {
    it('should add a new task', () => {
      const store = useTaskStore.getState();
      const taskData = {
        title: 'New Task',
        completed: false,
        location: 'Kitchen',
      };

      const taskId = store.add(taskData);

      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('New Task');
      expect(tasks[0].id).toBe(taskId);
      expect(tasks[0].completed).toBe(false);
      expect(tasks[0].location).toBe('Kitchen');
      expect(tasks[0].createdAt).toBeInstanceOf(Date);
    });

    it('should set recentlyAddedId when adding a task', () => {
      const store = useTaskStore.getState();
      const taskId = store.add({
        title: 'New Task',
        completed: false,
      });

      expect(useTaskStore.getState().recentlyAddedId).toBe(taskId);
    });
  });

  describe('update task', () => {
    it('should update an existing task', () => {
      const store = useTaskStore.getState();
      const taskId = store.add({
        title: 'Original Title',
        completed: false,
      });

      store.update(taskId, { title: 'Updated Title', completed: true });

      const tasks = useTaskStore.getState().tasks;
      const updatedTask = tasks.find(t => t.id === taskId);
      expect(updatedTask?.title).toBe('Updated Title');
      expect(updatedTask?.completed).toBe(true);
    });
  });

  describe('remove task', () => {
    it('should remove a task by id', () => {
      const store = useTaskStore.getState();
      const taskId = store.add({
        title: 'Task to Remove',
        completed: false,
      });

      expect(useTaskStore.getState().tasks).toHaveLength(1);

      store.remove(taskId);

      expect(useTaskStore.getState().tasks).toHaveLength(0);
    });
  });

  describe('toggle task', () => {
    it('should toggle task completion status', () => {
      const store = useTaskStore.getState();
      const taskId = store.add({
        title: 'Task to Toggle',
        completed: false,
      });

      store.toggle(taskId);

      const tasks = useTaskStore.getState().tasks;
      const toggledTask = tasks.find(t => t.id === taskId);
      expect(toggledTask?.completed).toBe(true);

      store.toggle(taskId);

      const tasksAfterSecondToggle = useTaskStore.getState().tasks;
      const toggledTaskAgain = tasksAfterSecondToggle.find(t => t.id === taskId);
      expect(toggledTaskAgain?.completed).toBe(false);
    });
  });

  describe('clearRecentlyAdded', () => {
    it('should clear the recently added ID', () => {
      const store = useTaskStore.getState();
      store.add({ title: 'Test', completed: false });
      
      expect(useTaskStore.getState().recentlyAddedId).not.toBeNull();
      
      store.clearRecentlyAdded();
      
      expect(useTaskStore.getState().recentlyAddedId).toBeNull();
    });
  });
});