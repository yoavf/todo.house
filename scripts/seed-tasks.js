const AsyncStorage =
  require('@react-native-async-storage/async-storage').default
const fs = require('node:fs')
const path = require('node:path')

// Mock implementation for localStorage in CI environment
const mockLocalStorage = {
  data: {},
  getItem(key) {
    return Promise.resolve(this.data[key] || null)
  },
  setItem(key, value) {
    this.data[key] = value
    return Promise.resolve()
  },
  removeItem(key) {
    delete this.data[key]
    return Promise.resolve()
  },
  clear() {
    this.data = {}
    return Promise.resolve()
  },
}

// Only set up polyfill if not already present
if (!global.localStorage) {
  global.localStorage = mockLocalStorage
}

// Mock AsyncStorage for CI
AsyncStorage.getItem = (key) => mockLocalStorage.getItem(key)
AsyncStorage.setItem = (key, value) => mockLocalStorage.setItem(key, value)

async function seedTasks() {
  try {
    // Import after polyfills are set up
    const { TaskFactory } = require('./taskFactory')

    // Generate diverse test tasks
    const tasks = TaskFactory.generateTasks({
      count: 15,
      includeCompleted: true,
      includeSnoozed: true,
      includeImages: true,
      includeDueDates: true,
    })

    // Store tasks in AsyncStorage
    const STORAGE_KEY = '@todo_house_tasks'
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))

    console.log(`Successfully seeded ${tasks.length} tasks`)
    console.log('Task breakdown:')
    console.log(`- With images: ${tasks.filter((t) => t.imageUri).length}`)
    console.log(`- Completed: ${tasks.filter((t) => t.completed).length}`)
    console.log(
      `- Snoozed: ${tasks.filter((t) => t.snoozeUntil || t.isWheneverSnoozed).length}`,
    )
    console.log(`- With due dates: ${tasks.filter((t) => t.dueDate).length}`)

    // Also save to a file for the web version
    const seedDataPath = path.join(process.cwd(), 'seed-data.json')
    fs.writeFileSync(seedDataPath, JSON.stringify({ tasks }, null, 2))
    console.log(`Seed data also saved to: ${seedDataPath}`)
  } catch (error) {
    console.error('Error seeding tasks:', error)
    process.exit(1)
  }
}

seedTasks()
