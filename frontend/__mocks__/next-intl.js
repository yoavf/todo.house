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
