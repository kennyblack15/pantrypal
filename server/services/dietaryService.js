class DietaryService {
  constructor() {
    this.restrictions = {
      vegan: {
        exclude: ['meat', 'fish', 'egg', 'dairy', 'honey'],
        substitutes: {
          'meat': ['tofu', 'tempeh', 'seitan', 'mushrooms', 'jackfruit'],
          'egg': ['flax egg', 'chia egg', 'mashed banana', 'applesauce'],
          'dairy': ['almond milk', 'soy milk', 'oat milk', 'coconut milk'],
          'honey': ['maple syrup', 'agave nectar']
        }
      },
      vegetarian: {
        exclude: ['meat', 'fish'],
        substitutes: {
          'meat': ['tofu', 'tempeh', 'seitan', 'mushrooms', 'legumes'],
          'fish': ['tempeh', 'nori', 'hearts of palm']
        }
      },
      glutenFree: {
        exclude: ['wheat', 'barley', 'rye', 'flour'],
        substitutes: {
          'flour': ['almond flour', 'rice flour', 'coconut flour'],
          'pasta': ['rice noodles', 'zucchini noodles', 'quinoa pasta'],
          'bread': ['gluten-free bread', 'lettuce wraps', 'corn tortillas']
        }
      },
      dairyFree: {
        exclude: ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
        substitutes: {
          'milk': ['almond milk', 'soy milk', 'oat milk'],
          'cheese': ['nutritional yeast', 'cashew cheese', 'vegan cheese'],
          'yogurt': ['coconut yogurt', 'almond yogurt'],
          'butter': ['coconut oil', 'olive oil', 'avocado']
        }
      },
      nutFree: {
        exclude: ['peanut', 'almond', 'cashew', 'walnut', 'pecan'],
        substitutes: {
          'peanut butter': ['sunflower seed butter', 'pumpkin seed butter'],
          'almond flour': ['sunflower seed flour', 'oat flour'],
          'nuts': ['seeds', 'roasted chickpeas', 'crispy rice']
        }
      }
    };
  }

  findSubstitutes(ingredient, dietaryPreferences) {
    const substitutes = new Set();
    
    for (const pref of dietaryPreferences) {
      const restriction = this.restrictions[pref];
      if (!restriction) continue;

      // Check if ingredient needs substitution
      const needsSubstitution = restriction.exclude.some(excluded => 
        ingredient.toLowerCase().includes(excluded.toLowerCase())
      );

      if (needsSubstitution) {
        // Find all possible substitutes
        Object.entries(restriction.substitutes).forEach(([key, values]) => {
          if (ingredient.toLowerCase().includes(key.toLowerCase())) {
            values.forEach(substitute => substitutes.add(substitute));
          }
        });
      }
    }

    return Array.from(substitutes);
  }

  validateIngredient(ingredient, dietaryPreferences) {
    for (const pref of dietaryPreferences) {
      const restriction = this.restrictions[pref];
      if (!restriction) continue;

      const isExcluded = restriction.exclude.some(excluded => 
        ingredient.toLowerCase().includes(excluded.toLowerCase())
      );

      if (isExcluded) {
        return {
          valid: false,
          substitutes: this.findSubstitutes(ingredient, [pref])
        };
      }
    }

    return { valid: true };
  }

  async processRecipe(recipe, dietaryPreferences) {
    const processedRecipe = { ...recipe };
    const substitutions = [];

    // Process each ingredient
    processedRecipe.ingredients = await Promise.all(recipe.ingredients.map(async (ingredient) => {
      const validation = this.validateIngredient(ingredient, dietaryPreferences);
      
      if (!validation.valid) {
        const substitute = validation.substitutes[0]; // Get first substitute
        substitutions.push({
          original: ingredient,
          substitute: substitute,
          reason: `Not suitable for ${dietaryPreferences.join(', ')}`
        });
        return substitute;
      }
      
      return ingredient;
    }));

    return {
      ...processedRecipe,
      substitutions,
      dietaryCompliant: substitutions.length === 0
    };
  }
}

module.exports = new DietaryService();
