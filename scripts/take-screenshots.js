const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  
  // Create screenshots directory
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  try {
    // Test user UUID for CI
    const testUserId = '550e8400-e29b-41d4-a716-446655440000';
    
    // Take desktop screenshots
    console.log('📸 Taking desktop screenshots...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    
    const desktopPage = await desktopContext.newPage();
    
    // Navigate to the app
    await desktopPage.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    // Wait for app to load
    await desktopPage.waitForTimeout(3000);
    
    // Inject test user ID
    await desktopPage.evaluate((userId) => {
      localStorage.setItem('userId', userId);
    }, testUserId);
    
    // Reload to apply user ID
    await desktopPage.reload({ waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(2000);
    
    // Wait for content to load
    try {
      await Promise.race([
        desktopPage.waitForSelector('[data-testid="todo-item"]', { timeout: 10000 }),
        desktopPage.waitForSelector('[data-testid="empty-state"]', { timeout: 10000 }),
        desktopPage.waitForSelector('text="No todos yet"', { timeout: 10000 }),
      ]);
    } catch (error) {
      console.log('Warning: Could not detect todo content, proceeding...');
    }
    
    // 1. Desktop home screen
    await desktopPage.screenshot({
      path: path.join(screenshotsDir, '01-desktop-home.png'),
      fullPage: false,
    });
    
    // 2. Desktop with add todo form open
    const addButton = await desktopPage.$('button:has-text("Add Todo")') || 
                     await desktopPage.$('[data-testid="add-todo-button"]') ||
                     await desktopPage.$('button[aria-label="Add todo"]');
    
    if (addButton) {
      await addButton.click();
      await desktopPage.waitForTimeout(1000);
      
      // Fill in the form
      const titleInput = await desktopPage.$('input[placeholder*="title" i]') ||
                        await desktopPage.$('input[name="title"]') ||
                        await desktopPage.$('[data-testid="todo-title-input"]');
      
      if (titleInput) {
        await titleInput.fill('Review pull request #42');
        
        const descInput = await desktopPage.$('textarea[placeholder*="description" i]') ||
                         await desktopPage.$('textarea[name="description"]') ||
                         await desktopPage.$('[data-testid="todo-description-input"]');
        
        if (descInput) {
          await descInput.fill('Review the new feature implementation and provide feedback');
        }
      }
      
      await desktopPage.screenshot({
        path: path.join(screenshotsDir, '02-desktop-add-todo.png'),
        fullPage: false,
      });
      
      // Close the form
      const cancelButton = await desktopPage.$('button:has-text("Cancel")') ||
                          await desktopPage.$('[data-testid="cancel-button"]');
      if (cancelButton) {
        await cancelButton.click();
      } else {
        await desktopPage.keyboard.press('Escape');
      }
      await desktopPage.waitForTimeout(1000);
    }
    
    // 3. Desktop with todo item actions
    const firstTodo = await desktopPage.$('[data-testid="todo-item"]') ||
                     await desktopPage.$('.todo-item') ||
                     await desktopPage.$('li:has-text("todo")');
    
    if (firstTodo) {
      await firstTodo.hover();
      await desktopPage.waitForTimeout(500);
      
      await desktopPage.screenshot({
        path: path.join(screenshotsDir, '03-desktop-todo-hover.png'),
        fullPage: false,
      });
    }
    
    await desktopContext.close();
    
    // Take mobile screenshots
    console.log('📱 Taking mobile screenshots...');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 }, // iPhone 14 Pro
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    });
    
    const mobilePage = await mobileContext.newPage();
    
    // Navigate to the app
    await mobilePage.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    // Wait for app to load
    await mobilePage.waitForTimeout(3000);
    
    // Inject test user ID
    await mobilePage.evaluate((userId) => {
      localStorage.setItem('userId', userId);
    }, testUserId);
    
    // Reload to apply user ID
    await mobilePage.reload({ waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(2000);
    
    // Wait for content
    try {
      await Promise.race([
        mobilePage.waitForSelector('[data-testid="todo-item"]', { timeout: 10000 }),
        mobilePage.waitForSelector('[data-testid="empty-state"]', { timeout: 10000 }),
        mobilePage.waitForSelector('text="No todos yet"', { timeout: 10000 }),
      ]);
    } catch (error) {
      console.log('Warning: Could not detect todo content on mobile, proceeding...');
    }
    
    // 4. Mobile home screen
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, '04-mobile-home.png'),
      fullPage: false,
    });
    
    // 5. Mobile with add todo
    const mobileAddButton = await mobilePage.$('button:has-text("Add Todo")') || 
                           await mobilePage.$('[data-testid="add-todo-button"]') ||
                           await mobilePage.$('button[aria-label="Add todo"]');
    
    if (mobileAddButton) {
      await mobileAddButton.click();
      await mobilePage.waitForTimeout(1000);
      
      await mobilePage.screenshot({
        path: path.join(screenshotsDir, '05-mobile-add-todo.png'),
        fullPage: false,
      });
      
      // Close the form
      const mobileCancelButton = await mobilePage.$('button:has-text("Cancel")') ||
                                await mobilePage.$('[data-testid="cancel-button"]');
      if (mobileCancelButton) {
        await mobileCancelButton.click();
      } else {
        await mobilePage.keyboard.press('Escape');
      }
      await mobilePage.waitForTimeout(1000);
    }
    
    // 6. Mobile todo swipe actions (if implemented)
    const mobileTodo = await mobilePage.$('[data-testid="todo-item"]') ||
                      await mobilePage.$('.todo-item');
    
    if (mobileTodo) {
      const box = await mobileTodo.boundingBox();
      if (box) {
        // Simulate swipe gesture
        await mobilePage.touchscreen.tap(box.x + box.width - 50, box.y + box.height / 2);
        await mobilePage.waitForTimeout(100);
        await mobilePage.touchscreen.swipe({
          startX: box.x + box.width - 50,
          startY: box.y + box.height / 2,
          endX: box.x + 50,
          endY: box.y + box.height / 2,
          steps: 10,
        }).catch(() => {
          // Fallback to mouse if touchscreen not supported
          mobilePage.mouse.move(box.x + box.width - 50, box.y + box.height / 2);
          mobilePage.mouse.down();
          mobilePage.mouse.move(box.x + 50, box.y + box.height / 2, { steps: 10 });
          mobilePage.mouse.up();
        });
        
        await mobilePage.waitForTimeout(1000);
        
        await mobilePage.screenshot({
          path: path.join(screenshotsDir, '06-mobile-swipe-actions.png'),
          fullPage: false,
        });
      }
    }
    
    await mobileContext.close();
    
    console.log('✅ Screenshots taken successfully');
    
    // List all screenshots created
    const screenshots = fs
      .readdirSync(screenshotsDir)
      .filter((file) => file.endsWith('.png'))
      .sort();
    
    console.log('Created screenshots:');
    screenshots.forEach((file) => console.log(`  - ${file}`));
    
  } catch (error) {
    console.error('Error taking screenshots:', error);
    
    // Take error screenshot for debugging
    const errorContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const errorPage = await errorContext.newPage();
    
    try {
      await errorPage.goto('http://localhost:3000', { timeout: 30000 });
      await errorPage.screenshot({
        path: path.join(screenshotsDir, 'error-screenshot.png'),
        fullPage: true,
      });
    } catch (e) {
      console.error('Could not take error screenshot:', e);
    }
    
    await errorContext.close();
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  takeScreenshots().catch(console.error);
}

module.exports = { takeScreenshots };