// CI environment setup for screenshots
const fs = require('node:fs')
const path = require('node:path')

// Create a temporary environment file for CI
const envContent = `
// CI Environment Setup
window.__CI_MODE__ = true

// Load seed data if available
if (window.__CI_MODE__) {
  try {
    const seedData = ${fs.readFileSync(path.join(process.cwd(), 'seed-data.json'), 'utf8')}
    window.__SEED_DATA__ = seedData
    
    // Override AsyncStorage for web in CI
    if (typeof window !== 'undefined' && !window.AsyncStorage) {
      window.AsyncStorage = {
        data: {
          '@todo_house_tasks': JSON.stringify(seedData.tasks)
        },
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
        }
      }
    }
  } catch (e) {
    console.error('Failed to load seed data:', e)
  }
}
`

// Write to a temporary file that can be included in the web build
const ciSetupPath = path.join(process.cwd(), 'public', 'ci-setup.js')
const publicDir = path.join(process.cwd(), 'public')

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

fs.writeFileSync(ciSetupPath, envContent)
console.log('CI setup file created at:', ciSetupPath)

