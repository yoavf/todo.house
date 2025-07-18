const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')

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
    // Inject CI setup before navigation
    await page.addInitScript({ path: path.join(process.cwd(), 'public', 'ci-setup.js') })
    
    // Navigate to the Expo web app
    await page.goto('http://localhost:8081', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    })
    
    // Wait for app to fully load and hydrate with seed data
    await page.waitForTimeout(8000)
    
    // 1. Take screenshot of home screen with seeded tasks
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-home-screen-with-tasks.png'),
      fullPage: false 
    })
    
    // 2. Scroll down to show more tasks
    await page.evaluate(() => {
      const scrollView = document.querySelector('[data-testid="task-list-scroll"]') || 
                        document.querySelector('.css-view-175oi2r') ||
                        document.querySelector('div[style*="overflow"]')
      if (scrollView) {
        scrollView.scrollTop = 300
      } else {
        window.scrollTo(0, 300)
      }
    })
    await page.waitForTimeout(1000)
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '02-home-screen-scrolled.png'),
      fullPage: false 
    })
    
    // 3. Click on FAB if exists
    const fabButton = await page.$('[aria-label="Add task"]') || 
                     await page.$('button:has-text("Add")') ||
                     await page.$('[data-testid="fab-button"]')
    
    if (fabButton) {
      await fabButton.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ 
        path: path.join(screenshotsDir, '03-add-task-menu.png'),
        fullPage: false 
      })
      
      // Close the FAB menu
      await page.keyboard.press('Escape')
      await page.waitForTimeout(1000)
    }
    
    // 4. Try to trigger swipe action on a task
    const firstTask = await page.$('[data-testid="task-card-0"]') || 
                     await page.$('.css-view-175oi2r > div:first-child')
    
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
          path: path.join(screenshotsDir, '04-task-swipe-actions.png'),
          fullPage: false 
        })
      }
    }
    
    // 5. Take screenshot of snooze action sheet
    // First, find a task with snooze button
    const snoozeButton = await page.$('[aria-label*="Snooze"]') || 
                        await page.$('button:has-text("Snooze")') ||
                        await page.$('[data-testid="snooze-button"]')
    
    if (snoozeButton) {
      await snoozeButton.click()
      await page.waitForTimeout(2000)
      
      // Take screenshot of snooze options
      await page.screenshot({ 
        path: path.join(screenshotsDir, '05-snooze-action-sheet.png'),
        fullPage: false 
      })
      
      // Close snooze sheet
      await page.keyboard.press('Escape')
      await page.waitForTimeout(1000)
    } else {
      // Alternative: Try to long press on a task to show options
      const taskCard = await page.$('[data-testid="task-card-1"]') || 
                      await page.$('.css-view-175oi2r > div:nth-child(2)')
      
      if (taskCard) {
        const box = await taskCard.boundingBox()
        if (box) {
          // Simulate long press
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
          await page.mouse.down()
          await page.waitForTimeout(800) // Long press duration
          await page.mouse.up()
          await page.waitForTimeout(1500)
          
          // Check if action sheet appeared
          const actionSheet = await page.$('[data-testid="bottom-sheet"]') || 
                             await page.$('.css-view-175oi2r[style*="bottom: 0"]')
          
          if (actionSheet) {
            await page.screenshot({ 
              path: path.join(screenshotsDir, '05-snooze-action-sheet.png'),
              fullPage: false 
            })
          }
        }
      }
    }
    
    // 6. Take screenshot of completed tasks section if visible
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
    await page.waitForTimeout(1000)
    
    const completedSection = await page.$('text="Completed"') || 
                           await page.$('[data-testid="completed-section"]')
    
    if (completedSection) {
      await page.screenshot({ 
        path: path.join(screenshotsDir, '06-completed-tasks.png'),
        fullPage: false 
      })
    }
    
    console.log('Screenshots taken successfully')
    
    // List all screenshots created
    const screenshots = fs.readdirSync(screenshotsDir)
      .filter(file => file.endsWith('.png'))
      .sort()
    
    console.log('Created screenshots:')
    screenshots.forEach(file => console.log(`  - ${file}`))
    
  } catch (error) {
    console.error('Error taking screenshots:', error)
    
    // Take error screenshot for debugging
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'error-screenshot.png'),
      fullPage: true 
    })
  } finally {
    await browser.close()
  }
}

takeScreenshots().catch(console.error)
