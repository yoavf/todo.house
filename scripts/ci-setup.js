// CI environment setup for screenshots
const fs = require('node:fs')
const path = require('node:path')

// Function to generate CI setup script lazily
function getCiSetupScript() {
  // Read and parse seed data safely
  const seedDataPath = path.join(process.cwd(), 'seed-data.json')
  let seedDataJSON = '{}'

  try {
    const seedDataContent = fs.readFileSync(seedDataPath, 'utf8')
    // Parse to validate JSON, then re-stringify to ensure it's safe
    const seedData = JSON.parse(seedDataContent)
    seedDataJSON = JSON.stringify(seedData)
  } catch (e) {
    console.error('Failed to read or parse seed data:', e)
  }

  // Create CI setup script content that will be injected directly
  const ciSetupScript = `
// CI Environment Setup
window.__CI_MODE__ = true

// Load seed data if available
if (window.__CI_MODE__) {
  try {
    // Assign the validated JSON data directly
    window.__SEED_DATA__ = ${seedDataJSON};
    
    // Override AsyncStorage for web in CI
    if (typeof window !== 'undefined' && !window.AsyncStorage) {
      window.AsyncStorage = {
        data: {
          '@todo_house_tasks': JSON.stringify(window.__SEED_DATA__.tasks)
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

  return ciSetupScript
}

// Export the getter function so it can be used by take-screenshots-enhanced.js
module.exports = { getCiSetupScript }

// If run directly, generate and log the script
if (require.main === module) {
  getCiSetupScript()
  console.log('CI setup script generated successfully')
}
