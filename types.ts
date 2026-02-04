export interface RoutineItem {
  id: string;
  label: string;
  duration: number; // in minutes
  isFixed?: boolean;
  fixedStartTime?: number; // minutes from start of day
}

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  isDaily?: boolean;
  isAlert?: boolean;
  createdAt?: string; // ISO date
}

export interface CardItem {
  id: string;
  title: string;
  image: string;
  info: string;
}

export type Tab = 'routine' | 'tasks' | 'goals' | 'dreams';
export type Theme = 'default' | 'green-leaves' | 'aroma-coffee' | 'honeycomb' | 'blue-winter' | 'dark-night' | 'custom';
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sunday = 0, Monday = 1...