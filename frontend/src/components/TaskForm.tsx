'use client';

import { useState } from 'react';
import { TaskCreate, TaskStatus } from '@/lib/api';
import { DatePicker } from './DatePicker';

interface TaskFormProps {
  onSubmit: (task: TaskCreate) => void;
}

export function TaskForm({ onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [snoozedUntil, setSnoozedUntil] = useState<string | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const status = snoozedUntil ? TaskStatus.SNOOZED : TaskStatus.ACTIVE;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      completed: false,
      status,
      snoozed_until: snoozedUntil || null,
    });

    setTitle('');
    setDescription('');
    setSnoozedUntil(undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-lg font-semibold">Add New Task</h2>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        className="w-full px-3 py-2 border rounded"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Task description (optional)"
        className="w-full px-3 py-2 border rounded"
        rows={3}
      />
      <div>
        <label className="block text-sm font-medium mb-1">Snooze Until (optional)</label>
        <DatePicker
          value={snoozedUntil}
          onChange={setSnoozedUntil}
          className="w-full"
          placeholder="Select snooze date and time"
        />
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add Task
      </button>
    </form>
  );
}