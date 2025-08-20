import React, { useState, useEffect } from 'react';
import { format, subDays, addDays } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, LogOut, User, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cloudStorage } from '../services/cloudStorage';
import { WellnessStats, Task } from '../types';
import MealTracker from './MealTracker';
import WorkoutTracker from './WorkoutTracker';
import SkincareTracker from './SkincareTracker';
import TaskTracker from './TaskTracker';

interface DashboardProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ selectedDate, onDateChange }) => {
  const [activeTab, setActiveTab] = useState<'meals' | 'workouts' | 'skincare' | 'tasks'>('meals');
  const [stats, setStats] = useState<WellnessStats>({
    totalCalories: 0,
    totalFats: 0,
    totalCarbs: 0,
    totalProtein: 0,
    workoutsCompleted: 0,
    skincareStepsCompleted: 0,
    tasksCompleted: 0,
    totalTasks: 0,
  });
  const [tomorrowsTasks, setTomorrowsTasks] = useState<Task[]>([]);
  const [showQuickAddTask, setShowQuickAddTask] = useState(false);
  const [quickTaskForm, setQuickTaskForm] = useState({
    title: '',
    priority: 'medium' as const,
  });
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    const loadDailyData = async () => {
      if (!currentUser) return;
      
      try {
        const dailyData = await cloudStorage.getDailyData(currentUser.uid, selectedDate);
        
        // Calculate daily stats
        const dailyStats: WellnessStats = {
          totalCalories: dailyData.meals.reduce((sum, meal) => sum + meal.calories, 0),
          totalFats: dailyData.meals.reduce((sum, meal) => sum + meal.fats, 0),
          totalCarbs: dailyData.meals.reduce((sum, meal) => sum + meal.carbs, 0),
          totalProtein: dailyData.meals.reduce((sum, meal) => sum + meal.protein, 0),
          workoutsCompleted: dailyData.workouts.filter(w => w.completed).length,
          skincareStepsCompleted: dailyData.skincare.filter(s => s.completed).length,
          tasksCompleted: dailyData.tasks.filter(t => t.completed).length,
          totalTasks: dailyData.tasks.length,
        };
        
        setStats(dailyStats);
      } catch (error) {
        console.error('Error loading daily data:', error);
      }
    };

    const loadTomorrowsTasks = async () => {
      if (!currentUser) return;
      
      try {
        const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
        console.log('Loading tasks for tomorrow:', tomorrow);
        const tomorrowData = await cloudStorage.getDailyData(currentUser.uid, tomorrow);
        setTomorrowsTasks(tomorrowData.tasks);
      } catch (error) {
        console.error('Error loading tomorrow\'s tasks:', error);
      }
    };

