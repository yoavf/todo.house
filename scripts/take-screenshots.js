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
    // Test user ID from environment
    const testUserId = process.env.NEXT_PUBLIC_TEST_USER_ID || '550e8400-e29b-41d4-a716-446655440000';
    
    console.log('📸 Taking desktop screenshots...');
    
    // Desktop context
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    
    const desktopPage = await desktopContext.newPage();
    
    // Navigate to app
    await desktopPage.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    // Set user ID in localStorage
    await desktopPage.evaluate((userId) => {
      localStorage.setItem('userId', userId);
    }, testUserId);
    
    // Reload to apply user ID
    await desktopPage.reload({ waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(2000);
    
    // Wait for content
    try {
      await desktopPage.waitForSelector('[data-testid="todo-item"], [data-testid="empty-state"], text="No todos yet"', { 
        timeout: 10000 
      });
    } catch (error) {
      console.log('⚠️  Could not detect todo content, continuing...');
    }
    
    // 1. Desktop home view
    await desktopPage.screenshot({
      path: path.join(screenshotsDir, '01-desktop-home.png'),
      fullPage: false,
    });
    console.log('✅ Captured desktop home');
    
    // 2. Desktop with add todo dialog
    const addButton = await desktopPage.$('button:has-text("Add Todo"), [data-testid="add-todo-button"], button[aria-label="Add todo"]');
    
    if (addButton) {
      await addButton.click();
      await desktopPage.waitForTimeout(1000);
      
      // Fill form
      const titleInput = await desktopPage.$('input[placeholder*="title" i], input[name="title"], [data-testid="todo-title-input"]');
      if (titleInput) {
        await titleInput.fill('Review pull request #42');
        
        const descInput = await desktopPage.$('textarea[placeholder*="description" i], textarea[name="description"], [data-testid="todo-description-input"]');
        if (descInput) {
          await descInput.fill('Review the new feature implementation and provide feedback');
        }
      }
      
      await desktopPage.screenshot({
        path: path.join(screenshotsDir, '02-desktop-add-todo.png'),
        fullPage: false,
      });
      console.log('✅ Captured desktop add todo');
      
      // Close dialog
      await desktopPage.keyboard.press('Escape');
      await desktopPage.waitForTimeout(1000);
    }
    
    // 3. Desktop with todo hover
    const todoItem = await desktopPage.$('[data-testid="todo-item"], .todo-item, li:has-text("todo")');
    if (todoItem) {
      await todoItem.hover();
      await desktopPage.waitForTimeout(500);
      
      await desktopPage.screenshot({
        path: path.join(screenshotsDir, '03-desktop-todo-hover.png'),
        fullPage: false,
      });
      console.log('✅ Captured desktop todo hover');
    }
    
    await desktopContext.close();
    
    // Mobile screenshots
    console.log('📱 Taking mobile screenshots...');
    
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 }, // iPhone 14 Pro
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    });
    
    const mobilePage = await mobileContext.newPage();
    
    // Navigate to app
    await mobilePage.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    // Set user ID
    await mobilePage.evaluate((userId) => {
      localStorage.setItem('userId', userId);
    }, testUserId);
    
    await mobilePage.reload({ waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(2000);
    
    // Wait for content
    try {
      await mobilePage.waitForSelector('[data-testid="todo-item"], [data-testid="empty-state"], text="No todos yet"', { 
        timeout: 10000 
      });
    } catch (error) {
      console.log('⚠️  Could not detect todo content on mobile, continuing...');
    }
    
    // 4. Mobile home
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, '04-mobile-home.png'),
      fullPage: false,
    });
    console.log('✅ Captured mobile home');
    
    // 5. Mobile add todo
    const mobileAddButton = await mobilePage.$('button:has-text("Add Todo"), [data-testid="add-todo-button"], button[aria-label="Add todo"]');
    if (mobileAddButton) {
      await mobileAddButton.click();
      await mobilePage.waitForTimeout(1000);
      
      await mobilePage.screenshot({
        path: path.join(screenshotsDir, '05-mobile-add-todo.png'),
        fullPage: false,
      });
      console.log('✅ Captured mobile add todo');
      
      await mobilePage.keyboard.press('Escape');
      await mobilePage.waitForTimeout(1000);
    }
    
    // 6. Mobile todo actions
    const mobileTodo = await mobilePage.$('[data-testid="todo-item"], .todo-item');
    if (mobileTodo) {
      const box = await mobileTodo.boundingBox();
      if (box) {
        // Tap to show actions
        await mobilePage.touchscreen.tap(box.x + box.width - 50, box.y + box.height / 2);
        await mobilePage.waitForTimeout(500);
        
        await mobilePage.screenshot({
          path: path.join(screenshotsDir, '06-mobile-todo-actions.png'),
          fullPage: false,
        });
        console.log('✅ Captured mobile todo actions');
      }
    }
    
    await mobileContext.close();
    
    console.log('✅ All screenshots captured successfully!');
    
    // List captured screenshots
    const capturedFiles = fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png'));
    console.log(`\n📁 Captured ${capturedFiles.length} screenshots:`);
    capturedFiles.forEach(f => console.log(`   - ${f}`));
    
  } catch (error) {
    console.error('❌ Error taking screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  takeScreenshots().catch(console.error);
}

module.exports = { takeScreenshots };