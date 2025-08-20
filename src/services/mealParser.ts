// Natural Language Meal Parser
// Parses text like "2 eggs, 1 cup rice, 1 tbsp olive oil" into structured data

export interface ParsedFoodItem {
  name: string;
  quantity: number;
  unit: string;
  preparation?: string;
  weight?: number; // calculated weight in grams
}

export interface ParsedMeal {
  items: ParsedFoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  totalWeight: number;
}

// Unit conversion database (to grams)
const unitConversions: Record<string, number> = {
  // Volume units
  'cup': 236.588, // ml to grams (approximate for most foods)
  'cups': 236.588,
  'tbsp': 14.7868, // ml to grams
  'tbsps': 14.7868,
  'tablespoon': 14.7868,
  'tablespoons': 14.7868,
  'tsp': 4.92892, // ml to grams
  'tsps': 4.92892,
  'teaspoon': 4.92892,
  'teaspoons': 4.92892,
  'ml': 1,
  'milliliter': 1,
  'milliliters': 1,
  'l': 1000,
  'liter': 1000,
  'liters': 1000,
  'fl oz': 29.5735,
  'fluid ounce': 29.5735,
  'fluid ounces': 29.5735,
  
  // Weight units
  'g': 1,
  'gram': 1,
  'grams': 1,
  'kg': 1000,
  'kilogram': 1000,
  'kilograms': 1000,
  'oz': 28.3495,
  'ounce': 28.3495,
  'ounces': 28.3495,
  'lb': 453.592,
  'pound': 453.592,
  'pounds': 453.592,
  
  // Count units
  'count': 1,
  'piece': 1,
  'pieces': 1,
  'slice': 1,
  'slices': 1,
  'whole': 1,
  'medium': 1,
  'large': 1,
  'small': 1,
  
  // Common food-specific conversions
  'egg': 50, // average egg weight
  'eggs': 50,
  'banana': 118, // medium banana
  'bananas': 118,
  'apple': 182, // medium apple
  'apples': 182,
  'orange': 131, // medium orange
  'oranges': 131,
  'slice bread': 30, // average slice
  'slices bread': 30,
  'slice pizza': 100, // average slice
  'slices pizza': 100,
};

// Food density database (grams per cup for volume-based foods)
const foodDensities: Record<string, number> = {
  'rice': 158, // cooked rice per cup
  'cooked rice': 158,
  'white rice': 158,
  'brown rice': 195,
  'quinoa': 185,
  'cooked quinoa': 185,
  'oats': 81, // dry oats per cup
  'oatmeal': 81,
  'rolled oats': 81,
  'steel cut oats': 156,
  'pasta': 105, // cooked pasta per cup
  'cooked pasta': 105,
  'spaghetti': 105,
  'penne': 105,
  'flour': 120,
  'all purpose flour': 120,
  'sugar': 200,
  'white sugar': 200,
  'brown sugar': 220,
  'honey': 340,
  'maple syrup': 322,
  'milk': 244, // 1 cup milk
  'almond milk': 240,
  'soy milk': 240,
  'yogurt': 245,
  'greek yogurt': 245,
  'olive oil': 216, // 1 cup olive oil
  'vegetable oil': 218,
  'coconut oil': 218,
  'butter': 227,
  'peanut butter': 258,
  'almond butter': 258,
  'jam': 320,
  'jelly': 320,
  'salsa': 240,
  'tomato sauce': 245,
  'broth': 240,
  'stock': 240,
  'soup': 245,
  'cereal': 30, // per cup (varies by type)
  'granola': 120,
  'nuts': 120, // mixed nuts per cup
  'almonds': 143,
  'walnuts': 120,
  'cashews': 137,
  'peanuts': 146,
  'seeds': 140, // mixed seeds per cup
  'chia seeds': 168,
  'flax seeds': 168,
  'sunflower seeds': 140,
  'pumpkin seeds': 129,
  'vegetables': 91, // mixed vegetables per cup
  'broccoli': 91,
  'carrots': 128,
  'spinach': 30, // raw spinach per cup
  'kale': 67,
  'lettuce': 36,
  'tomatoes': 149,
  'onions': 160,
  'peppers': 149,
  'mushrooms': 70,
  'corn': 166,
  'peas': 134,
  'beans': 177, // cooked beans per cup
  'black beans': 172,
  'kidney beans': 177,
  'chickpeas': 164,
  'lentils': 198,
  'tofu': 253, // firm tofu per cup
  'tempeh': 166,
  'cheese': 113, // shredded cheese per cup
  'cheddar': 113,
  'mozzarella': 113,
  'parmesan': 100,
  'cottage cheese': 226,
  'cream cheese': 232,
  'sour cream': 230,
  'mayonnaise': 220,
  'ketchup': 240,
  'mustard': 240,
  'hot sauce': 240,
  'soy sauce': 255,
  'vinegar': 238,
  'lemon juice': 244,
  'lime juice': 244,
  'orange juice': 249,
  'apple juice': 248,
  'coffee': 240,
  'tea': 240,
  'water': 236,
};

