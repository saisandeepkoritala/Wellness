import { DailyData, Meal, Workout, SkincareStep, Task, SkincareRoutine } from '../types';

const STORAGE_KEY = 'wellness-tracker-data';
const SKINCARE_ROUTINE_KEY = 'wellness-tracker-skincare-routine';

export const saveDailyData = (date: string, data: Partial<DailyData>): void => {
  const existingData = getAllData();
  const existingDateData = existingData[date] || {
    date,
    meals: [],
    workouts: [],
    skincare: [],
    tasks: [],
  };
  const updatedData = {
    ...existingData,
    [date]: {
      ...existingDateData,
      ...data,
    },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
};

export const getDailyData = (date: string): DailyData => {
  const allData = getAllData();
  return allData[date] || {
    date,
    meals: [],
    workouts: [],
    skincare: [],
    tasks: [],
  };
};

export const getAllData = (): Record<string, DailyData> => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
};

export const addMeal = (date: string, meal: Omit<Meal, 'id'>): void => {
  const dailyData = getDailyData(date);
  const newMeal: Meal = {
    ...meal,
    id: Date.now().toString(),
  };
  saveDailyData(date, {
    meals: [...dailyData.meals, newMeal],
  });
};

export const addWorkout = (date: string, workout: Omit<Workout, 'id'>): void => {
  const dailyData = getDailyData(date);
  const newWorkout: Workout = {
    ...workout,
    id: Date.now().toString(),
  };
  saveDailyData(date, {
    workouts: [...dailyData.workouts, newWorkout],
  });
};

export const updateSkincare = (date: string, skincare: SkincareStep[]): void => {
  saveDailyData(date, { skincare });
};

export const addTask = (date: string, task: Omit<Task, 'id'>): void => {
  const dailyData = getDailyData(date);
  const newTask: Task = {
    ...task,
    id: Date.now().toString(),
  };
  saveDailyData(date, {
    tasks: [...dailyData.tasks, newTask],
  });
};

export const updateTask = (date: string, taskId: string, updates: Partial<Task>): void => {
  const dailyData = getDailyData(date);
  const updatedTasks = dailyData.tasks.map(task =>
    task.id === taskId ? { ...task, ...updates } : task
  );
  saveDailyData(date, { tasks: updatedTasks });
};

export const deleteItem = (date: string, type: 'meal' | 'workout' | 'task', id: string): void => {
  const dailyData = getDailyData(date);
  const updatedData = { ...dailyData };
  
  switch (type) {
    case 'meal':
      updatedData.meals = dailyData.meals.filter(meal => meal.id !== id);
      break;
    case 'workout':
      updatedData.workouts = dailyData.workouts.filter(workout => workout.id !== id);
      break;
    case 'task':
      updatedData.tasks = dailyData.tasks.filter(task => task.id !== id);
      break;
  }
  
  saveDailyData(date, updatedData);
};

// Data persistence utilities
export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SKINCARE_ROUTINE_KEY);
};

export const exportData = (): string => {
  const wellnessData = getAllData();
  const skincareRoutine = getSkincareRoutine();
  const exportData = {
    wellnessData,
    skincareRoutine,
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };
  return JSON.stringify(exportData, null, 2);
};

export const importData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    if (data.wellnessData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.wellnessData));
    }
    if (data.skincareRoutine) {
      localStorage.setItem(SKINCARE_ROUTINE_KEY, JSON.stringify(data.skincareRoutine));
    }
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

export const getDataStats = (): { totalDays: number; totalMeals: number; totalWorkouts: number; totalTasks: number } => {
  const allData = getAllData();
  const dates = Object.keys(allData);
  
  const stats = dates.reduce((acc, date) => {
    const dayData = allData[date];
    return {
      totalMeals: acc.totalMeals + dayData.meals.length,
      totalWorkouts: acc.totalWorkouts + dayData.workouts.length,
      totalTasks: acc.totalTasks + dayData.tasks.length,
    };
  }, { totalMeals: 0, totalWorkouts: 0, totalTasks: 0 });

  return {
    totalDays: dates.length,
    ...stats
  };
};

// Ensure data persistence on page load
export const initializeData = (): void => {
  // Check if data exists, if not initialize with empty structure
  const existingData = localStorage.getItem(STORAGE_KEY);
  if (!existingData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
  }
  
  const existingRoutine = localStorage.getItem(SKINCARE_ROUTINE_KEY);
  if (!existingRoutine) {
    const defaultRoutine = getSkincareRoutine(); // This will create and save default routine
    saveSkincareRoutine(defaultRoutine);
  }
};

// Skincare routine management
export const saveSkincareRoutine = (routine: SkincareRoutine): void => {
  localStorage.setItem(SKINCARE_ROUTINE_KEY, JSON.stringify(routine));
};

export const getSkincareRoutine = (): SkincareRoutine => {
  const routine = localStorage.getItem(SKINCARE_ROUTINE_KEY);
  if (routine) {
    return JSON.parse(routine);
  }
  
  // Default routine
  const defaultRoutine: SkincareRoutine = {
    morning: [
      { id: '1', name: 'Gentle Cleanser', category: 'cleanser', completed: false, order: 1 },
      { id: '2', name: 'Toner', category: 'toner', completed: false, order: 2 },
      { id: '3', name: 'Vitamin C Serum', category: 'serum', completed: false, order: 3 },
      { id: '4', name: 'Moisturizer', category: 'moisturizer', completed: false, order: 4 },
      { id: '5', name: 'Sunscreen SPF 30+', category: 'sunscreen', completed: false, order: 5 },
    ],
    evening: [
      { id: '6', name: 'Makeup Remover', category: 'cleanser', completed: false, order: 1 },
      { id: '7', name: 'Gentle Cleanser', category: 'cleanser', completed: false, order: 2 },
      { id: '8', name: 'Toner', category: 'toner', completed: false, order: 3 },
      { id: '9', name: 'Retinol Serum', category: 'serum', completed: false, order: 4 },
      { id: '10', name: 'Night Cream', category: 'moisturizer', completed: false, order: 5 },
    ],
  };
  
  saveSkincareRoutine(defaultRoutine);
  return defaultRoutine;
};
