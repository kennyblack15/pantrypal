const { Configuration, OpenAIApi } = require('openai');
const cacheService = require('./cacheService');
const dietaryService = require('./dietaryService');

class RecipeService {
  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async suggestRecipes(ingredients, dietaryPreferences = []) {
    try {
      // Generate cache key based on ingredients and dietary preferences
      const cacheKey = cacheService.generateKey(ingredients, dietaryPreferences);
      
      // Check cache first
      const cachedRecipes = await cacheService.get(cacheKey);
      if (cachedRecipes) {
        console.log('Cache hit for recipe suggestions');
        return cachedRecipes;
      }

      // Create prompt with dietary restrictions
      const prompt = this.createRecipePrompt(ingredients, dietaryPreferences);
      
      const response = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: `You are a professional chef who specializes in creating delicious recipes from available ingredients. 
                   Consider dietary restrictions and provide suitable alternatives when needed.`
        }, {
          role: "user",
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 1000
      });

      // Parse and process recipes
      let recipes = await this.parseRecipeResponse(response.data.choices[0].message.content);
      
      // Process dietary restrictions and substitutions
      if (dietaryPreferences.length > 0) {
        recipes = await Promise.all(recipes.map(async (recipe) => {
          return await dietaryService.processRecipe(recipe, dietaryPreferences);
        }));
      }

      // Add metadata and calculate scores
      const processedRecipes = recipes.map(recipe => ({
        ...recipe,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        matchScore: this.calculateMatchScore(ingredients, recipe.ingredients)
      }));

      // Cache the results
      await cacheService.set(cacheKey, processedRecipes);

      return processedRecipes;
    } catch (error) {
      console.error('Error suggesting recipes:', error);
      throw error;
    }
  }

  createRecipePrompt(ingredients, dietaryPreferences) {
    let prompt = `Based on these ingredients: ${ingredients.join(', ')},
                 suggest 3 possible recipes.`;

    if (dietaryPreferences.length > 0) {
      prompt += ` The recipes must be suitable for ${dietaryPreferences.join(', ')} diets.`;
    }

    prompt += ` For each recipe, include:
              - Recipe name
              - Brief description
              - List of additional ingredients needed
              - Cooking instructions
              - Difficulty level
              - Preparation time
              - Cooking time
              Format the response as JSON.`;

    return prompt;
  }

  parseRecipeResponse(response) {
    try {
      const recipes = JSON.parse(response);
      return recipes;
    } catch (error) {
      console.error('Error parsing recipe response:', error);
      throw error;
    }
  }

  calculateMatchScore(availableIngredients, requiredIngredients) {
    const available = new Set(availableIngredients.map(i => i.toLowerCase()));
    const required = new Set(requiredIngredients.map(i => i.toLowerCase()));
    
    const matchingIngredients = [...required].filter(i => available.has(i));
    return (matchingIngredients.length / required.size) * 100;
  }
}

module.exports = new RecipeService();