// Food aliases for better matching
const foodAliases: Record<string, string> = {
  // Eggs
  'egg': 'egg_whole',
  'eggs': 'egg_whole',
  'whole egg': 'egg_whole',
  'whole eggs': 'egg_whole',
  'egg white': 'egg_white',
  'egg whites': 'egg_white',
  'egg yolk': 'egg_yolk',
  'egg yolks': 'egg_yolk',
  
  // Grains
  'rice': 'rice_white_cooked',
  'white rice': 'rice_white_cooked',
  'brown rice': 'rice_brown_cooked',
  'quinoa': 'quinoa_cooked',
  'oats': 'oats_rolled',
  'oatmeal': 'oats_rolled',
  'rolled oats': 'oats_rolled',
  'steel cut oats': 'oats_steel_cut',
  'pasta': 'pasta_cooked',
  'spaghetti': 'pasta_cooked',
  'penne': 'pasta_cooked',
  'bread': 'bread_white',
  'white bread': 'bread_white',
  'whole wheat bread': 'bread_whole_wheat',
  'toast': 'bread_white',
  
  // Proteins
  'chicken': 'chicken_breast',
  'chicken breast': 'chicken_breast',
  'chicken thigh': 'chicken_thigh',
  'turkey': 'turkey_breast',
  'turkey breast': 'turkey_breast',
  'beef': 'beef_ground',
  'ground beef': 'beef_ground',
  'steak': 'beef_steak',
  'pork': 'pork_chop',
  'pork chop': 'pork_chop',
  'bacon': 'bacon',
  'ham': 'ham',
  'salmon': 'salmon',
  'fish': 'fish_generic',
  'tuna': 'tuna',
  'shrimp': 'shrimp',
  'tofu': 'tofu_firm',
  'tempeh': 'tempeh',
  'beans': 'beans_black',
  'black beans': 'beans_black',
  'kidney beans': 'beans_kidney',
  'chickpeas': 'chickpeas',
  'lentils': 'lentils',
  
  // Vegetables
  'broccoli': 'broccoli',
  'carrots': 'carrots',
  'spinach': 'spinach',
  'kale': 'kale',
  'lettuce': 'lettuce',
  'tomatoes': 'tomatoes',
  'tomato': 'tomatoes',
  'onions': 'onions',
  'onion': 'onions',
  'peppers': 'bell_peppers',
  'bell pepper': 'bell_peppers',
  'bell peppers': 'bell_peppers',
  'mushrooms': 'mushrooms',
  'mushroom': 'mushrooms',
  'corn': 'corn',
  'peas': 'peas',
  
  // Fruits
  'banana': 'banana',
  'bananas': 'banana',
  'apple': 'apple',
  'apples': 'apple',
  'orange': 'orange',
  'oranges': 'orange',
  'strawberries': 'strawberries',
  'strawberry': 'strawberries',
  'blueberries': 'blueberries',
  'blueberry': 'blueberries',
  'grapes': 'grapes',
  'grape': 'grapes',
  'avocado': 'avocado',
  'avocados': 'avocado',
  
  // Dairy
  'milk': 'milk_whole',
  'whole milk': 'milk_whole',
  'skim milk': 'milk_skim',
  'almond milk': 'milk_almond',
  'soy milk': 'milk_soy',
  'yogurt': 'yogurt_plain',
  'greek yogurt': 'yogurt_greek',
  'cheese': 'cheese_cheddar',
  'cheddar': 'cheese_cheddar',
  'mozzarella': 'cheese_mozzarella',
  'parmesan': 'cheese_parmesan',
  'cottage cheese': 'cheese_cottage',
  'cream cheese': 'cheese_cream',
  'butter': 'butter',
  
  // Nuts and seeds
  'almonds': 'almonds',
  'almond': 'almonds',
  'walnuts': 'walnuts',
  'walnut': 'walnuts',
  'cashews': 'cashews',
  'cashew': 'cashews',
  'peanuts': 'peanuts',
  'peanut': 'peanuts',
  'peanut butter': 'peanut_butter',
  'almond butter': 'almond_butter',
  'chia seeds': 'chia_seeds',
  'flax seeds': 'flax_seeds',
  'sunflower seeds': 'sunflower_seeds',
  'pumpkin seeds': 'pumpkin_seeds',
  
  // Oils and fats
  'olive oil': 'olive_oil',
  'vegetable oil': 'vegetable_oil',
  'coconut oil': 'coconut_oil',
  'mayonnaise': 'mayonnaise',
  
  // Sweeteners
  'sugar': 'sugar_white',
  'honey': 'honey',
  'maple syrup': 'maple_syrup',
  'jam': 'jam',
  'jelly': 'jelly',
};