    loadDailyData();
    loadTomorrowsTasks();
  }, [selectedDate, currentUser]);

  // Get today's date in local timezone
  const getTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate + 'T00:00:00'); // Ensure consistent time
    let newDate: Date;
    
    if (direction === 'prev') {
      newDate = subDays(currentDate, 1);
    } else {
      newDate = addDays(currentDate, 1);
      
      // Only allow going up to today's date
      const todayString = getTodayString();
      const newDateString = format(newDate, 'yyyy-MM-dd');
      
      if (newDateString > todayString) {
        return; // Don't allow going beyond today
      }
    }
    
    onDateChange(format(newDate, 'yyyy-MM-dd'));
  };

  // Check if next button should be disabled (only if we're at today's date)
  const todayString = getTodayString();
  const currentDateString = selectedDate;
  const isNextDisabled = currentDateString >= todayString;
  
  // Debug logging
  const now = new Date();
  console.log('Today (raw):', now);
  console.log('Today (formatted):', todayString);
  console.log('Selected Date:', currentDateString);
  console.log('Is Next Disabled:', isNextDisabled);
  console.log('Timezone offset:', now.getTimezoneOffset());
  console.log('Current time:', now.toLocaleString());

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleDeleteTomorrowTask = async (taskId: string) => {
    if (!currentUser) return;

    try {
      const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      const tomorrowData = await cloudStorage.getDailyData(currentUser.uid, tomorrow);
      const updatedTasks = tomorrowData.tasks.filter(task => task.id !== taskId);
      await cloudStorage.saveDailyData(currentUser.uid, tomorrow, { ...tomorrowData, tasks: updatedTasks });
      setTomorrowsTasks(updatedTasks);
    } catch (error) {
      console.error('Error deleting tomorrow\'s task:', error);
    }
  };

  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskForm.title.trim() || !currentUser) return;

    try {
      const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      const newTask = {
        id: Date.now().toString(),
        title: quickTaskForm.title.trim(),
        description: '',
        priority: quickTaskForm.priority,
        completed: false,
      };

      await cloudStorage.addTask(currentUser.uid, tomorrow, {
        title: quickTaskForm.title.trim(),
        description: '',
        priority: quickTaskForm.priority,
        completed: false,
      });

      setTomorrowsTasks([...tomorrowsTasks, newTask]);
      setQuickTaskForm({ title: '', priority: 'medium' });
      setShowQuickAddTask(false);
    } catch (error) {
      console.error('Error adding quick task:', error);
    }
  };

  const handleNavigateToTasksToday = () => {
    setActiveTab('tasks');
    // Set to today's date for general task management
    const today = format(new Date(), 'yyyy-MM-dd');
    console.log('Navigating to today:', today);
    onDateChange(today);
  };

  const handleNavigateToTasksPlanning = () => {
    setActiveTab('tasks');
    // Navigate to tomorrow's date for task planning
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    console.log('Navigating to tomorrow:', tomorrow);
    onDateChange(tomorrow);
  };

  const tabs = [
    { id: 'meals', label: 'Meals', icon: '🍽️' },
    { id: 'workouts', label: 'Workouts', icon: '💪' },
    { id: 'skincare', label: 'Skincare', icon: '✨' },
    { id: 'tasks', label: 'Tasks', icon: '📝' },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wellness Tracker</h1>
          <p className="text-gray-600">Track your daily wellness journey</p>
        </div>
        <div className="flex items-center gap-4">
          {/* User Profile */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg shadow-sm">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {currentUser?.email}
            </span>
          </div>
          
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDateChange('prev')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-900">
                {(() => {
                  const [year, month, day] = selectedDate.split('-').map(Number);
                  const date = new Date(year, month - 1, day);
                  return format(date, 'MMMM d, yyyy');
                })()}
              </span>
            </div>
            <button
              onClick={() => handleDateChange('next')}
              className={`p-2 rounded-lg transition-colors ${
                isNextDisabled 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              disabled={isNextDisabled}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDateChange(getTodayString())}
              className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Daily Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="wellness-card bg-orange-50 border-orange-200">
          <div className="text-sm text-orange-600 font-medium">Calories</div>
          <div className="text-2xl font-bold text-orange-700">{stats.totalCalories}</div>
        </div>
        <div className="wellness-card bg-green-50 border-green-200">
          <div className="text-sm text-green-600 font-medium">Workouts</div>
          <div className="text-2xl font-bold text-green-700">{stats.workoutsCompleted}</div>
        </div>
        <div className="wellness-card bg-purple-50 border-purple-200">
          <div className="text-sm text-purple-600 font-medium">Skincare</div>
          <div className="text-2xl font-bold text-purple-700">{stats.skincareStepsCompleted}</div>
        </div>
        <div className="wellness-card bg-blue-50 border-blue-200">
          <div className="text-sm text-blue-600 font-medium">Tasks</div>
          <div className="text-2xl font-bold text-blue-700">
            {stats.totalTasks > 0 ? Math.round((stats.tasksCompleted / stats.totalTasks) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Summary Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          📊 Daily Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Meal Summary */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2">
              🍽️ Meal Summary
            </h4>
            <div className="space-y-4">
              {/* Calorie Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Calories</span>
                  <span className="text-sm text-gray-600">{stats.totalCalories}/1200</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((stats.totalCalories / 1200) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Macronutrients Chart */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{stats.totalProtein.toFixed(1)}g</div>
                  <div className="text-xs text-blue-500">Protein</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600">{stats.totalCarbs.toFixed(1)}g</div>
                  <div className="text-xs text-yellow-500">Carbs</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">{stats.totalFats.toFixed(1)}g</div>
                  <div className="text-xs text-red-500">Fats</div>
                </div>
              </div>
            </div>
          </div>

          {/* Workout Summary */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2">
              💪 Workout Summary
            </h4>
            <div className="space-y-4">
              {/* Workout Count */}
              <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-2">{stats.workoutsCompleted}</div>
                <div className="text-sm text-green-600 font-medium">Workouts Completed</div>
                <div className="text-xs text-green-500 mt-1">Today</div>
              </div>

              {/* Workout Progress Rings */}
              <div className="flex justify-center space-x-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border-4 border-gray-200 flex items-center justify-center mb-1">
                    <div className={`w-8 h-8 rounded-full ${stats.workoutsCompleted >= 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                  <div className="text-xs text-gray-600">1+</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border-4 border-gray-200 flex items-center justify-center mb-1">
                    <div className={`w-8 h-8 rounded-full ${stats.workoutsCompleted >= 2 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                  <div className="text-xs text-gray-600">2+</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border-4 border-gray-200 flex items-center justify-center mb-1">
                    <div className={`w-8 h-8 rounded-full ${stats.workoutsCompleted >= 3 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                  <div className="text-xs text-gray-600">3+</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Today's Goals:</span>
              <div className="flex gap-1">
                <div className={`w-3 h-3 rounded-full ${stats.totalCalories >= 1200 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className={`w-3 h-3 rounded-full ${stats.totalProtein >= 50 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className={`w-3 h-3 rounded-full ${stats.totalCarbs >= 130 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className={`w-3 h-3 rounded-full ${stats.workoutsCompleted >= 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {Math.round([
                stats.totalCalories >= 1200,
                stats.totalProtein >= 50,
                stats.totalCarbs >= 130,
                stats.workoutsCompleted >= 1
              ].filter(Boolean).length / 4 * 100)}% Complete
            </div>
          </div>
        </div>
      </div>

      {/* Nutrition Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          Nutrition Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600">Fats</div>
            <div className="text-xl font-bold text-red-600">{stats.totalFats.toFixed(1)}g</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Carbs</div>
            <div className="text-xl font-bold text-yellow-600">{stats.totalCarbs.toFixed(1)}g</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Protein</div>
            <div className="text-xl font-bold text-blue-600">{stats.totalProtein.toFixed(1)}g</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-xl font-bold text-orange-600">{stats.totalCalories} cal</div>
          </div>
        </div>
      </div>

      {/* Tomorrow's Tasks Preview */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Tomorrow's Tasks ({tomorrowsTasks.length})
          </h3>
          <button
            onClick={() => setShowQuickAddTask(!showQuickAddTask)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {showQuickAddTask ? 'Cancel' : '+ Quick Add'}
          </button>
        </div>

        {/* Quick Add Task Form */}
        {showQuickAddTask && (
          <form onSubmit={handleQuickAddTask} className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={quickTaskForm.title}
                onChange={(e) => setQuickTaskForm({ ...quickTaskForm, title: e.target.value })}
                placeholder="Enter task title..."
                className="input-field flex-1"
                required
              />
              <select
                value={quickTaskForm.priority}
                onChange={(e) => setQuickTaskForm({ ...quickTaskForm, priority: e.target.value as any })}
                className="input-field w-24"
              >
                <option value="low">Low</option>
                <option value="medium">Med</option>
                <option value="high">High</option>
              </select>
              <button type="submit" className="btn-primary">
                Add
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {tomorrowsTasks.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>No tasks planned for tomorrow yet</p>
              <button
                onClick={handleNavigateToTasksPlanning}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Plan tasks for tomorrow →
              </button>
            </div>
          ) : (
            tomorrowsTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${
                  task.priority === 'high' ? 'bg-red-500' :
                  task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-gray-600">{task.description}</p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  task.priority === 'high' ? 'bg-red-100 text-red-700' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                }`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
                <button
                  onClick={() => handleDeleteTomorrowTask(task.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {tomorrowsTasks.length > 0 ? `${tomorrowsTasks.length} task${tomorrowsTasks.length === 1 ? '' : 's'} for ${format(addDays(new Date(), 1), 'MMMM d, yyyy')}` : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleNavigateToTasksPlanning}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Plan for tomorrow →
            </button>
            <button
              onClick={handleNavigateToTasksToday}
              className="text-gray-600 hover:text-gray-700 text-sm font-medium"
            >
              Manage today's tasks →
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'meals' && <MealTracker selectedDate={selectedDate} />}
        {activeTab === 'workouts' && <WorkoutTracker selectedDate={selectedDate} />}
        {activeTab === 'skincare' && <SkincareTracker selectedDate={selectedDate} />}
        {activeTab === 'tasks' && <TaskTracker selectedDate={selectedDate} />}
      </div>
    </div>
  );
};

export default Dashboard;
