'use client';

import { useState, useEffect } from 'react';
import { Task, TaskCreate, TaskUpdate, tasksAPI } from '@/lib/api';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await tasksAPI.getTasks();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (taskData: TaskCreate) => {
    try {
      const newTask = await tasksAPI.createTask(taskData);
      setTasks([...tasks, newTask]);
    } catch (err) {
      setError('Failed to create task');
      console.error(err);
    }
  };

  const handleUpdate = async (id: number, update: TaskUpdate) => {
    try {
      const updatedTask = await tasksAPI.updateTask(id, update);
      setTasks(tasks.map(task => task.id === id ? updatedTask : task));
    } catch (err) {
      setError('Failed to update task');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await tasksAPI.deleteTask(id);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (err) {
      setError('Failed to delete task');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading tasks...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">My Tasks</h1>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <TaskForm onSubmit={handleCreate} />

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No tasks yet. Create your first task above!
          </p>
        ) : (
          tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}