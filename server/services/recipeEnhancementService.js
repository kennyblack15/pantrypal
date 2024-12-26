const { OpenAI } = require('openai');
const nutritionService = require('./nutritionService');
const Redis = require('ioredis');

class RecipeEnhancementService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD
    });
  }

  async enhanceRecipe(recipe, preferences) {
    try {
      const [
        variations,
        cookingTips,
        pairings,
        nutrition,
        techniques
      ] = await Promise.all([
        this.generateVariations(recipe),
        this.generateCookingTips(recipe),
        this.suggestPairings(recipe),
        this.getNutritionalEnhancements(recipe),
        this.suggestTechniques(recipe)
      ]);

      const enhanced = {
        ...recipe,
        variations,
        cookingTips,
        pairings,
        nutrition,
        techniques,
        seasonality: await this.checkSeasonality(recipe),
        difficulty: await this.assessDifficulty(recipe),
        timing: await this.calculateTiming(recipe),
        costEstimate: await this.estimateCost(recipe),
        sustainability: await this.assessSustainability(recipe)
      };

      // Cache enhanced recipe
      await this.cacheRecipe(enhanced);

      return enhanced;
    } catch (error) {
      console.error('Error enhancing recipe:', error);
      throw error;
    }
  }

  async generateVariations(recipe) {
    try {
      const response = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: "You are a creative chef specializing in recipe variations."
        }, {
          role: "user",
          content: `Create 3 variations of this recipe, maintaining its essence but offering unique twists:
            Recipe: ${recipe.title}
            Ingredients: ${recipe.ingredients.join(', ')}
            Instructions: ${recipe.instructions.join(' ')}`
        }],
        temperature: 0.8
      });

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Error generating variations:', error);
      return [];
    }
  }

  async generateCookingTips(recipe) {
    try {
      const response = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: "You are a professional chef sharing cooking tips and tricks."
        }, {
          role: "user",
          content: `Provide professional cooking tips for this recipe:
            Recipe: ${recipe.title}
            Ingredients: ${recipe.ingredients.join(', ')}
            Instructions: ${recipe.instructions.join(' ')}`
        }],
        temperature: 0.6
      });

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Error generating cooking tips:', error);
      return [];
    }
  }

  async suggestPairings(recipe) {
    try {
      const response = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: "You are a culinary expert specializing in food and beverage pairings."
        }, {
          role: "user",
          content: `Suggest perfect pairings for this recipe:
            Recipe: ${recipe.title}
            Style: ${recipe.cuisine}
            Main Ingredients: ${recipe.ingredients.slice(0, 5).join(', ')}`
        }],
        temperature: 0.7
      });

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Error suggesting pairings:', error);
      return [];
    }
  }

  async getNutritionalEnhancements(recipe) {
    try {
      const nutrition = await nutritionService.analyzeRecipe(recipe);
      
      const response = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: "You are a nutritionist specializing in recipe optimization."
        }, {
          role: "user",
          content: `Suggest nutritional enhancements for this recipe:
            Recipe: ${recipe.title}
            Current Nutrition: ${JSON.stringify(nutrition)}
            Ingredients: ${recipe.ingredients.join(', ')}`
        }],
        temperature: 0.6
      });

      return {
        current: nutrition,
        suggestions: JSON.parse(response.data.choices[0].message.content),
        healthScore: this.calculateHealthScore(nutrition)
      };
    } catch (error) {
      console.error('Error getting nutritional enhancements:', error);
      return null;
    }
  }

  async suggestTechniques(recipe) {
    try {
      const response = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: "You are a culinary instructor explaining cooking techniques."
        }, {
          role: "user",
          content: `Explain the key cooking techniques for this recipe and suggest professional tips:
            Recipe: ${recipe.title}
            Instructions: ${recipe.instructions.join(' ')}`
        }],
        temperature: 0.6
      });

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Error suggesting techniques:', error);
      return [];
    }
  }

  async checkSeasonality(recipe) {
    const currentMonth = new Date().getMonth();
    const ingredients = recipe.ingredients;
    
    // Get seasonal ingredients data
    const seasonalData = await this.getSeasonalIngredientsData();
    
    return {
      inSeason: ingredients.filter(ing => this.isIngredientInSeason(ing, currentMonth, seasonalData)),
      outOfSeason: ingredients.filter(ing => !this.isIngredientInSeason(ing, currentMonth, seasonalData)),
      seasonalAlternatives: await this.findSeasonalAlternatives(recipe, seasonalData)
    };
  }

  async assessDifficulty(recipe) {
    const factors = {
      techniques: this.countTechniques(recipe),
      ingredients: recipe.ingredients.length,
      steps: recipe.instructions.length,
      specialEquipment: this.countSpecialEquipment(recipe),
      timing: this.calculateTotalTime(recipe)
    };

    return {
      level: this.calculateDifficultyLevel(factors),
      factors,
      requirements: await this.getRequirements(recipe)
    };
  }

  async calculateTiming(recipe) {
    return {
      prep: this.estimatePrepTime(recipe),
      cooking: this.estimateCookingTime(recipe),
      total: this.calculateTotalTime(recipe),
      timeline: await this.generateTimeline(recipe)
    };
  }

  async estimateCost(recipe) {
    const ingredients = recipe.ingredients;
    const costs = await this.getIngredientCosts(ingredients);
    
    return {
      total: this.calculateTotalCost(costs),
      breakdown: costs,
      perServing: this.calculateCostPerServing(costs, recipe.servings),
      priceRange: this.determinePriceRange(costs.total)
    };
  }

  async assessSustainability(recipe) {
    const ingredients = recipe.ingredients;
    
    return {
      score: await this.calculateSustainabilityScore(ingredients),
      factors: await this.analyzeSustainabilityFactors(ingredients),
      alternatives: await this.suggestSustainableAlternatives(recipe),
      impact: await this.calculateEnvironmentalImpact(recipe)
    };
  }

  // Helper methods
  async cacheRecipe(recipe) {
    const cacheKey = `enhanced_recipe:${recipe.id}`;
    await this.redis.setex(cacheKey, 3600, JSON.stringify(recipe));
  }

  calculateHealthScore(nutrition) {
    // Implement health score calculation
    return 0;
  }

  async getSeasonalIngredientsData() {
    // Implement seasonal data retrieval
    return {};
  }

  isIngredientInSeason(ingredient, month, seasonalData) {
    // Implement seasonality check
    return true;
  }

  async findSeasonalAlternatives(recipe, seasonalData) {
    // Implement seasonal alternatives
    return [];
  }

  countTechniques(recipe) {
    // Implement technique counting
    return 0;
  }

  countSpecialEquipment(recipe) {
    // Implement equipment counting
    return 0;
  }

  calculateTotalTime(recipe) {
    // Implement total time calculation
    return 0;
  }

  calculateDifficultyLevel(factors) {
    // Implement difficulty calculation
    return 'medium';
  }

  async getRequirements(recipe) {
    // Implement requirements gathering
    return {};
  }

  estimatePrepTime(recipe) {
    // Implement prep time estimation
    return 0;
  }

  estimateCookingTime(recipe) {
    // Implement cooking time estimation
    return 0;
  }

  async generateTimeline(recipe) {
    // Implement timeline generation
    return [];
  }

  async getIngredientCosts(ingredients) {
    // Implement cost retrieval
    return {};
  }

  calculateTotalCost(costs) {
    // Implement total cost calculation
    return 0;
  }

  calculateCostPerServing(costs, servings) {
    // Implement per-serving cost calculation
    return 0;
  }

  determinePriceRange(total) {
    // Implement price range determination
    return '$';
  }

  async calculateSustainabilityScore(ingredients) {
    // Implement sustainability scoring
    return 0;
  }

  async analyzeSustainabilityFactors(ingredients) {
    // Implement sustainability analysis
    return {};
  }

  async suggestSustainableAlternatives(recipe) {
    // Implement sustainable alternatives
    return [];
  }

  async calculateEnvironmentalImpact(recipe) {
    // Implement environmental impact calculation
    return {};
  }
}

module.exports = new RecipeEnhancementService();
