import React from 'react';
import { TaskItem as TaskItemType } from '../types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: TaskItemType[];
  onUpdateTask: (id: string, updates: Partial<TaskItemType>) => void;
  onDeleteTask: (id: string) => void;
  title: string;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onUpdateTask, onDeleteTask, title }) => {
  return (
    <div className="content-card p-6 sm:p-8 shadow-xl mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{title}</h3>
        <span className="text-[10px] font-black bg-[var(--accent)]/10 text-[var(--accent)] px-3 py-1 rounded-full uppercase tracking-widest">
          {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
        </span>
      </div>
      
      <div className="space-y-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onUpdate={onUpdateTask} 
              onDelete={onDeleteTask}
              isOverdue={false} // Logic for overdue can be added here or passed down
            />
          ))
        ) : (
          <div className="py-12 text-center opacity-30">
            <p className="text-[10px] font-black uppercase tracking-widest">No tasks for this section</p>
          </div>
        )}
      </div>
    </div>
  );
};
