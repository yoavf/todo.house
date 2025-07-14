export interface Task {
  id: string;
  title: string;
  location?: string;
  createdAt: Date;
  completed: boolean;
}