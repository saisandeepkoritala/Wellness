export interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  description?: string;
  calories: number;
  fats: number;
  carbs: number;
  protein: number;
  time: string;
}

export interface Workout {
  id: string;
  completed: boolean;
  workoutType: string;
  weights?: number;
  reps?: number;
  intensity?: 'low' | 'medium' | 'high';
  time: string;
}

export interface SkincareStep {
  id: string;
  name: string;
  category: 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'sunscreen' | 'mask' | 'exfoliator' | 'custom';
  completed: boolean;
  order: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

export interface DailyData {
  date: string;
  meals: Meal[];
  workouts: Workout[];
  skincare: SkincareStep[];
  tasks: Task[];
}

export interface WellnessStats {
  totalCalories: number;
  totalFats: number;
  totalCarbs: number;
  totalProtein: number;
  workoutsCompleted: number;
  skincareStepsCompleted: number;
  tasksCompleted: number;
  totalTasks: number;
}

export interface SkincareRoutine {
  morning: SkincareStep[];
  evening: SkincareStep[];
}
