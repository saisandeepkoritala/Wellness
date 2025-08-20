// LLM-Powered Meal Service
// Uses OpenAI API for accurate meal parsing and nutrition calculation

export interface LLMNutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  weight?: number;
  confidence?: number;
}

export interface LLMParsedFood {
  name: string;
  quantity: number;
  unit: string;
  preparation?: string;
  weight: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface LLMParsedMeal {
  foods: LLMParsedFood[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  totalFiber?: number;
  totalSugar?: number;
  totalSodium?: number;
  totalWeight: number;
  confidence: number;
}

class LLMMealService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';
  private model = 'gpt-4'; // Using GPT-4 for best accuracy

  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
  }

  // Check if ChatGPT is available
  isChatGPTAvailable(): boolean {
    return !!this.apiKey;
  }

  // Parse meal description using LLM
  async parseMealWithLLM(mealDescription: string): Promise<LLMParsedMeal> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = this.createParsingPrompt(mealDescription);
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are ChatGPT, a nutrition expert and food database specialist. Parse meal descriptions into structured nutrition data with high accuracy. Use your knowledge of food nutrition to provide the most accurate values possible.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      return this.parseLLMResponse(content);
    } catch (error) {
      console.error('LLM parsing error:', error);
      throw error;
    }
  }

  // Create a detailed prompt for the LLM
  private createParsingPrompt(mealDescription: string): string {
    return `
Please parse the following meal description and provide accurate nutrition information.

Meal Description: "${mealDescription}"

Instructions:
1. Break down the meal into individual food items
2. For each food item, provide:
   - Name (standard food name)
   - Quantity (numeric value)
   - Unit (grams, cups, tbsp, tsp, count, etc.)
   - Preparation method if specified (cooked, raw, fried, etc.)
   - Weight in grams (calculated based on quantity and unit)
   - Calories per 100g
   - Protein per 100g
   - Carbs per 100g
   - Fats per 100g
   - Fiber per 100g (if available)
   - Sugar per 100g (if available)
   - Sodium per 100g (if available)

3. Calculate total nutrition for the meal
4. Provide confidence level (0-100) for the accuracy

Use this JSON format:
{
  "foods": [
    {
      "name": "food_name",
      "quantity": 1.0,
      "unit": "cup",
      "preparation": "cooked",
      "weight": 158,
      "calories": 130,
      "protein": 2.7,
      "carbs": 28,
      "fats": 0.3,
      "fiber": 0.4,
      "sugar": 0.1,
      "sodium": 1
    }
  ],
  "totalCalories": 500,
  "totalProtein": 25.5,
  "totalCarbs": 45.2,
  "totalFats": 12.8,
  "totalFiber": 8.5,
  "totalSugar": 15.3,
  "totalSodium": 450,
  "totalWeight": 350,
  "confidence": 95
}

Be as accurate as possible with nutrition values. Use standard USDA nutrition database values when available.
`;
  }

  // Parse the LLM response into structured data
  private parseLLMResponse(content: string): LLMParsedMeal {
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }

      const data = JSON.parse(jsonMatch[0]);
      
      // Validate and transform the data
      const foods: LLMParsedFood[] = data.foods.map((food: any) => ({
        name: food.name,
        quantity: parseFloat(food.quantity) || 0,
        unit: food.unit,
        preparation: food.preparation,
        weight: parseFloat(food.weight) || 0,
        calories: parseFloat(food.calories) || 0,
        protein: parseFloat(food.protein) || 0,
        carbs: parseFloat(food.carbs) || 0,
        fats: parseFloat(food.fats) || 0,
        fiber: food.fiber ? parseFloat(food.fiber) : undefined,
        sugar: food.sugar ? parseFloat(food.sugar) : undefined,
        sodium: food.sodium ? parseFloat(food.sodium) : undefined
      }));

      return {
        foods,
        totalCalories: parseFloat(data.totalCalories) || 0,
        totalProtein: parseFloat(data.totalProtein) || 0,
        totalCarbs: parseFloat(data.totalCarbs) || 0,
        totalFats: parseFloat(data.totalFats) || 0,
        totalFiber: data.totalFiber ? parseFloat(data.totalFiber) : undefined,
        totalSugar: data.totalSugar ? parseFloat(data.totalSugar) : undefined,
        totalSodium: data.totalSodium ? parseFloat(data.totalSodium) : undefined,
        totalWeight: parseFloat(data.totalWeight) || 0,
        confidence: parseFloat(data.confidence) || 0
      };
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      throw new Error('Failed to parse LLM response');
    }
  }

  // Enhanced meal parsing with LLM fallback
  async parseMealEnhanced(mealDescription: string): Promise<LLMParsedMeal> {
    try {
      // Try LLM first for best accuracy
      return await this.parseMealWithLLM(mealDescription);
    } catch (error) {
      console.warn('LLM parsing failed, falling back to rule-based parser:', error);
      
      // Fallback to rule-based parser
      const { mealParser } = await import('./mealParser');
      const items = mealParser.parseMealDescription(mealDescription);
      const calculatedMeal = await mealParser.calculateMealNutrition(items);
      
      // Convert to LLM format
      const foods: LLMParsedFood[] = calculatedMeal.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        preparation: item.preparation,
        weight: item.weight || 0,
        calories: 0, // Will be calculated below
        protein: 0,
        carbs: 0,
        fats: 0
      }));

      // Calculate nutrition for each food
      for (const food of foods) {
        const nutrition = await this.getNutritionPer100g(food.name);
        const multiplier = food.weight / 100;
        
        food.calories = Math.round(nutrition.calories * multiplier);
        food.protein = Math.round(nutrition.protein * multiplier * 10) / 10;
        food.carbs = Math.round(nutrition.carbs * multiplier * 10) / 10;
        food.fats = Math.round(nutrition.fats * multiplier * 10) / 10;
      }

      return {
        foods,
        totalCalories: calculatedMeal.totalCalories,
        totalProtein: calculatedMeal.totalProtein,
        totalCarbs: calculatedMeal.totalCarbs,
        totalFats: calculatedMeal.totalFats,
        totalWeight: calculatedMeal.totalWeight,
        confidence: 70 // Lower confidence for rule-based parsing
      };
    }
  }

  // Get nutrition per 100g for a food (using existing AI service)
  private async getNutritionPer100g(foodName: string): Promise<{ calories: number; protein: number; carbs: number; fats: number }> {
    const { aiMealService } = await import('./aiMealService');
    const nutrition = await aiMealService.getMealNutrition(foodName, 100);
    
    return {
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fats: nutrition.fats
    };
  }

  // Get nutrition suggestions for meal optimization
  async getNutritionSuggestions(mealDescription: string, targetCalories?: number): Promise<string> {
    if (!this.apiKey) {
      return 'ChatGPT API key not configured for nutrition suggestions.';
    }

    const prompt = `
You are ChatGPT, a helpful nutrition expert. Analyze this meal and provide personalized suggestions for optimization:

Meal: "${mealDescription}"
${targetCalories ? `Target Calories: ${targetCalories}` : ''}

Please provide:
1. Brief nutrition analysis of the meal
2. Suggestions for improvement (if needed)
3. Alternative food options that could enhance nutrition
4. Portion size recommendations
5. Any health benefits or concerns to consider

Keep the response friendly, concise, and practical. Use your knowledge to provide helpful, actionable advice.
`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are ChatGPT, a helpful nutrition expert providing practical meal optimization advice. Be friendly and conversational while giving accurate, actionable advice.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error getting nutrition suggestions:', error);
      return 'Unable to get nutrition suggestions at this time.';
    }
  }

  // Validate meal description for common issues
  async validateMealDescription(mealDescription: string): Promise<{ isValid: boolean; issues: string[]; suggestions: string[] }> {
    if (!this.apiKey) {
      return {
        isValid: true,
        issues: [],
        suggestions: ['ChatGPT validation not available without API key']
      };
    }

    const prompt = `
Validate this meal description for common issues:

"${mealDescription}"

Check for:
1. Missing quantities or units
2. Unclear food names
3. Ambiguous measurements
4. Missing preparation methods that affect nutrition

Return JSON format:
{
  "isValid": true/false,
  "issues": ["list of issues found"],
  "suggestions": ["list of improvement suggestions"]
}
`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are ChatGPT, a nutrition expert validating meal descriptions. Be thorough but friendly in your analysis.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        isValid: true,
        issues: [],
        suggestions: ['Unable to validate description']
      };
    } catch (error) {
      console.error('Error validating meal description:', error);
      return {
        isValid: true,
        issues: [],
        suggestions: ['Validation service unavailable']
      };
    }
  }

  // Get conversational meal analysis from ChatGPT
  async getConversationalAnalysis(mealDescription: string, userQuestion?: string): Promise<string> {
    if (!this.apiKey) {
      return 'ChatGPT API key not configured for conversational analysis.';
    }

    const prompt = userQuestion 
      ? `As ChatGPT, answer this specific question about the meal: "${userQuestion}"

Meal: "${mealDescription}"

Please provide a helpful, conversational response.`
      : `As ChatGPT, provide a friendly analysis of this meal:

Meal: "${mealDescription}"

Please give a conversational overview including:
- What you think about this meal
- Any interesting nutrition facts
- Suggestions for making it even better
- Any fun facts about the ingredients

Keep it friendly and engaging!`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are ChatGPT, a friendly and knowledgeable nutrition assistant. Be conversational, helpful, and engaging in your responses.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 400
        })
      });

      if (!response.ok) {
        throw new Error(`ChatGPT API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error getting conversational analysis:', error);
      return 'Unable to get ChatGPT analysis at this time.';
    }
  }

  // Get meal recommendations from ChatGPT
  async getMealRecommendations(preferences?: string, restrictions?: string): Promise<string> {
    if (!this.apiKey) {
      return 'ChatGPT API key not configured for meal recommendations.';
    }

    const prompt = `As ChatGPT, suggest some healthy meal ideas based on these preferences:

${preferences ? `Preferences: ${preferences}` : 'No specific preferences'}
${restrictions ? `Dietary Restrictions: ${restrictions}` : 'No dietary restrictions'}

Please provide:
1. 3-5 meal suggestions
2. Brief explanation of why each meal is good
3. Any tips for preparation

Keep it friendly and helpful!`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are ChatGPT, a helpful meal planning assistant. Provide creative and healthy meal suggestions.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.9,
          max_tokens: 600
        })
      });

      if (!response.ok) {
        throw new Error(`ChatGPT API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error getting meal recommendations:', error);
      return 'Unable to get meal recommendations at this time.';
    }
  }
}

export const llmMealService = new LLMMealService();
