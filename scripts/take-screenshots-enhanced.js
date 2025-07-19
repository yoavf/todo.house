const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')

// Import the CI setup script getter
const { getCiSetupScript } = require('./ci-setup.js')

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro dimensions
    deviceScaleFactor: 3,
  })

  const page = await context.newPage()

  // Create screenshots directory
  const screenshotsDir = path.join(process.cwd(), 'screenshots')
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir)
  }

  try {
    // Inject CI setup script directly before navigation (lazy load)
    await page.addInitScript(getCiSetupScript())

    // Navigate to the Expo web app
    await page.goto('http://localhost:8081', {
      waitUntil: 'networkidle',
      timeout: 60000,
    })

    // Wait for app to fully load and hydrate with seed data
    // First wait for basic hydration
    await page.waitForTimeout(5000)

    // Then wait for either tasks to load or empty state to appear
    try {
      // Wait for tasks or empty state (whichever appears first)
      await Promise.race([
        page.waitForSelector('text="Home Tasks"', { timeout: 15000 }),
        page.waitForSelector('[data-testid="empty-container"]', {
          timeout: 15000,
        }),
      ])

      // Additional wait to ensure content is fully rendered
      await page.waitForTimeout(3000)
    } catch (_error) {
      console.log(
        'Warning: Could not detect app content, proceeding with fallback timeout',
      )
      await page.waitForTimeout(10000)
    }

    // 1. Take screenshot of home screen with large view (default)
    await page.screenshot({
      path: path.join(screenshotsDir, '01-home-screen-large-view.png'),
      fullPage: false,
    })

    // 2. Switch to compact/list view
    console.log('Looking for list view button...')
    const listViewButton = await page.$('[data-testid="list-view-button"]')

    if (listViewButton) {
      console.log('Found list view button, clicking...')
      await listViewButton.click()
      await page.waitForTimeout(1500)

      await page.screenshot({
        path: path.join(screenshotsDir, '02-home-screen-compact-view.png'),
        fullPage: false,
      })

      // Switch back to large view
      const gridViewButton = await page.$('[data-testid="grid-view-button"]')

      if (gridViewButton) {
        await gridViewButton.click()
        await page.waitForTimeout(1500)
      }
    }

    // 3. Open filters
    console.log('Looking for filter button...')
    const filterButton = await page.$('[data-testid="filter-button"]')

    if (filterButton) {
      console.log('Found filter button, clicking...')
      await filterButton.click()
      await page.waitForTimeout(1500)

      await page.screenshot({
        path: path.join(screenshotsDir, '03-home-screen-filters-open.png'),
        fullPage: false,
      })

      // Close filters
      await filterButton.click()
      await page.waitForTimeout(1000)
    }

    // 4. Scroll to show more tasks (meaningful scrolling)
    // First, ensure we have enough tasks to scroll
    const taskCount =
      (await page.$$eval(
        '[data-testid*="task-card"]',
        (tasks) => tasks.length,
      )) || (await page.$$eval('[class*="card"]', (cards) => cards.length))

    if (taskCount > 3) {
      // Scroll to approximately the 4th task
      await page.evaluate(() => {
        const scrollContainer =
          document.querySelector('[data-testid="task-list-scroll"]') ||
          document.querySelector('[class*="FlatList"]') ||
          document.querySelector('div[style*="overflow"]')

        if (scrollContainer) {
          // Scroll to show tasks 4-6
          scrollContainer.scrollTop = 380 * 3 // Assuming ~380px per card
        } else {
          window.scrollTo(0, 380 * 3)
        }
      })
      await page.waitForTimeout(1000)

      await page.screenshot({
        path: path.join(screenshotsDir, '04-home-screen-scrolled.png'),
        fullPage: false,
      })

      // Scroll back to top
      await page.evaluate(() => {
        const scrollContainer =
          document.querySelector('[data-testid="task-list-scroll"]') ||
          document.querySelector('[class*="FlatList"]') ||
          document.querySelector('div[style*="overflow"]')

        if (scrollContainer) {
          scrollContainer.scrollTop = 0
        } else {
          window.scrollTo(0, 0)
        }
      })
      await page.waitForTimeout(1000)
    }

    // 5. Click on FAB if exists
    const fabButton =
      (await page.$('[aria-label="Add task"]')) ||
      (await page.$('button:has-text("Add")')) ||
      (await page.$('[data-testid="fab-button"]'))

    if (fabButton) {
      await fabButton.click()
      await page.waitForTimeout(2000)
      await page.screenshot({
        path: path.join(screenshotsDir, '05-add-task-menu.png'),
        fullPage: false,
      })

      // Close the FAB menu
      await page.keyboard.press('Escape')
      await page.waitForTimeout(1000)
    }

    // 6. Try to trigger swipe action on a task
    const firstTask =
      (await page.$('[data-testid="task-card-0"]')) ||
      (await page.$('[class*="SwipeableTaskCard"]:first-child')) ||
      (await page.$('[class*="card"]:first-child'))

    if (firstTask) {
      // Simulate swipe gesture
      const box = await firstTask.boundingBox()
      if (box) {
        await page.mouse.move(box.x + box.width - 50, box.y + box.height / 2)
        await page.mouse.down()
        await page.mouse.move(box.x + 50, box.y + box.height / 2, { steps: 10 })
        await page.mouse.up()
        await page.waitForTimeout(1000)

        await page.screenshot({
          path: path.join(screenshotsDir, '06-task-swipe-actions.png'),
          fullPage: false,
        })
      }
    }

    // 7. Take screenshot of task detail modal
    const taskToClick =
      (await page.$('[data-testid="task-card-0"]')) ||
      (await page.$('[class*="card"]:first-child'))

    if (taskToClick) {
      await taskToClick.click()
      await page.waitForTimeout(2000)

      const modal =
        (await page.$('[class*="Modal"]')) ||
        (await page.$('[class*="TaskDetailModal"]'))

      if (modal) {
        await page.screenshot({
          path: path.join(screenshotsDir, '07-task-detail-modal.png'),
          fullPage: false,
        })

        // Close modal
        const closeButton =
          (await page.$('[aria-label="Close"]')) ||
          (await page.$('button:has([name="arrow-back"])')) ||
          (await page.$('[class*="closeButton"]'))

        if (closeButton) {
          await closeButton.click()
          await page.waitForTimeout(1000)
        }
      }
    }

    console.log('Screenshots taken successfully')

    // List all screenshots created
    const screenshots = fs
      .readdirSync(screenshotsDir)
      .filter((file) => file.endsWith('.png'))
      .sort()

    console.log('Created screenshots:')
    screenshots.forEach((file) => console.log(`  - ${file}`))
  } catch (error) {
    console.error('Error taking screenshots:', error)

    // Take error screenshot for debugging
    await page.screenshot({
      path: path.join(screenshotsDir, 'error-screenshot.png'),
      fullPage: true,
    })
  } finally {
    await browser.close()
  }
}

takeScreenshots().catch(console.error)
