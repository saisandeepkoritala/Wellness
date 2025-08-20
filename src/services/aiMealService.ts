// AI Meal Service for automatic nutrition calculation
// Using Edamam Food Database API for nutrition data

interface NutritionInfo {
  calories: number;
  fats: number;
  carbs: number;
  protein: number;
  servingSize?: string;
  weight?: number; // in grams
}

interface FoodInput {
  name: string;
  weight: number; // in grams
}

interface FoodItem {
  food: {
    foodId: string;
    label: string;
    nutrients: {
      ENERC_KCAL: number; // calories
      FAT: number; // fats
      CHOCDF: number; // carbs
      PROCNT: number; // protein
    };
    category: string;
  };
  measures: Array<{
    uri: string;
    label: string;
    weight: number;
  }>;
}

interface EdamamResponse {
  text: string;
  parsed: FoodItem[];
  hints: FoodItem[];
}

class AIMealService {
  private apiKey: string;
  private appId: string;
  private baseUrl = 'https://api.edamam.com/api/food-database/v2';

  constructor() {
    // You'll need to get these from Edamam (free tier available)
    this.apiKey = process.env.REACT_APP_EDAMAM_API_KEY || '';
    this.appId = process.env.REACT_APP_EDAMAM_APP_ID || '';
  }

