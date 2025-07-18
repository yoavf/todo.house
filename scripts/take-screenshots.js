// Check if enhanced script exists, otherwise use basic functionality
const fs = require('fs');
const path = require('path');

const enhancedScriptPath = path.join(__dirname, 'take-screenshots-enhanced.js');

if (fs.existsSync(enhancedScriptPath)) {
  // Use the enhanced script if available
  require(enhancedScriptPath);
} else {
  // Fallback to basic functionality
  const { chromium } = require('playwright');

  async function takeScreenshots() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, // iPhone 14 Pro dimensions
      deviceScaleFactor: 3,
    });
    
    const page = await context.newPage();
    
    // Create screenshots directory
    const screenshotsDir = path.join(process.cwd(), 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir);
    }
    
    try {
      // Navigate to the Expo web app
      await page.goto('http://localhost:8081', { 
        waitUntil: 'networkidle',
        timeout: 60000 
      });
      
      // Wait for app to fully load
      await page.waitForTimeout(5000);
      
      // Take screenshot of home screen
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'home-screen.png'),
        fullPage: false 
      });
      
      // Try to interact with the app and take more screenshots
      // Click on FAB if exists
      const fabButton = await page.$('[aria-label="Add task"]');
      if (fabButton) {
        await fabButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ 
          path: path.join(screenshotsDir, 'add-task-menu.png'),
          fullPage: false 
        });
      }
      
      console.log('Screenshots taken successfully');
    } catch (error) {
      console.error('Error taking screenshots:', error);
    } finally {
      await browser.close();
    }
  }

  takeScreenshots().catch(console.error);
}