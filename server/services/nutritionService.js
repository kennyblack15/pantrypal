const { Configuration, OpenAIApi } = require('openai');

class NutritionService {
  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async analyzeRecipe(recipe) {
    try {
      const prompt = this.createNutritionPrompt(recipe);
      
      const response = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: `You are a professional nutritionist. Analyze recipes and provide detailed nutritional information 
                   and health insights. Format response as JSON.`
        }, {
          role: "user",
          content: prompt
        }],
        temperature: 0.3,
        max_tokens: 500
      });

      return this.parseNutritionResponse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Error analyzing nutrition:', error);
      throw error;
    }
  }

  createNutritionPrompt(recipe) {
    return `Analyze this recipe and provide nutritional information:
            Recipe: ${recipe.title}
            Ingredients: ${recipe.ingredients.join(', ')}
            
            Please provide:
            1. Calories per serving
            2. Macronutrients (protein, carbs, fats)
            3. Key vitamins and minerals
            4. Health benefits
            5. Dietary considerations
            6. Glycemic index estimate
            7. Portion recommendations`;
  }

  parseNutritionResponse(response) {
    try {
      const nutrition = JSON.parse(response);
      return {
        ...nutrition,
        timestamp: new Date().toISOString(),
        disclaimer: "Nutritional values are estimates and may vary based on specific ingredients and portions used."
      };
    } catch (error) {
      console.error('Error parsing nutrition response:', error);
      throw error;
    }
  }

  async getMealPlan(preferences, duration = 7) {
    try {
      const prompt = this.createMealPlanPrompt(preferences, duration);
      
      const response = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: `You are a professional meal planner. Create balanced, nutritious meal plans 
                   that consider dietary preferences and nutritional goals. Format as JSON.`
        }, {
          role: "user",
          content: prompt
        }],
        temperature: 0.5,
        max_tokens: 1000
      });

      return this.parseMealPlanResponse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Error generating meal plan:', error);
      throw error;
    }
  }

  createMealPlanPrompt(preferences, duration) {
    return `Create a ${duration}-day meal plan with these preferences:
            Dietary: ${preferences.dietary.join(', ')}
            Calories: ${preferences.calories} per day
            Goals: ${preferences.goals.join(', ')}
            Allergies: ${preferences.allergies.join(', ')}
            
            Include:
            1. Daily breakfast, lunch, dinner, and snacks
            2. Estimated prep time
            3. Nutritional breakdown
            4. Shopping list
            5. Meal prep suggestions`;
  }

  parseMealPlanResponse(response) {
    try {
      const mealPlan = JSON.parse(response);
      return {
        ...mealPlan,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error parsing meal plan response:', error);
      throw error;
    }
  }
}

module.exports = new NutritionService();
