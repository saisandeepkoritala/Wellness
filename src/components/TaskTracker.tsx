import React, { useState, useEffect } from 'react';
import { cloudStorage } from '../services/cloudStorage';
import { useAuth } from '../contexts/AuthContext';
import { format, addDays } from 'date-fns';
import { Plus, Trash2, CheckCircle, Circle } from 'lucide-react';
import { Task } from '../types';

interface TaskTrackerProps {
  selectedDate: string;
}

const TaskTracker: React.FC<TaskTrackerProps> = ({ selectedDate }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [taskPlanningDate, setTaskPlanningDate] = useState(selectedDate);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
  });
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadTasks = async () => {
      if (!currentUser) return;
      
      try {
        console.log('TaskTracker: Loading tasks for date:', selectedDate);
        const dailyData = await cloudStorage.getDailyData(currentUser.uid, selectedDate);
        setTasks(dailyData.tasks);
        // Always sync taskPlanningDate with selectedDate
        setTaskPlanningDate(selectedDate);
        console.log('TaskTracker: Set taskPlanningDate to:', selectedDate);
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    };

    loadTasks();
  }, [selectedDate, currentUser]);

  // Update taskPlanningDate whenever selectedDate changes
  useEffect(() => {
    console.log('TaskTracker: selectedDate changed to:', selectedDate);
    setTaskPlanningDate(selectedDate);
  }, [selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !currentUser) return;

    const newTask = {
      id: Date.now().toString(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      completed: false,
    };

    try {
      await cloudStorage.addTask(currentUser.uid, taskPlanningDate, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        completed: false,
      });

      // Update local state immediately if planning for current date
      if (taskPlanningDate === selectedDate) {
        setTasks([...tasks, newTask]);
      }

      setFormData({
        title: '',
        description: '',
        priority: 'medium',
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    if (!currentUser) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      try {
        await cloudStorage.updateTask(currentUser.uid, selectedDate, taskId, { completed: !task.completed });
        // Update local state immediately
        setTasks(tasks.map(t => 
          t.id === taskId ? { ...t, completed: !t.completed } : t
        ));
      } catch (error) {
        console.error('Error updating task:', error);
      }
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!currentUser) return;
    
    try {
      await cloudStorage.deleteItem(currentUser.uid, selectedDate, 'task', taskId);
      // Update local state immediately
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-blue-500" />
          Task Tracker
          {taskPlanningDate !== format(new Date(), 'yyyy-MM-dd') && (
            <span className="text-sm font-normal text-gray-600 bg-blue-100 px-2 py-1 rounded">
              Planning for {format(new Date(taskPlanningDate + 'T00:00:00'), 'MMMM d, yyyy')}
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Task Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="wellness-card bg-blue-50 border-blue-200">
          <div className="text-sm text-blue-600 font-medium">Total Tasks</div>
          <div className="text-2xl font-bold text-blue-700">{totalTasks}</div>
        </div>
        <div className="wellness-card bg-green-50 border-green-200">
          <div className="text-sm text-green-600 font-medium">Completed</div>
          <div className="text-2xl font-bold text-green-700">{completedTasks}</div>
        </div>
        <div className="wellness-card bg-purple-50 border-purple-200">
          <div className="text-sm text-purple-600 font-medium">Completion Rate</div>
          <div className="text-2xl font-bold text-purple-700">
            {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Task Planning Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Task For
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={taskPlanningDate}
                  onChange={(e) => setTaskPlanningDate(e.target.value)}
                  className="input-field flex-1"
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
                <button
                  type="button"
                  onClick={() => setTaskPlanningDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'))}
                  className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setTaskPlanningDate(format(addDays(new Date(), 2), 'yyyy-MM-dd'))}
                  className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  Day After
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {taskPlanningDate === selectedDate 
                  ? "Planning for today" 
                  : `Planning for ${format(new Date(taskPlanningDate + 'T00:00:00'), 'MMMM d, yyyy')}`
                }
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Complete project report"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                className="input-field"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="input-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                Add Task
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No tasks for {format(new Date(taskPlanningDate + 'T00:00:00'), 'MMMM d, yyyy')}</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() => handleToggleComplete(task.id)}
                    className="flex-shrink-0 mt-1"
                  >
                    {task.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-semibold ${
                        task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                      }`}>
                        {task.title}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                    </div>
                    {task.description && (
                      <p className={`text-sm ${
                        task.completed ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-red-500 hover:text-red-700 p-1 ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskTracker;
