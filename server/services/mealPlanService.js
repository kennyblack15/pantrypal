const mongoose = require('mongoose');
const nutritionService = require('./nutritionService');

// Meal Plan Schema
const mealPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    default: 7
  },
  preferences: {
    dietary: [String],
    calories: Number,
    goals: [String],
    allergies: [String]
  },
  meals: [{
    day: Number,
    breakfast: {
      recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe'
      },
      alternatives: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe'
      }]
    },
    lunch: {
      recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe'
      },
      alternatives: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe'
      }]
    },
    dinner: {
      recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe'
      },
      alternatives: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe'
      }]
    },
    snacks: [{
      recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe'
      },
      timing: String
    }]
  }],
  shoppingList: [{
    ingredient: String,
    amount: String,
    category: String,
    purchased: {
      type: Boolean,
      default: false
    }
  }],
  nutritionSummary: {
    averageCalories: Number,
    macroDistribution: {
      protein: Number,
      carbs: Number,
      fats: Number
    },
    micronutrients: [{
      name: String,
      amount: String,
      unit: String
    }]
  }
}, {
  timestamps: true
});

const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

class MealPlanService {
  async createPlan(userId, preferences) {
    try {
      // Generate meal plan using nutrition service
      const planData = await nutritionService.getMealPlan(preferences, preferences.duration || 7);
      
      // Create shopping list
      const shoppingList = this.generateShoppingList(planData.meals);
      
      // Calculate nutrition summary
      const nutritionSummary = await this.calculateNutritionSummary(planData.meals);
      
      const mealPlan = new MealPlan({
        userId,
        startDate: new Date(),
        duration: preferences.duration || 7,
        preferences,
        meals: planData.meals,
        shoppingList,
        nutritionSummary
      });

      await mealPlan.save();
      return mealPlan;
    } catch (error) {
      console.error('Error creating meal plan:', error);
      throw error;
    }
  }

  async updatePlan(planId, updates) {
    try {
      const plan = await MealPlan.findById(planId);
      
      if (!plan) {
        throw new Error('Meal plan not found');
      }

      // Update meals if provided
      if (updates.meals) {
        plan.meals = updates.meals;
        plan.shoppingList = this.generateShoppingList(updates.meals);
        plan.nutritionSummary = await this.calculateNutritionSummary(updates.meals);
      }

      // Update preferences if provided
      if (updates.preferences) {
        plan.preferences = {
          ...plan.preferences,
          ...updates.preferences
        };
      }

      await plan.save();
      return plan;
    } catch (error) {
      console.error('Error updating meal plan:', error);
      throw error;
    }
  }

  generateShoppingList(meals) {
    const ingredients = new Map();

    // Collect all ingredients from meals
    meals.forEach(day => {
      [day.breakfast, day.lunch, day.dinner, ...day.snacks].forEach(meal => {
        if (!meal || !meal.recipe) return;
        
        meal.recipe.ingredients.forEach(ingredient => {
          const existing = ingredients.get(ingredient.name);
          if (existing) {
            // Combine amounts if possible
            existing.amount = this.combineAmounts(existing.amount, ingredient.amount);
          } else {
            ingredients.set(ingredient.name, {
              ...ingredient,
              category: this.categorizeIngredient(ingredient.name),
              purchased: false
            });
          }
        });
      });
    });

    return Array.from(ingredients.values());
  }

  async calculateNutritionSummary(meals) {
    try {
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFats = 0;
      let micronutrients = new Map();

      // Analyze each meal
      for (const day of meals) {
        for (const mealType of ['breakfast', 'lunch', 'dinner']) {
          if (day[mealType] && day[mealType].recipe) {
            const nutrition = await nutritionService.analyzeRecipe(day[mealType].recipe);
            
            totalCalories += nutrition.calories;
            totalProtein += nutrition.macronutrients.protein;
            totalCarbs += nutrition.macronutrients.carbs;
            totalFats += nutrition.macronutrients.fats;

            // Aggregate micronutrients
            nutrition.micronutrients.forEach(micro => {
              const existing = micronutrients.get(micro.name) || 0;
              micronutrients.set(micro.name, existing + micro.amount);
            });
          }
        }
      }

      const daysCount = meals.length;
      return {
        averageCalories: totalCalories / daysCount,
        macroDistribution: {
          protein: totalProtein / daysCount,
          carbs: totalCarbs / daysCount,
          fats: totalFats / daysCount
        },
        micronutrients: Array.from(micronutrients.entries()).map(([name, amount]) => ({
          name,
          amount: amount / daysCount,
          unit: 'mg' // Default unit, should be adjusted based on the nutrient
        }))
      };
    } catch (error) {
      console.error('Error calculating nutrition summary:', error);
      throw error;
    }
  }

  categorizeIngredient(ingredient) {
    const categories = {
      produce: ['fruit', 'vegetable', 'herb', 'mushroom'],
      dairy: ['milk', 'cheese', 'yogurt', 'cream', 'butter'],
      protein: ['meat', 'fish', 'chicken', 'beef', 'pork', 'tofu', 'egg'],
      pantry: ['flour', 'sugar', 'oil', 'spice', 'sauce', 'pasta', 'rice'],
      frozen: ['frozen']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => ingredient.toLowerCase().includes(keyword))) {
        return category;
      }
    }

    return 'other';
  }

  combineAmounts(amount1, amount2) {
    // This is a simplified version - in reality, you'd need more sophisticated
    // unit conversion and combination logic
    return `${amount1} + ${amount2}`;
  }

  async getUserPlans(userId) {
    try {
      return await MealPlan.find({ userId }).sort('-createdAt');
    } catch (error) {
      console.error('Error fetching user meal plans:', error);
      throw error;
    }
  }

  async getPlanById(planId) {
    try {
      return await MealPlan.findById(planId);
    } catch (error) {
      console.error('Error fetching meal plan:', error);
      throw error;
    }
  }

  async updateShoppingList(planId, updates) {
    try {
      const plan = await MealPlan.findById(planId);
      
      if (!plan) {
        throw new Error('Meal plan not found');
      }

      updates.forEach(update => {
        const item = plan.shoppingList.find(i => i._id.toString() === update.itemId);
        if (item) {
          item.purchased = update.purchased;
        }
      });

      await plan.save();
      return plan.shoppingList;
    } catch (error) {
      console.error('Error updating shopping list:', error);
      throw error;
    }
  }
}

module.exports = new MealPlanService();
