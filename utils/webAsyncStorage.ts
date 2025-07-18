// Web-compatible AsyncStorage mock for Expo web
interface AsyncStorageWeb {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
  clear: () => Promise<void>
}

let storage: AsyncStorageWeb = {
  getItem: async () => null,
  setItem: async () => {
    // No-op for default implementation
  },
  removeItem: async () => {
    // No-op for default implementation
  },
  clear: async () => {
    // No-op for default implementation
  },
}

if (typeof window !== 'undefined') {
  // Check if we're in CI mode with seed data
  if (window.__CI_MODE__ && window.AsyncStorage) {
    storage = window.AsyncStorage
  } else {
    // Use localStorage for web
    storage = {
      getItem: async (key: string) => {
        try {
          return localStorage.getItem(key)
        } catch {
          return null
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          localStorage.setItem(key, value)
        } catch (e) {
          console.error('Failed to save to localStorage:', e)
        }
      },
      removeItem: async (key: string) => {
        try {
          localStorage.removeItem(key)
        } catch (e) {
          console.error('Failed to remove from localStorage:', e)
        }
      },
      clear: async () => {
        try {
          localStorage.clear()
        } catch (e) {
          console.error('Failed to clear localStorage:', e)
        }
      },
    }
  }
}

export default storage
