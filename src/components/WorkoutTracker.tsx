import React, { useState, useEffect } from 'react';
import { cloudStorage } from '../services/cloudStorage';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Plus, Trash2, Dumbbell, CheckCircle, XCircle } from 'lucide-react';
import { Workout } from '../types';

interface WorkoutTrackerProps {
  selectedDate: string;
}

const WorkoutTracker: React.FC<WorkoutTrackerProps> = ({ selectedDate }) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    completed: true,
    workoutType: '',
    weights: '',
    reps: '',
    intensity: 'medium' as const,
    time: format(new Date(), 'HH:mm'),
  });
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadWorkouts = async () => {
      if (!currentUser) return;
      
      try {
        const dailyData = await cloudStorage.getDailyData(currentUser.uid, selectedDate);
        setWorkouts(dailyData.workouts);
      } catch (error) {
        console.error('Error loading workouts:', error);
      }
    };

    loadWorkouts();
  }, [selectedDate, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workoutType.trim() || !currentUser) return;

    const newWorkout = {
      id: Date.now().toString(),
      completed: formData.completed,
      workoutType: formData.workoutType.trim(),
      weights: formData.weights ? parseFloat(formData.weights) : undefined,
      reps: formData.reps ? parseInt(formData.reps) : undefined,
      intensity: formData.intensity,
      time: formData.time,
    };

    try {
      await cloudStorage.addWorkout(currentUser.uid, selectedDate, {
        completed: formData.completed,
        workoutType: formData.workoutType.trim(),
        weights: formData.weights ? parseFloat(formData.weights) : undefined,
        reps: formData.reps ? parseInt(formData.reps) : undefined,
        intensity: formData.intensity,
        time: formData.time,
      });

      // Update local state immediately
      setWorkouts([...workouts, newWorkout]);

      setFormData({
        completed: true,
        workoutType: '',
        weights: '',
        reps: '',
        intensity: 'medium',
        time: format(new Date(), 'HH:mm'),
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding workout:', error);
    }
  };

  const handleToggleComplete = async (workoutId: string) => {
    if (!currentUser) return;
    
    const workout = workouts.find(w => w.id === workoutId);
    if (workout) {
      try {
        await cloudStorage.updateWorkout(currentUser.uid, selectedDate, workoutId, { completed: !workout.completed });
        // Update local state immediately
        setWorkouts(workouts.map(w => 
          w.id === workoutId ? { ...w, completed: !w.completed } : w
        ));
      } catch (error) {
        console.error('Error updating workout:', error);
      }
    }
  };

  const handleDelete = async (workoutId: string) => {
    if (!currentUser) return;
    
    try {
      await cloudStorage.deleteItem(currentUser.uid, selectedDate, 'workout', workoutId);
      // Update local state immediately
      setWorkouts(workouts.filter(workout => workout.id !== workoutId));
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  const completedWorkouts = workouts.filter(w => w.completed).length;
  const totalWorkouts = workouts.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Dumbbell className="w-6 h-6 text-green-500" />
          Workout Tracker
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Workout
        </button>
      </div>

      {/* Workout Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="wellness-card bg-green-50 border-green-200">
          <div className="text-sm text-green-600 font-medium">Workouts Planned</div>
          <div className="text-2xl font-bold text-green-700">{totalWorkouts}</div>
        </div>
        <div className="wellness-card bg-blue-50 border-blue-200">
          <div className="text-sm text-blue-600 font-medium">Completed</div>
          <div className="text-2xl font-bold text-blue-700">{completedWorkouts}</div>
        </div>
        <div className="wellness-card bg-purple-50 border-purple-200">
          <div className="text-sm text-purple-600 font-medium">Completion Rate</div>
          <div className="text-2xl font-bold text-purple-700">
            {totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0}%
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Add New Workout</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="completed"
                  checked={formData.completed}
                  onChange={() => setFormData({ ...formData, completed: true })}
                  className="text-green-600"
                />
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">Completed</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="completed"
                  checked={!formData.completed}
                  onChange={() => setFormData({ ...formData, completed: false })}
                  className="text-red-600"
                />
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium">Skipped</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workout Type *
                </label>
                <input
                  type="text"
                  value={formData.workoutType}
                  onChange={(e) => setFormData({ ...formData, workoutType: e.target.value })}
                  placeholder="e.g., Chest Press, Squats, Cardio"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weights (lbs)
                </label>
                <input
                  type="number"
                  value={formData.weights}
                  onChange={(e) => setFormData({ ...formData, weights: e.target.value })}
                  placeholder="0"
                  className="input-field"
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reps
                </label>
                <input
                  type="number"
                  value={formData.reps}
                  onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                  placeholder="0"
                  className="input-field"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intensity
              </label>
              <select
                value={formData.intensity}
                onChange={(e) => setFormData({ ...formData, intensity: e.target.value as any })}
                className="input-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                Add Workout
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
        {workouts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Dumbbell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No workouts logged yet for {format(new Date(selectedDate), 'MMMM d, yyyy')}</p>
          </div>
        ) : (
          workouts.map((workout) => (
            <div key={workout.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {workout.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      workout.completed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {workout.completed ? 'Completed' : 'Not Completed'}
                    </span>
                    <span className="text-sm text-gray-500">{workout.time}</span>
                  </div>
                  <h4 className="font-semibold text-gray-800">{workout.workoutType}</h4>
                  <div className="flex gap-4 mt-3 text-sm">
                    {workout.weights && (
                      <span className="text-blue-600">Weights: {workout.weights} lbs</span>
                    )}
                    {workout.reps && (
                      <span className="text-green-600">Reps: {workout.reps}</span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs ${
                       workout.intensity === 'low' ? 'bg-green-100 text-green-700' :
                       workout.intensity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                       'bg-red-100 text-red-700'
                     }`}>
                       {workout.intensity ? workout.intensity.charAt(0).toUpperCase() + workout.intensity.slice(1) : 'Medium'}
                     </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleComplete(workout.id)}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                      workout.completed
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                        : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                    }`}
                  >
                    {workout.completed ? '✓ Completed' : '○ Not Done'}
                  </button>
                  <button
                    onClick={() => handleDelete(workout.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkoutTracker;
