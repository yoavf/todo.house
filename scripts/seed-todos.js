const fs = require('node:fs');
const path = require('node:path');

// Generate seed data for screenshots
function generateSeedData() {
  const seedData = {
    todos: [
      {
        id: 'todo-1',
        title: 'Review pull request #42',
        description: 'Review the new authentication feature implementation and provide feedback on security concerns',
        completed: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'todo-2',
        title: 'Update API documentation',
        description: 'Add the new endpoints to the Swagger documentation and update examples',
        completed: false,
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'todo-3',
        title: 'Fix database migration issue',
        description: 'Investigate and fix the failing migration in the staging environment',
        completed: false,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'todo-4',
        title: 'Implement user analytics',
        description: 'Add basic analytics tracking for user actions using Mixpanel',
        completed: false,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'todo-5',
        title: 'Deploy hotfix to production',
        description: 'Deploy the authentication bug fix after QA approval',
        completed: true,
        completed_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'todo-6',
        title: 'Write unit tests for new feature',
        description: 'Add comprehensive test coverage for the payment processing module',
        completed: true,
        completed_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
    ],
  };

  return seedData;
}

// Save seed data to file
function saveSeedData() {
  const seedData = generateSeedData();
  const seedDataPath = path.join(process.cwd(), 'seed-data.json');
  
  fs.writeFileSync(seedDataPath, JSON.stringify(seedData, null, 2));
  console.log(`✅ Seed data saved to ${seedDataPath}`);
  console.log(`📊 Generated ${seedData.todos.length} todos (${seedData.todos.filter(t => t.completed).length} completed)`);
  
  return seedData;
}

// Export for use in other scripts
module.exports = { generateSeedData, saveSeedData };

// Run if called directly
if (require.main === module) {
  saveSeedData();
}