  async calculateMealNutrition(mealDescription: string, weight?: number): Promise<NutritionInfo | null> {
    if (!this.apiKey || !this.appId) {
      console.warn('Edamam API credentials not configured');
      return null;
    }

    try {
      // Add weight to the description if provided
      const descriptionWithWeight = weight 
        ? `${mealDescription} ${weight}g`
        : mealDescription;

      const response = await fetch(
        `${this.baseUrl}/parser?app_id=${this.appId}&app_key=${this.apiKey}&ingr=${encodeURIComponent(descriptionWithWeight)}`
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: EdamamResponse = await response.json();
      
      if (!data.parsed || data.parsed.length === 0) {
        return null;
      }

      // Calculate total nutrition from all parsed foods
      let totalCalories = 0;
      let totalFats = 0;
      let totalCarbs = 0;
      let totalProtein = 0;

      data.parsed.forEach((item) => {
        const nutrients = item.food.nutrients;
        totalCalories += nutrients.ENERC_KCAL || 0;
        totalFats += nutrients.FAT || 0;
        totalCarbs += nutrients.CHOCDF || 0;
        totalProtein += nutrients.PROCNT || 0;
      });

      return {
        calories: Math.round(totalCalories),
        fats: Math.round(totalFats * 10) / 10, // Round to 1 decimal
        carbs: Math.round(totalCarbs * 10) / 10,
        protein: Math.round(totalProtein * 10) / 10,
        servingSize: weight ? `${weight}g` : '1 serving',
        weight: weight
      };
    } catch (error) {
      console.error('Error calculating meal nutrition:', error);
      return null;
    }
  }

  // Fallback method using common food database with per-100g nutrition
  async calculateMealNutritionFallback(mealDescription: string, weight?: number): Promise<NutritionInfo | null> {

    // Per 100g nutrition values for more accurate calculations
    const per100gFoods: Record<string, NutritionInfo> = {
      'chicken breast': { calories: 165, fats: 3.6, carbs: 0, protein: 31 },
      'salmon': { calories: 208, fats: 12, carbs: 0, protein: 25 },
      'rice': { calories: 130, fats: 0.3, carbs: 28, protein: 2.7 },
      'broccoli': { calories: 34, fats: 0.4, carbs: 7, protein: 2.8 },
      'banana': { calories: 89, fats: 0.3, carbs: 23, protein: 1.1 },
      'apple': { calories: 52, fats: 0.2, carbs: 14, protein: 0.3 },
      'oatmeal': { calories: 68, fats: 1.4, carbs: 12, protein: 2.4 },
      'eggs': { calories: 155, fats: 11, carbs: 1.1, protein: 13 },
      'milk': { calories: 42, fats: 1, carbs: 5, protein: 3.4 },
      'bread': { calories: 79, fats: 1, carbs: 15, protein: 3.1 },
      'pasta': { calories: 131, fats: 1.1, carbs: 25, protein: 5 },
      'beef': { calories: 250, fats: 15, carbs: 0, protein: 26 },
      'fish': { calories: 206, fats: 12, carbs: 0, protein: 22 },
      'vegetables': { calories: 25, fats: 0.2, carbs: 5, protein: 2 },
      'fruits': { calories: 60, fats: 0.2, carbs: 15, protein: 0.5 },
      'salad': { calories: 20, fats: 0.2, carbs: 4, protein: 1.5 },
      'soup': { calories: 100, fats: 3, carbs: 15, protein: 5 },
      'sandwich': { calories: 300, fats: 12, carbs: 35, protein: 15 },
      'pizza': { calories: 266, fats: 10, carbs: 33, protein: 11 },
      'burger': { calories: 354, fats: 17, carbs: 30, protein: 16 },
      // More detailed per 100g values
      'chicken': { calories: 165, fats: 3.6, carbs: 0, protein: 31 },
      'turkey': { calories: 189, fats: 7, carbs: 0, protein: 29 },
      'pork': { calories: 242, fats: 14, carbs: 0, protein: 27 },
      'lamb': { calories: 294, fats: 21, carbs: 0, protein: 25 },
      'tuna': { calories: 144, fats: 0.5, carbs: 0, protein: 30 },
      'cod': { calories: 82, fats: 0.7, carbs: 0, protein: 18 },
      'shrimp': { calories: 99, fats: 0.3, carbs: 0.2, protein: 24 },
      'quinoa': { calories: 120, fats: 1.9, carbs: 22, protein: 4.4 },
      'sweet potato': { calories: 86, fats: 0.1, carbs: 20, protein: 1.6 },
      'potato': { calories: 77, fats: 0.1, carbs: 17, protein: 2 },
      'carrots': { calories: 41, fats: 0.2, carbs: 10, protein: 0.9 },
      'spinach': { calories: 23, fats: 0.4, carbs: 3.6, protein: 2.9 },
      'kale': { calories: 49, fats: 0.9, carbs: 8.8, protein: 4.3 },
      'avocado': { calories: 160, fats: 15, carbs: 9, protein: 2 },
      'almonds': { calories: 579, fats: 50, carbs: 22, protein: 21 },
      'peanuts': { calories: 567, fats: 49, carbs: 16, protein: 26 },
      'yogurt': { calories: 59, fats: 0.4, carbs: 3.6, protein: 10 },
      'cheese': { calories: 113, fats: 9, carbs: 0.4, protein: 7 },
      'butter': { calories: 717, fats: 81, carbs: 0.1, protein: 0.9 },
      'olive oil': { calories: 884, fats: 100, carbs: 0, protein: 0 },
    };

    const description = mealDescription.toLowerCase();
    
    // Find matching foods from per100g database
    const matchedFoods: NutritionInfo[] = [];
    
    Object.entries(per100gFoods).forEach(([food, nutrition]) => {
      if (description.includes(food)) {
        matchedFoods.push(nutrition);
      }
    });

    if (matchedFoods.length === 0) {
      // Default nutrition for unknown foods (per 100g)
      return {
        calories: weight ? Math.round((200 * weight) / 100) : 200,
        fats: weight ? Math.round((8 * weight) / 100 * 10) / 10 : 8,
        carbs: weight ? Math.round((25 * weight) / 100 * 10) / 10 : 25,
        protein: weight ? Math.round((10 * weight) / 100 * 10) / 10 : 10,
        servingSize: weight ? `${weight}g` : '1 serving',
        weight: weight
      };
    }

    // Calculate average nutrition from matched foods (per 100g)
    const avgNutrition = matchedFoods.reduce((acc, food) => ({
      calories: acc.calories + food.calories,
      fats: acc.fats + food.fats,
      carbs: acc.carbs + food.carbs,
      protein: acc.protein + food.protein,
    }), { calories: 0, fats: 0, carbs: 0, protein: 0 });

    const avgCalories = avgNutrition.calories / matchedFoods.length;
    const avgFats = avgNutrition.fats / matchedFoods.length;
    const avgCarbs = avgNutrition.carbs / matchedFoods.length;
    const avgProtein = avgNutrition.protein / matchedFoods.length;

    // Calculate nutrition based on weight if provided
    if (weight) {
      return {
        calories: Math.round((avgCalories * weight) / 100),
        fats: Math.round((avgFats * weight) / 100 * 10) / 10,
        carbs: Math.round((avgCarbs * weight) / 100 * 10) / 10,
        protein: Math.round((avgProtein * weight) / 100 * 10) / 10,
        servingSize: `${weight}g`,
        weight: weight
      };
    }

    // Return per 100g values if no weight provided
    return {
      calories: Math.round(avgCalories),
      fats: Math.round(avgFats * 10) / 10,
      carbs: Math.round(avgCarbs * 10) / 10,
      protein: Math.round(avgProtein * 10) / 10,
      servingSize: '100g',
      weight: 100
    };
  }

  // Main method that tries API first, then fallback
  async getMealNutrition(mealDescription: string, weight?: number): Promise<NutritionInfo> {
    // Try API first
    const apiResult = await this.calculateMealNutrition(mealDescription, weight);
    if (apiResult) {
      return apiResult;
    }

    // Fallback to common foods database
    const fallbackResult = await this.calculateMealNutritionFallback(mealDescription, weight);
    return fallbackResult!;
  }

  // Method to calculate nutrition for multiple foods with weights
  async calculateMultipleFoods(foods: FoodInput[]): Promise<NutritionInfo> {
    let totalCalories = 0;
    let totalFats = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalWeight = 0;

    for (const food of foods) {
      const nutrition = await this.getMealNutrition(food.name, food.weight);
      totalCalories += nutrition.calories;
      totalFats += nutrition.fats;
      totalCarbs += nutrition.carbs;
      totalProtein += nutrition.protein;
      totalWeight += food.weight;
    }

    return {
      calories: totalCalories,
      fats: Math.round(totalFats * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      protein: Math.round(totalProtein * 10) / 10,
      servingSize: `${totalWeight}g total`,
      weight: totalWeight
    };
  }
}

export const aiMealService = new AIMealService();
