import React, { useState } from 'react';
import { Sparkles, Loader2, Edit2, Check, X, Plus, Brain, AlertCircle, Lightbulb, Target } from 'lucide-react';
import { llmMealService, LLMParsedMeal, LLMParsedFood } from '../services/llmMealService';

interface LLMMealInputProps {
  onMealCalculated: (meal: LLMParsedMeal) => void;
  onCancel: () => void;
}

const LLMMealInput: React.FC<LLMMealInputProps> = ({ onMealCalculated, onCancel }) => {
  const [mealDescription, setMealDescription] = useState('');
  const [parsedMeal, setParsedMeal] = useState<LLMParsedMeal | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [validation, setValidation] = useState<{ isValid: boolean; issues: string[]; suggestions: string[] } | null>(null);
  const [suggestions, setSuggestions] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [targetCalories, setTargetCalories] = useState<string>('');
  const [editForm, setEditForm] = useState({
    quantity: '',
    unit: '',
    name: ''
  });

  const handleParseMeal = async () => {
    if (!mealDescription.trim()) return;

    setIsCalculating(true);
    try {
      // Validate the meal description first
      const validationResult = await llmMealService.validateMealDescription(mealDescription);
      setValidation(validationResult);

      if (!validationResult.isValid) {
        console.warn('Meal description has issues:', validationResult.issues);
      }

      // Parse the meal using LLM
      const calculatedMeal = await llmMealService.parseMealEnhanced(mealDescription);
      setParsedMeal(calculatedMeal);
    } catch (error) {
      console.error('Error parsing meal:', error);
      alert('Error parsing meal. Please try a different format or check your API key.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleGetSuggestions = async () => {
    if (!mealDescription.trim()) return;

    setShowSuggestions(true);
    try {
      const target = targetCalories ? parseInt(targetCalories) : undefined;
      const nutritionSuggestions = await llmMealService.getNutritionSuggestions(mealDescription, target);
      setSuggestions(nutritionSuggestions);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      setSuggestions('Unable to get nutrition suggestions at this time.');
    }
  };

  const handleEditItem = (index: number) => {
    const item = parsedMeal!.foods[index];
    setEditForm({
      quantity: item.quantity.toString(),
      unit: item.unit,
      name: item.name
    });
    setEditingItem(index);
  };

  const handleSaveEdit = async () => {
    if (!parsedMeal || editingItem === null) return;

    const updatedFoods = [...parsedMeal.foods];
    updatedFoods[editingItem] = {
      ...updatedFoods[editingItem],
      quantity: parseFloat(editForm.quantity) || 1,
      unit: editForm.unit,
      name: editForm.name
    };

    // Recalculate nutrition for the updated food
    const { aiMealService } = await import('../services/aiMealService');
    const nutrition = await aiMealService.getMealNutrition(editForm.name, parseFloat(editForm.quantity) || 1);
    
    updatedFoods[editingItem].calories = nutrition.calories;
    updatedFoods[editingItem].protein = nutrition.protein;
    updatedFoods[editingItem].carbs = nutrition.carbs;
    updatedFoods[editingItem].fats = nutrition.fats;

    // Recalculate totals
    const totalCalories = updatedFoods.reduce((sum, food) => sum + food.calories, 0);
    const totalProtein = updatedFoods.reduce((sum, food) => sum + food.protein, 0);
    const totalCarbs = updatedFoods.reduce((sum, food) => sum + food.carbs, 0);
    const totalFats = updatedFoods.reduce((sum, food) => sum + food.fats, 0);
    const totalWeight = updatedFoods.reduce((sum, food) => sum + food.weight, 0);

    setParsedMeal({
      ...parsedMeal,
      foods: updatedFoods,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats,
      totalWeight
    });
    setEditingItem(null);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleAddItem = () => {
    if (!parsedMeal) return;
    
    const newFood: LLMParsedFood = {
      name: 'apple',
      quantity: 1,
      unit: 'count',
      weight: 182,
      calories: 95,
      protein: 0.5,
      carbs: 25,
      fats: 0.3
    };
    
    setParsedMeal({
      ...parsedMeal,
      foods: [...parsedMeal.foods, newFood]
    });
    setEditingItem(parsedMeal.foods.length);
    setEditForm({
      quantity: '1',
      unit: 'count',
      name: 'apple'
    });
  };

  const handleRemoveItem = async (index: number) => {
    if (!parsedMeal) return;

    const updatedFoods = parsedMeal.foods.filter((_, i) => i !== index);
    
    // Recalculate totals
    const totalCalories = updatedFoods.reduce((sum, food) => sum + food.calories, 0);
    const totalProtein = updatedFoods.reduce((sum, food) => sum + food.protein, 0);
    const totalCarbs = updatedFoods.reduce((sum, food) => sum + food.carbs, 0);
    const totalFats = updatedFoods.reduce((sum, food) => sum + food.fats, 0);
    const totalWeight = updatedFoods.reduce((sum, food) => sum + food.weight, 0);

    setParsedMeal({
      ...parsedMeal,
      foods: updatedFoods,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats,
      totalWeight
    });
  };

  const handleSaveMeal = () => {
    if (parsedMeal) {
      onMealCalculated(parsedMeal);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5 text-purple-500" />
        ChatGPT-Powered Meal Input
      </h3>
      
      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe your meal
          </label>
          <textarea
            value={mealDescription}
            onChange={(e) => setMealDescription(e.target.value)}
            placeholder="e.g., 2 eggs, 1 cup cooked rice, 1 tbsp olive oil, 1 medium apple"
            className="input-field w-full h-24 resize-none"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Use natural language: quantities, units, and food names separated by commas
          </p>
        </div>

        {/* Target Calories Input */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Calories (optional)
            </label>
            <input
              type="number"
              value={targetCalories}
              onChange={(e) => setTargetCalories(e.target.value)}
              placeholder="e.g., 500"
              className="input-field"
              min="0"
            />
          </div>
          <button
            onClick={handleGetSuggestions}
            disabled={!mealDescription.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Lightbulb className="w-4 h-4" />
            Get Tips
          </button>
        </div>

        <button
          onClick={handleParseMeal}
          disabled={!mealDescription.trim() || isCalculating}
          className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isCalculating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isCalculating ? 'ChatGPT Analyzing...' : 'Parse & Calculate Nutrition'}
        </button>
      </div>

      {/* Validation Warnings */}
      {validation && !validation.isValid && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="font-medium text-yellow-800">Description Issues Found</span>
          </div>
          <ul className="text-sm text-yellow-700 space-y-1">
            {validation.issues.map((issue, index) => (
              <li key={index}>• {issue}</li>
            ))}
          </ul>
          {validation.suggestions.length > 0 && (
            <div className="mt-2">
              <span className="text-sm font-medium text-yellow-800">Suggestions:</span>
              <ul className="text-sm text-yellow-700 space-y-1">
                {validation.suggestions.map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Nutrition Suggestions */}
      {showSuggestions && suggestions && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">Nutrition Tips</span>
          </div>
          <div className="text-sm text-blue-700 whitespace-pre-line">
            {suggestions}
          </div>
          <div className="mt-2 text-xs text-blue-600">
            💬 Powered by ChatGPT
          </div>
        </div>
      )}

      {/* Results Section */}
      {parsedMeal && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-800">Parsed Meal Items</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Confidence:</span>
              <span className={`text-sm font-medium ${
                parsedMeal.confidence >= 90 ? 'text-green-600' :
                parsedMeal.confidence >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {parsedMeal.confidence}%
              </span>
            </div>
          </div>
          
          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Food</th>
                  <th className="text-left py-2">Quantity</th>
                  <th className="text-left py-2">Weight (g)</th>
                  <th className="text-left py-2">Calories</th>
                  <th className="text-left py-2">Protein</th>
                  <th className="text-left py-2">Carbs</th>
                  <th className="text-left py-2">Fat</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {parsedMeal.foods.map((food, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2">
                      {editingItem === index ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="input-field text-sm w-24"
                        />
                      ) : (
                        <span className="font-medium">{food.name}</span>
                      )}
                    </td>
                    <td className="py-2">
                      {editingItem === index ? (
                        <div className="flex gap-1">
                          <input
                            type="number"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                            className="input-field text-sm w-16"
                            step="0.1"
                          />
                          <input
                            type="text"
                            value={editForm.unit}
                            onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                            className="input-field text-sm w-16"
                          />
                        </div>
                      ) : (
                        <span>{food.quantity} {food.unit}</span>
                      )}
                    </td>
                    <td className="py-2 text-gray-600">{food.weight.toFixed(1)}</td>
                    <td className="py-2 text-orange-600 font-medium">{food.calories}</td>
                    <td className="py-2 text-blue-600">{food.protein.toFixed(1)}</td>
                    <td className="py-2 text-yellow-600">{food.carbs.toFixed(1)}</td>
                    <td className="py-2 text-red-600">{food.fats.toFixed(1)}</td>
                    <td className="py-2">
                      {editingItem === index ? (
                        <div className="flex gap-1">
                          <button
                            onClick={handleSaveEdit}
                            className="text-green-600 hover:text-green-700 p-1"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditItem(index)}
                            className="text-blue-600 hover:text-blue-700 p-1"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Item Button */}
          <button
            onClick={handleAddItem}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Food Item
          </button>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-semibold text-gray-800 mb-2">Meal Totals</h5>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Total Weight</div>
                <div className="font-semibold">{parsedMeal.totalWeight}g</div>
              </div>
              <div>
                <div className="text-gray-600">Calories</div>
                <div className="font-semibold text-orange-600">{parsedMeal.totalCalories}</div>
              </div>
              <div>
                <div className="text-gray-600">Protein</div>
                <div className="font-semibold text-blue-600">{parsedMeal.totalProtein}g</div>
              </div>
              <div>
                <div className="text-gray-600">Carbs</div>
                <div className="font-semibold text-yellow-600">{parsedMeal.totalCarbs}g</div>
              </div>
              <div>
                <div className="text-gray-600">Fat</div>
                <div className="font-semibold text-red-600">{parsedMeal.totalFats}g</div>
              </div>
            </div>
            {parsedMeal.totalFiber && (
              <div className="mt-2 text-sm">
                <span className="text-gray-600">Fiber: </span>
                <span className="font-semibold text-green-600">{parsedMeal.totalFiber}g</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSaveMeal}
              className="btn-primary flex-1"
            >
              Save Meal
            </button>
            <button
              onClick={onCancel}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LLMMealInput;
