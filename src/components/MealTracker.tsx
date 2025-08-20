import React, { useState, useEffect } from 'react';
import { cloudStorage } from '../services/cloudStorage';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Plus, Trash2, Utensils, Sparkles, Loader2 } from 'lucide-react';
import { Meal } from '../types';
import { aiMealService } from '../services/aiMealService';
// import NaturalMealInput from './NaturalMealInput';
// import LLMMealInput from './LLMMealInput';
// import { ParsedMeal } from '../services/mealParser';
// import { LLMParsedMeal } from '../services/llmMealService';

interface MealTrackerProps {
  selectedDate: string;
}

const MealTracker: React.FC<MealTrackerProps> = ({ selectedDate }) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [showForm, setShowForm] = useState(false);
  // const [showNaturalInput, setShowNaturalInput] = useState(false);
  // const [showLLMInput, setShowLLMInput] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [formData, setFormData] = useState({
    type: 'breakfast' as const,
    name: '',
    description: '',
    weight: '',
    fats: '',
    carbs: '',
    protein: '',
    time: format(new Date(), 'HH:mm'),
  });
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadMeals = async () => {
      if (!currentUser) return;
      
      try {
        const dailyData = await cloudStorage.getDailyData(currentUser.uid, selectedDate);
        setMeals(dailyData.meals);
      } catch (error) {
        console.error('Error loading meals:', error);
      }
    };

    loadMeals();
  }, [selectedDate, currentUser]);

  // Calculate calories automatically
  const calculateCalories = (fats: number, carbs: number, protein: number): number => {
    return (fats * 9) + (carbs * 4) + (protein * 4);
  };

  // AI-powered nutrition calculation
  const calculateNutritionWithAI = async () => {
    if (!formData.name.trim()) return;
    
    setIsCalculating(true);
    try {
      const weight = formData.weight ? parseFloat(formData.weight) : undefined;
      const nutrition = await aiMealService.getMealNutrition(formData.name, weight);
      
      setFormData(prev => ({
        ...prev,
        fats: nutrition.fats.toString(),
        carbs: nutrition.carbs.toString(),
        protein: nutrition.protein.toString(),
      }));
    } catch (error) {
      console.error('Error calculating nutrition with AI:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !currentUser) return;

    const fats = parseFloat(formData.fats) || 0;
    const carbs = parseFloat(formData.carbs) || 0;
    const protein = parseFloat(formData.protein) || 0;
    const calories = calculateCalories(fats, carbs, protein);

    try {
      await cloudStorage.addMeal(currentUser.uid, selectedDate, {
        type: formData.type,
        name: formData.name.trim(),
        description: formData.description.trim(),
        calories,
        fats,
        carbs,
        protein,
        time: formData.time,
      });

      // Update local state immediately
      const newMeal: Meal = {
        id: Date.now().toString(),
        type: formData.type,
        name: formData.name.trim(),
        description: formData.description.trim(),
        calories,
        fats,
        carbs,
        protein,
        time: formData.time,
      };
      setMeals([...meals, newMeal]);

      setFormData({
        type: 'breakfast',
        name: '',
        description: '',
        weight: '',
        fats: '',
        carbs: '',
        protein: '',
        time: format(new Date(), 'HH:mm'),
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding meal:', error);
    }
  };

  // Handle natural language meal input
  // const handleNaturalMealCalculated = async (parsedMeal: ParsedMeal) => {
  //   if (!currentUser) return;

  //   try {
  //     // Create a meal from the parsed data
  //     const mealName = parsedMeal.items.map(item => 
  //       `${item.quantity} ${item.unit} ${item.name}`
  //     ).join(', ');

  //     await cloudStorage.addMeal(currentUser.uid, selectedDate, {
  //       type: formData.type,
  //       name: mealName,
  //       description: `Parsed meal with ${parsedMeal.items.length} items`,
  //       calories: parsedMeal.totalCalories,
  //       fats: parsedMeal.totalFats,
  //       carbs: parsedMeal.totalCarbs,
  //       protein: parsedMeal.totalProtein,
  //       time: formData.time,
  //     });

  //     // Update local state
  //     const newMeal: Meal = {
  //       id: Date.now().toString(),
  //       type: formData.type,
  //       name: mealName,
  //       description: `Parsed meal with ${parsedMeal.items.length} items`,
  //       calories: parsedMeal.totalCalories,
  //       fats: parsedMeal.totalFats,
  //       carbs: parsedMeal.totalCarbs,
  //       protein: parsedMeal.totalProtein,
  //       time: formData.time,
  //     };
  //     setMeals([...meals, newMeal]);

  //     setShowNaturalInput(false);
  //   } catch (error) {
  //     console.error('Error adding parsed meal:', error);
  //   }
  // };

  // Handle LLM-powered meal input
  // const handleLLMMealCalculated = async (parsedMeal: LLMParsedMeal) => {
  //   if (!currentUser) return;

  //   try {
  //     // Create a meal from the LLM parsed data
  //     const mealName = parsedMeal.foods.map(food => 
  //       `${food.quantity} ${food.unit} ${food.name}`
  //     ).join(', ');

  //     await cloudStorage.addMeal(currentUser.uid, selectedDate, {
  //       type: formData.type,
  //       name: mealName,
  //       description: `AI-analyzed meal with ${parsedMeal.foods.length} items (${parsedMeal.confidence}% confidence)`,
  //       calories: parsedMeal.totalCalories,
  //       fats: parsedMeal.totalFats,
  //       carbs: parsedMeal.totalCarbs,
  //       protein: parsedMeal.totalProtein,
  //       time: formData.time,
  //     });

  //     // Update local state
  //     const newMeal: Meal = {
  //       id: Date.now().toString(),
  //       type: formData.type,
  //       name: mealName,
  //       description: `AI-analyzed meal with ${parsedMeal.foods.length} items (${parsedMeal.confidence}% confidence)`,
  //       calories: parsedMeal.totalCalories,
  //       fats: parsedMeal.totalFats,
  //       carbs: parsedMeal.totalCarbs,
  //       protein: parsedMeal.totalProtein,
  //       time: formData.time,
  //     };
  //     setMeals([...meals, newMeal]);

  //     setShowLLMInput(false);
  //   } catch (error) {
  //     console.error('Error adding LLM parsed meal:', error);
  //   }
  // };

  const handleDelete = async (mealId: string) => {
    if (!currentUser) return;
    
    try {
      await cloudStorage.deleteItem(currentUser.uid, selectedDate, 'meal', mealId);
      // Update local state immediately
      setMeals(meals.filter(meal => meal.id !== mealId));
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalFats = meals.reduce((sum, meal) => sum + meal.fats, 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Utensils className="w-6 h-6 text-orange-500" />
          Meal Tracker
        </h2>
        <div className="flex gap-2">
          {/* <button
            onClick={() => setShowLLMInput(!showLLMInput)}
            className="btn-primary flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            <Brain className="w-4 h-4" />
            AI Input
          </button>
          <button
            onClick={() => setShowNaturalInput(!showNaturalInput)}
            className="btn-primary flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <MessageSquare className="w-4 h-4" />
            Natural Input
          </button> */}
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Meal
          </button>
        </div>
      </div>

      {/* Nutrition Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="wellness-card bg-orange-50 border-orange-200">
          <div className="text-sm text-orange-600 font-medium">Calories</div>
          <div className="text-2xl font-bold text-orange-700">{totalCalories}</div>
        </div>
        <div className="wellness-card bg-red-50 border-red-200">
          <div className="text-sm text-red-600 font-medium">Fats (g)</div>
          <div className="text-2xl font-bold text-red-700">{totalFats.toFixed(1)}</div>
        </div>
        <div className="wellness-card bg-yellow-50 border-yellow-200">
          <div className="text-sm text-yellow-600 font-medium">Carbs (g)</div>
          <div className="text-2xl font-bold text-yellow-700">{totalCarbs.toFixed(1)}</div>
        </div>
        <div className="wellness-card bg-blue-50 border-blue-200">
          <div className="text-sm text-blue-600 font-medium">Protein (g)</div>
          <div className="text-2xl font-bold text-blue-700">{totalProtein.toFixed(1)}</div>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Add New Meal</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meal Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="input-field"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meal Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Grilled Chicken Salad"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (grams)
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="e.g., 150"
                  className="input-field"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={calculateNutritionWithAI}
                disabled={!formData.name.trim() || isCalculating}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isCalculating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isCalculating ? 'Calculating...' : 'AI Calculate Nutrition'}
              </button>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Enter your meal description and weight, then click "AI Calculate" to automatically get nutrition facts
              </p>
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
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fats (g)
                </label>
                <input
                  type="number"
                  value={formData.fats}
                  onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                  placeholder="0"
                  className="input-field"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  value={formData.carbs}
                  onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                  placeholder="0"
                  className="input-field"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  value={formData.protein}
                  onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                  placeholder="0"
                  className="input-field"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            {/* Real-time calorie calculation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">Calculated Calories</h4>
                  <p className="text-sm text-blue-700">
                    Fats: {parseFloat(formData.fats) || 0}g × 9 cal = {(parseFloat(formData.fats) || 0) * 9} cal
                  </p>
                  <p className="text-sm text-blue-700">
                    Carbs: {parseFloat(formData.carbs) || 0}g × 4 cal = {(parseFloat(formData.carbs) || 0) * 4} cal
                  </p>
                  <p className="text-sm text-blue-700">
                    Protein: {parseFloat(formData.protein) || 0}g × 4 cal = {(parseFloat(formData.protein) || 0) * 4} cal
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-900">
                    {calculateCalories(
                      parseFloat(formData.fats) || 0,
                      parseFloat(formData.carbs) || 0,
                      parseFloat(formData.protein) || 0
                    )} cal
                  </div>
                  <p className="text-xs text-blue-600">Total</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                Add Meal
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

      {/* LLM-Powered Input */}
      {/* {showLLMInput && (
        <LLMMealInput
          onMealCalculated={handleLLMMealCalculated}
          onCancel={() => setShowLLMInput(false)}
        />
      )}

      {/* Natural Language Input */}
      {/* {showNaturalInput && (
        <NaturalMealInput
          onMealCalculated={handleNaturalMealCalculated}
          onCancel={() => setShowNaturalInput(false)}
        />
      )} */}

      <div className="space-y-3">
        {meals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Utensils className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No meals logged yet for {format(new Date(selectedDate), 'MMMM d, yyyy')}</p>
          </div>
        ) : (
          meals.map((meal) => (
            <div key={meal.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      meal.type === 'breakfast' ? 'bg-orange-100 text-orange-700' :
                      meal.type === 'lunch' ? 'bg-green-100 text-green-700' :
                      meal.type === 'dinner' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
                    </span>
                    <span className="text-sm text-gray-500">{meal.time}</span>
                  </div>
                  <h4 className="font-semibold text-gray-800">{meal.name}</h4>
                  {meal.description && (
                    <p className="text-sm text-gray-600 mt-1">{meal.description}</p>
                  )}
                  <div className="flex gap-4 mt-3 text-sm">
                    <span className="text-orange-600 font-medium">{meal.calories} cal</span>
                    <span className="text-red-600">F: {meal.fats}g</span>
                    <span className="text-yellow-600">C: {meal.carbs}g</span>
                    <span className="text-blue-600">P: {meal.protein}g</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(meal.id)}
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
  );
};

export default MealTracker;