class MealParser {
  // Parse natural language meal description
  parseMealDescription(description: string): ParsedFoodItem[] {
    const items: ParsedFoodItem[] = [];
    
    // Split by common separators
    const parts = description.split(/[,;]/).map(part => part.trim()).filter(part => part.length > 0);
    
    for (const part of parts) {
      const item = this.parseFoodItem(part);
      if (item) {
        items.push(item);
      }
    }
    
    return items;
  }

  // Parse individual food item
  private parseFoodItem(text: string): ParsedFoodItem | null {
    // Remove common words that don't affect parsing
    const cleanedText = text.toLowerCase()
      .replace(/\b(and|with|plus|including)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Try to match quantity and unit patterns
    const patterns = [
      // "2 eggs" or "2 whole eggs"
      /^(\d+(?:\.\d+)?)\s+(whole\s+)?(\w+)$/,
      // "1 cup rice" or "1 cup cooked rice"
      /^(\d+(?:\.\d+)?)\s+(\w+)\s+(cooked\s+)?(\w+)$/,
      // "1 tbsp olive oil"
      /^(\d+(?:\.\d+)?)\s+(\w+)\s+(\w+(?:\s+\w+)*)$/,
      // "half cup oats" or "1/2 cup oats"
      /^(half|quarter|third|1\/2|1\/4|1\/3)\s+(\w+)\s+(\w+)$/,
      // "large apple" or "medium banana"
      /^(large|medium|small)\s+(\w+)$/,
      // Just food name (assume quantity 1, unit "count")
      /^(\w+(?:\s+\w+)*)$/
    ];

    for (const pattern of patterns) {
      const match = cleanedText.match(pattern);
      if (match) {
        return this.extractFoodItem(match, cleanedText);
      }
    }

    return null;
  }

  // Extract food item from regex match
  private extractFoodItem(match: RegExpMatchArray, originalText: string): ParsedFoodItem | null {
    const groups = match.slice(1);
    
    let quantity = 1;
    let unit = 'count';
    let foodName = '';
    let preparation = '';

    if (groups.length === 1) {
      // Just food name
      foodName = groups[0];
    } else if (groups.length === 2) {
      // "large apple" or "2 eggs"
      if (['large', 'medium', 'small'].includes(groups[0])) {
        unit = groups[0];
        foodName = groups[1];
      } else {
        quantity = this.parseQuantity(groups[0]);
        foodName = groups[1];
      }
    } else if (groups.length === 3) {
      // "1 cup rice" or "half cup oats"
      quantity = this.parseQuantity(groups[0]);
      unit = groups[1];
      foodName = groups[2];
    } else if (groups.length === 4) {
      // "1 cup cooked rice"
      quantity = this.parseQuantity(groups[0]);
      unit = groups[1];
      preparation = groups[2] || '';
      foodName = groups[3];
    }

    // Clean up food name and preparation
    foodName = foodName.trim();
    preparation = preparation.trim();

    // Look up canonical food name
    const canonicalName = this.getCanonicalFoodName(foodName);
    
    if (!canonicalName) {
      return null;
    }

    return {
      name: canonicalName,
      quantity: quantity,
      unit: unit,
      preparation: preparation || undefined
    };
  }

  // Parse quantity (handles fractions and decimals)
  private parseQuantity(text: string): number {
    if (text === 'half' || text === '1/2') return 0.5;
    if (text === 'quarter' || text === '1/4') return 0.25;
    if (text === 'third' || text === '1/3') return 0.333;
    if (text === 'two thirds' || text === '2/3') return 0.667;
    if (text === 'three quarters' || text === '3/4') return 0.75;
    
    return parseFloat(text) || 1;
  }

  // Get canonical food name from aliases
  private getCanonicalFoodName(foodName: string): string | null {
    // Direct match
    if (foodAliases[foodName]) {
      return foodAliases[foodName];
    }

    // Fuzzy match (simple substring matching)
    for (const [alias, canonical] of Object.entries(foodAliases)) {
      if (alias.includes(foodName) || foodName.includes(alias)) {
        return canonical;
      }
    }

    // If no match found, return the original name
    return foodName;
  }

  // Calculate weight in grams for a food item
  calculateWeight(item: ParsedFoodItem): number {
    const { quantity, unit } = item;
    
    // If unit is already in grams, return directly
    if (unit === 'g' || unit === 'gram' || unit === 'grams') {
      return quantity;
    }

    // Get base conversion for the unit
    const baseConversion = unitConversions[unit] || 1;
    
    // For volume-based foods, use food density
    if (['cup', 'cups', 'tbsp', 'tbsps', 'tsp', 'tsps', 'ml', 'l', 'fl oz'].includes(unit)) {
      const density = foodDensities[item.name] || 100; // default density
      return (quantity * baseConversion * density) / 236.588; // normalize to grams
    }

    // For count-based foods, use the conversion directly
    return quantity * baseConversion;
  }

  // Calculate nutrition for a parsed meal
  async calculateMealNutrition(items: ParsedFoodItem[]): Promise<ParsedMeal> {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    let totalWeight = 0;

    for (const item of items) {
      const weight = this.calculateWeight(item);
      item.weight = weight;
      totalWeight += weight;

      // Get nutrition per 100g for this food
      const nutrition = await this.getNutritionPer100g(item.name);
      
      // Calculate nutrition for this item
      const itemCalories = (nutrition.calories * weight) / 100;
      const itemProtein = (nutrition.protein * weight) / 100;
      const itemCarbs = (nutrition.carbs * weight) / 100;
      const itemFats = (nutrition.fats * weight) / 100;

      totalCalories += itemCalories;
      totalProtein += itemProtein;
      totalCarbs += itemCarbs;
      totalFats += itemFats;
    }

    return {
      items,
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein * 10) / 10,
      totalCarbs: Math.round(totalCarbs * 10) / 10,
      totalFats: Math.round(totalFats * 10) / 10,
      totalWeight: Math.round(totalWeight)
    };
  }

  // Get nutrition per 100g for a food (using the existing AI service)
  private async getNutritionPer100g(foodName: string): Promise<{ calories: number; protein: number; carbs: number; fats: number }> {
    // Import the AI service here to avoid circular dependencies
    const { aiMealService } = await import('./aiMealService');
    const nutrition = await aiMealService.getMealNutrition(foodName, 100);
    
    return {
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fats: nutrition.fats
    };
  }
}

export const mealParser = new MealParser();
