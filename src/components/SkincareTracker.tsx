import React, { useState, useEffect } from 'react';
import { SkincareStep, SkincareRoutine } from '../types';
import { cloudStorage } from '../services/cloudStorage';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Trash2, Edit, Sparkles, Settings } from 'lucide-react';

interface SkincareTrackerProps {
  selectedDate: string;
}

const SkincareTracker: React.FC<SkincareTrackerProps> = ({ selectedDate }) => {
  const [skincare, setSkincare] = useState<SkincareStep[]>([]);
  const [routine, setRoutine] = useState<SkincareRoutine>({ morning: [], evening: [] });
  const [showRoutineEditor, setShowRoutineEditor] = useState(false);
  const [editingStep, setEditingStep] = useState<SkincareStep | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'cleanser' as SkincareStep['category'],
    time: 'morning' as 'morning' | 'evening',
  });
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadSkincareData = async () => {
      if (!currentUser) return;
      
      try {
        const dailyData = await cloudStorage.getDailyData(currentUser.uid, selectedDate);
        const currentRoutine = await cloudStorage.getSkincareRoutine(currentUser.uid);
        setRoutine(currentRoutine);
        
        // If no skincare data for today, initialize with current routine
        if (dailyData.skincare.length === 0) {
          const allSteps = [...currentRoutine.morning, ...currentRoutine.evening];
          if (allSteps.length > 0) {
            const initialSkincare = allSteps.map(step => ({
              ...step,
              completed: false,
            }));
            setSkincare(initialSkincare);
            await cloudStorage.updateSkincare(currentUser.uid, selectedDate, initialSkincare);
          } else {
            setSkincare([]);
          }
        } else {
          setSkincare(dailyData.skincare);
        }
      } catch (error) {
        console.error('Error loading skincare data:', error);
      }
    };

    loadSkincareData();
  }, [selectedDate, currentUser]);

  const handleToggleStep = async (stepId: string) => {
    if (!currentUser) return;
    
    const updatedSkincare = skincare.map(step =>
      step.id === stepId ? { ...step, completed: !step.completed } : step
    );
    setSkincare(updatedSkincare);
    
    try {
      await cloudStorage.updateSkincare(currentUser.uid, selectedDate, updatedSkincare);
    } catch (error) {
      console.error('Error updating skincare:', error);
    }
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !currentUser) return;

    const newStep: SkincareStep = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      category: formData.category,
      completed: false,
      order: routine[formData.time].length + 1,
    };

    const updatedRoutine = {
      ...routine,
      [formData.time]: [...routine[formData.time], newStep],
    };

    setRoutine(updatedRoutine);
    
    try {
      await cloudStorage.saveSkincareRoutine(currentUser.uid, updatedRoutine);
      
      // Update daily skincare if we're on today's date
      const today = format(new Date(), 'yyyy-MM-dd');
      if (selectedDate === today) {
        const updatedSkincare = [...skincare, { ...newStep, completed: false }];
        setSkincare(updatedSkincare);
        await cloudStorage.updateSkincare(currentUser.uid, selectedDate, updatedSkincare);
      }
      
      setFormData({ name: '', category: 'cleanser', time: 'morning' });
    } catch (error) {
      console.error('Error adding skincare step:', error);
    }
  };

  const handleDeleteStep = async (stepId: string, time: 'morning' | 'evening') => {
    if (!currentUser) return;
    
    const updatedRoutine = {
      ...routine,
      [time]: routine[time].filter(step => step.id !== stepId),
    };
    setRoutine(updatedRoutine);
    
    try {
      await cloudStorage.saveSkincareRoutine(currentUser.uid, updatedRoutine);
      
      // Update daily skincare if we're on today's date
      const today = format(new Date(), 'yyyy-MM-dd');
      if (selectedDate === today) {
        const updatedSkincare = skincare.filter(step => step.id !== stepId);
        setSkincare(updatedSkincare);
        await cloudStorage.updateSkincare(currentUser.uid, selectedDate, updatedSkincare);
      }
    } catch (error) {
      console.error('Error deleting skincare step:', error);
    }
  };

  const handleEditStep = (step: SkincareStep) => {
    setEditingStep(step);
    setFormData({
      name: step.name,
      category: step.category,
      time: routine.morning.find(s => s.id === step.id) ? 'morning' : 'evening',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStep || !formData.name.trim() || !currentUser) return;

    const updatedRoutine = {
      morning: routine.morning.map(step =>
        step.id === editingStep.id
          ? { ...step, name: formData.name.trim(), category: formData.category }
          : step
      ),
      evening: routine.evening.map(step =>
        step.id === editingStep.id
          ? { ...step, name: formData.name.trim(), category: formData.category }
          : step
      ),
    };

    setRoutine(updatedRoutine);
    
    try {
      await cloudStorage.saveSkincareRoutine(currentUser.uid, updatedRoutine);
      
      // Update daily skincare if we're on today's date
      const today = format(new Date(), 'yyyy-MM-dd');
      if (selectedDate === today) {
        const updatedSkincare = skincare.map(step =>
          step.id === editingStep.id
            ? { ...step, name: formData.name.trim(), category: formData.category }
            : step
        );
        setSkincare(updatedSkincare);
        await cloudStorage.updateSkincare(currentUser.uid, selectedDate, updatedSkincare);
      }
      
      setEditingStep(null);
      setFormData({ name: '', category: 'cleanser', time: 'morning' });
    } catch (error) {
      console.error('Error saving skincare step edit:', error);
    }
  };

  const completedSteps = skincare.filter(step => step.completed).length;
  const totalSteps = skincare.length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const getCategoryIcon = (category: SkincareStep['category']) => {
    switch (category) {
      case 'cleanser': return '🧼';
      case 'toner': return '💧';
      case 'serum': return '💎';
      case 'moisturizer': return '🧴';
      case 'sunscreen': return '☀️';
      case 'mask': return '🎭';
      case 'exfoliator': return '✨';
      default: return '💫';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-500" />
          Skincare Tracker
        </h2>
        <button
          onClick={() => setShowRoutineEditor(!showRoutineEditor)}
          className="btn-secondary flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Customize Routine
        </button>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="wellness-card bg-purple-50 border-purple-200">
          <div className="text-sm text-purple-600 font-medium">Total Steps</div>
          <div className="text-2xl font-bold text-purple-700">{totalSteps}</div>
        </div>
        <div className="wellness-card bg-green-50 border-green-200">
          <div className="text-sm text-green-600 font-medium">Completed</div>
          <div className="text-2xl font-bold text-green-700">{completedSteps}</div>
        </div>
        <div className="wellness-card bg-blue-50 border-blue-200">
          <div className="text-sm text-blue-600 font-medium">Progress</div>
          <div className="text-2xl font-bold text-blue-700">{Math.round(progressPercentage)}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      {totalSteps > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Daily Progress</span>
            <span className="text-sm text-gray-500">{completedSteps}/{totalSteps} steps</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Routine Editor */}
      {showRoutineEditor && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Customize Your Skincare Routine</h3>
          
          {/* Add New Step */}
          <form onSubmit={editingStep ? handleSaveEdit : handleAddStep} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">
              {editingStep ? 'Edit Step' : 'Add New Step'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Step Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Vitamin C Serum"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="input-field"
                >
                  <option value="cleanser">Cleanser</option>
                  <option value="toner">Toner</option>
                  <option value="serum">Serum</option>
                  <option value="moisturizer">Moisturizer</option>
                  <option value="sunscreen">Sunscreen</option>
                  <option value="mask">Mask</option>
                  <option value="exfoliator">Exfoliator</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <select
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value as any })}
                  className="input-field"
                >
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="btn-primary">
                {editingStep ? 'Save Changes' : 'Add Step'}
              </button>
              {editingStep && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingStep(null);
                    setFormData({ name: '', category: 'cleanser', time: 'morning' });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Morning Routine */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              🌅 Morning Routine
            </h4>
            <div className="space-y-2">
              {routine.morning.length === 0 ? (
                <p className="text-gray-500 text-sm">No morning steps added yet.</p>
              ) : (
                routine.morning.map((step) => (
                  <div key={step.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getCategoryIcon(step.category)}</span>
                      <span className="font-medium">{step.name}</span>
                      <span className="text-xs text-gray-500 capitalize">{step.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditStep(step)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStep(step.id, 'morning')}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Evening Routine */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              🌙 Evening Routine
            </h4>
            <div className="space-y-2">
              {routine.evening.length === 0 ? (
                <p className="text-gray-500 text-sm">No evening steps added yet.</p>
              ) : (
                routine.evening.map((step) => (
                  <div key={step.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getCategoryIcon(step.category)}</span>
                      <span className="font-medium">{step.name}</span>
                      <span className="text-xs text-gray-500 capitalize">{step.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditStep(step)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStep(step.id, 'evening')}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Daily Tracking */}
      <div className="space-y-6">
        {skincare.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No skincare steps for {format(new Date(selectedDate), 'MMMM d, yyyy')}</p>
            <p className="text-sm mt-1">Customize your routine above to start tracking!</p>
          </div>
        ) : (
          <>
            {/* Morning Routine */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                🌅 Morning Routine
              </h3>
              <div className="space-y-3">
                {skincare
                  .filter(step => routine.morning.some(routineStep => routineStep.id === step.id))
                  .map((step) => (
                    <div key={step.id} className="card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getCategoryIcon(step.category)}</span>
                          <div>
                            <h4 className="font-semibold text-gray-800">{step.name}</h4>
                            <p className="text-sm text-gray-500 capitalize">{step.category}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleStep(step.id)}
                          className={`p-2 rounded-full transition-colors ${
                            step.completed
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {step.completed ? '✓' : '○'}
                        </button>
                      </div>
                    </div>
                  ))}
                {skincare.filter(step => routine.morning.some(routineStep => routineStep.id === step.id)).length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No morning steps for today</p>
                )}
              </div>
            </div>

            {/* Evening Routine */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                🌙 Evening Routine
              </h3>
              <div className="space-y-3">
                {skincare
                  .filter(step => routine.evening.some(routineStep => routineStep.id === step.id))
                  .map((step) => (
                    <div key={step.id} className="card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getCategoryIcon(step.category)}</span>
                          <div>
                            <h4 className="font-semibold text-gray-800">{step.name}</h4>
                            <p className="text-sm text-gray-500 capitalize">{step.category}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleStep(step.id)}
                          className={`p-2 rounded-full transition-colors ${
                            step.completed
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {step.completed ? '✓' : '○'}
                        </button>
                      </div>
                    </div>
                  ))}
                {skincare.filter(step => routine.evening.some(routineStep => routineStep.id === step.id)).length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No evening steps for today</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SkincareTracker;
