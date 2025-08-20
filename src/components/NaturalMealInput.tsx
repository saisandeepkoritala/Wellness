import React, { useState } from 'react';
import { Sparkles, Loader2, Edit2, Check, X, Plus } from 'lucide-react';
import { mealParser, ParsedFoodItem, ParsedMeal } from '../services/mealParser';

interface NaturalMealInputProps {
  onMealCalculated: (meal: ParsedMeal) => void;
  onCancel: () => void;
}

const NaturalMealInput: React.FC<NaturalMealInputProps> = ({ onMealCalculated, onCancel }) => {
  const [mealDescription, setMealDescription] = useState('');
  const [parsedMeal, setParsedMeal] = useState<ParsedMeal | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    quantity: '',
    unit: '',
    name: ''
  });

  const handleParseMeal = async () => {
    if (!mealDescription.trim()) return;

    setIsCalculating(true);
    try {
      // Parse the meal description
      const items = mealParser.parseMealDescription(mealDescription);
      
      if (items.length === 0) {
        alert('No food items found in the description. Try a different format.');
        return;
      }

      // Calculate nutrition for the parsed items
      const calculatedMeal = await mealParser.calculateMealNutrition(items);
      setParsedMeal(calculatedMeal);
    } catch (error) {
      console.error('Error parsing meal:', error);
      alert('Error parsing meal. Please try a different format.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleEditItem = (index: number) => {
    const item = parsedMeal!.items[index];
    setEditForm({
      quantity: item.quantity.toString(),
      unit: item.unit,
      name: item.name
    });
    setEditingItem(index);
  };

  const handleSaveEdit = async () => {
    if (!parsedMeal || editingItem === null) return;

    const updatedItems = [...parsedMeal.items];
    updatedItems[editingItem] = {
      ...updatedItems[editingItem],
      quantity: parseFloat(editForm.quantity) || 1,
      unit: editForm.unit,
      name: editForm.name
    };

    // Recalculate nutrition
    const recalculatedMeal = await mealParser.calculateMealNutrition(updatedItems);
    setParsedMeal(recalculatedMeal);
    setEditingItem(null);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleAddItem = () => {
    if (!parsedMeal) return;
    
    const newItem: ParsedFoodItem = {
      name: 'apple',
      quantity: 1,
      unit: 'count'
    };
    
    setParsedMeal({
      ...parsedMeal,
      items: [...parsedMeal.items, newItem]
    });
    setEditingItem(parsedMeal.items.length);
    setEditForm({
      quantity: '1',
      unit: 'count',
      name: 'apple'
    });
  };

  const handleRemoveItem = async (index: number) => {
    if (!parsedMeal) return;

    const updatedItems = parsedMeal.items.filter((_, i) => i !== index);
    const recalculatedMeal = await mealParser.calculateMealNutrition(updatedItems);
    setParsedMeal(recalculatedMeal);
  };

  const handleSaveMeal = () => {
    if (parsedMeal) {
      onMealCalculated(parsedMeal);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Natural Language Meal Input</h3>
      
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
          {isCalculating ? 'Parsing Meal...' : 'Parse & Calculate Nutrition'}
        </button>
      </div>

      {/* Results Section */}
      {parsedMeal && (
        <div className="mt-6 space-y-4">
          <h4 className="font-semibold text-gray-800">Parsed Meal Items</h4>
          
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
                {parsedMeal.items.map((item, index) => (
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
                        <span className="font-medium">{item.name}</span>
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
                        <span>{item.quantity} {item.unit}</span>
                      )}
                    </td>
                    <td className="py-2 text-gray-600">{item.weight?.toFixed(1)}</td>
                    <td className="py-2 text-orange-600 font-medium">
                      {item.weight ? Math.round((item.weight * 165) / 100) : 0}
                    </td>
                    <td className="py-2 text-blue-600">{item.weight ? ((item.weight * 31) / 100).toFixed(1) : 0}</td>
                    <td className="py-2 text-yellow-600">{item.weight ? ((item.weight * 0) / 100).toFixed(1) : 0}</td>
                    <td className="py-2 text-red-600">{item.weight ? ((item.weight * 3.6) / 100).toFixed(1) : 0}</td>
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

export default NaturalMealInput;
