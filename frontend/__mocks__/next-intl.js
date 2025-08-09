// Mock for next-intl
const mockTranslations = {
	"common.delete": "Delete",
	"common.cancel": "Cancel",
	"common.confirm": "Confirm",
	"common.save": "Save",
	"common.edit": "Edit",
	"common.loading": "Loading...",
	"common.ok": "OK",
	"common.goBack": "Go Back",
	"common.addTask": "Add Task",
	"common.doIt": "Do it",
	"common.snooze": "Snooze",
	"common.unsnooze": "Unsnooze",
	"common.complete": "Complete",
	"common.selectDate": "Select date",
	"dialogs.deleteConfirm": 'Are you sure you want to delete "{title}"?',
	"dialogs.deleteTask": "Delete Task",
	"dialogs.deleteTaskDescription":
		'Are you sure you want to delete "{title}"? This action cannot be undone.',
	"dialogs.unsavedChanges":
		"You have unsaved changes. Are you sure you want to leave?",
	"dialogs.error": "Error",
	"time.tomorrow": "Tomorrow",
	"time.thisWeekend": "This weekend",
	"time.nextWeek": "Next week",
	"time.later": "Later",
	"time.andTime": "and time",
	"time.estimatedTime": "Estimated time",
	"tasks.actions.snoozeTask": "Snooze until",
	"tasks.actions.reviewTask": "Review Your Task",
	"tasks.actions.createTask": "Create Task",
	"tasks.actions.viewTask": "View Task",
	"tasks.actions.editTask": "Edit Task",
	"tasks.actions.deleteTask": "Delete Task",
	"tasks.actions.completeTask": "Complete Task",
	"common.selectAll": "Select all",
	"common.clearAll": "Clear all",
	"common.creating": "Creating...",
	"tasks.actions.addManually": "Add Manually",
	"tasks.actions.createTasks": "Create {count} Tasks",
	"tasks.generation.modalTitle": "AI Generated Tasks",
	"tasks.generation.noTasksFound": "No tasks were detected in the image.",
	"tasks.generation.tryManual": "You can try adding a task manually.",
	"tasks.generation.tasksFound": "Found {count} tasks",
	"tasks.generation.processedIn": "Processed in {time}s",
	"tasks.generation.selected": "{selected} of {total} selected",
	"tasks.placeholders.taskTitlePlaceholder": "Enter your task here",
	"tasks.placeholders.descriptionPlaceholder": "Add any additional details...",
	"tasks.actions.continueManually": "Continue manually",
	"tasks.actions.completeWithAI": "Complete with AI",
	"tasks.fields.title": "What needs to be done",
	"tasks.fields.location": "Location",
	"tasks.fields.descriptionOptional": "Description (optional)",
};

const useTranslations = jest.fn(() => {
	return jest.fn((key, params) => {
		let translation = mockTranslations[key] || key;

		// Handle parameter interpolation
		if (params && typeof translation === "string") {
			Object.keys(params).forEach((param) => {
				translation = translation.replace(`{${param}}`, params[param]);
			});
		}

		return translation;
	});
});

const useLocale = jest.fn(() => "en");

const NextIntlClientProvider = ({ children }) => children;

module.exports = {
	useTranslations,
	useLocale,
	NextIntlClientProvider,
};
