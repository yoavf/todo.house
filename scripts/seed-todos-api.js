const fetch = require('node-fetch');

// Create todos via API for screenshots
async function seedTodosViaAPI() {
  
  const apiUrl = process.env.API_URL || 'http://localhost:8000';
  // Use a valid UUID for the test user
  const userId = process.env.TEST_USER_ID || '550e8400-e29b-41d4-a716-446655440000';
  
  const todos = [
    {
      title: 'Review pull request #42',
      description: 'Review the new authentication feature implementation and provide feedback on security concerns',
      completed: false,
    },
    {
      title: 'Update API documentation',
      description: 'Add the new endpoints to the Swagger documentation and update examples',
      completed: false,
    },
    {
      title: 'Fix database migration issue',
      description: 'Investigate and fix the failing migration in the staging environment',
      completed: false,
    },
    {
      title: 'Implement user analytics',
      description: 'Add basic analytics tracking for user actions using Mixpanel',
      completed: false,
    },
    {
      title: 'Deploy hotfix to production',
      description: 'Deploy the authentication bug fix after QA approval',
      completed: true,
    },
    {
      title: 'Write unit tests for new feature',
      description: 'Add comprehensive test coverage for the payment processing module',
      completed: true,
    },
  ];
  
  console.log(`📡 Seeding todos via API at ${apiUrl}`);
  
  for (const todo of todos) {
    try {
      const response = await fetch(`${apiUrl}/tasks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
        body: JSON.stringify(todo),
      });
      
      if (response.ok) {
        const created = await response.json();
        console.log(`✅ Created: ${todo.title} (${created.id})`);
      } else {
        console.error(`❌ Failed to create: ${todo.title} - ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Error creating todo: ${error.message}`);
    }
  }
  
  console.log('🎉 Seeding complete!');
}

// Run if called directly
if (require.main === module) {
  seedTodosViaAPI().catch(console.error);
}

module.exports = { seedTodosViaAPI };