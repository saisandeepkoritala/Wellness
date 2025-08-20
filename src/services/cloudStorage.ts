import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { DailyData, Meal, Workout, SkincareStep, Task, SkincareRoutine } from '../types';

// Helper function to get user-specific document references
const getUserDoc = (userId: string, date: string) => doc(db, 'users', userId, 'dailyData', date);
const getUserRoutineDoc = (userId: string) => doc(db, 'users', userId, 'settings', 'skincareRoutine');

export const cloudStorage = {
  // Save daily data to cloud
  saveDailyData: async (userId: string, date: string, data: Partial<DailyData>): Promise<void> => {
    const docRef = getUserDoc(userId, date);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Update existing data
      const existingData = docSnap.data() as DailyData;
      const updatedData = {
        ...existingData,
        ...data,
      };
      await setDoc(docRef, updatedData);
    } else {
      // Create new data
      const newData: DailyData = {
        date,
        meals: data.meals || [],
        workouts: data.workouts || [],
        skincare: data.skincare || [],
        tasks: data.tasks || [],
        ...data,
      };
      await setDoc(docRef, newData);
    }
  },

  // Get daily data from cloud
  getDailyData: async (userId: string, date: string): Promise<DailyData> => {
    const docRef = getUserDoc(userId, date);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as DailyData;
    } else {
      return {
        date,
        meals: [],
        workouts: [],
        skincare: [],
        tasks: [],
      };
    }
  },

  // Get all data for a user
  getAllData: async (userId: string): Promise<Record<string, DailyData>> => {
    const userCollectionRef = collection(db, 'users', userId, 'dailyData');
    const querySnapshot = await getDocs(userCollectionRef);
    
    const allData: Record<string, DailyData> = {};
    querySnapshot.forEach((doc) => {
      allData[doc.id] = doc.data() as DailyData;
    });
    
    return allData;
  },

  // Add meal to cloud
  addMeal: async (userId: string, date: string, meal: Omit<Meal, 'id'>): Promise<void> => {
    const dailyData = await cloudStorage.getDailyData(userId, date);
    const newMeal: Meal = {
      ...meal,
      id: Date.now().toString(),
    };
    
    await cloudStorage.saveDailyData(userId, date, {
      meals: [...dailyData.meals, newMeal],
    });
  },

  // Add workout to cloud
  addWorkout: async (userId: string, date: string, workout: Omit<Workout, 'id'>): Promise<void> => {
    const dailyData = await cloudStorage.getDailyData(userId, date);
    const newWorkout: Workout = {
      ...workout,
      id: Date.now().toString(),
    };
    
    await cloudStorage.saveDailyData(userId, date, {
      workouts: [...dailyData.workouts, newWorkout],
    });
  },

  // Add task to cloud
  addTask: async (userId: string, date: string, task: Omit<Task, 'id'>): Promise<void> => {
    const dailyData = await cloudStorage.getDailyData(userId, date);
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
    };
    
    await cloudStorage.saveDailyData(userId, date, {
      tasks: [...dailyData.tasks, newTask],
    });
  },

  // Update skincare in cloud
  updateSkincare: async (userId: string, date: string, skincare: SkincareStep[]): Promise<void> => {
    await cloudStorage.saveDailyData(userId, date, { skincare });
  },

  // Update task in cloud
  updateTask: async (userId: string, date: string, taskId: string, updates: Partial<Task>): Promise<void> => {
    const dailyData = await cloudStorage.getDailyData(userId, date);
    const updatedTasks = dailyData.tasks.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    );
    
    await cloudStorage.saveDailyData(userId, date, { tasks: updatedTasks });
  },

  // Update workout in cloud
  updateWorkout: async (userId: string, date: string, workoutId: string, updates: Partial<Workout>): Promise<void> => {
    const dailyData = await cloudStorage.getDailyData(userId, date);
    const updatedWorkouts = dailyData.workouts.map(workout =>
      workout.id === workoutId ? { ...workout, ...updates } : workout
    );
    
    await cloudStorage.saveDailyData(userId, date, { workouts: updatedWorkouts });
  },

  // Delete item from cloud
  deleteItem: async (userId: string, date: string, type: 'meal' | 'workout' | 'task', id: string): Promise<void> => {
    const dailyData = await cloudStorage.getDailyData(userId, date);
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
    
    await cloudStorage.saveDailyData(userId, date, updatedData);
  },

  // Save skincare routine to cloud
  saveSkincareRoutine: async (userId: string, routine: SkincareRoutine): Promise<void> => {
    const docRef = getUserRoutineDoc(userId);
    await setDoc(docRef, routine);
  },

  // Get skincare routine from cloud
  getSkincareRoutine: async (userId: string): Promise<SkincareRoutine> => {
    const docRef = getUserRoutineDoc(userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as SkincareRoutine;
    } else {
      // Return default routine
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
      
      // Save default routine to cloud
      await cloudStorage.saveSkincareRoutine(userId, defaultRoutine);
      return defaultRoutine;
    }
  },

  // Real-time data subscription
  subscribeToDailyData: (userId: string, date: string, callback: (data: DailyData) => void) => {
    const docRef = getUserDoc(userId, date);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as DailyData);
      } else {
        callback({
          date,
          meals: [],
          workouts: [],
          skincare: [],
          tasks: [],
        });
      }
    });
  },

  // Get data statistics
  getDataStats: async (userId: string): Promise<{ totalDays: number; totalMeals: number; totalWorkouts: number; totalTasks: number }> => {
    const allData = await cloudStorage.getAllData(userId);
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
  },
};
