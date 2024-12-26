const vision = require('@google-cloud/vision');
const path = require('path');

class VisionService {
  constructor() {
    this.client = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_CLOUD_CREDENTIALS_PATH
    });
  }

  async detectIngredients(imageBuffer) {
    try {
      // Detect objects and labels in the image
      const [objectResult] = await this.client.objectLocalization(imageBuffer);
      const [labelResult] = await this.client.labelDetection(imageBuffer);
      
      // Combine and filter results
      const objects = objectResult.localizedObjectAnnotations;
      const labels = labelResult.labelAnnotations;
      
      // Extract food-related items
      const ingredients = new Set();
      
      // Process objects
      objects
        .filter(obj => this.isFoodRelated(obj.name))
        .forEach(obj => ingredients.add(obj.name.toLowerCase()));
      
      // Process labels
      labels
        .filter(label => this.isFoodRelated(label.description))
        .forEach(label => ingredients.add(label.description.toLowerCase()));
      
      return Array.from(ingredients);
    } catch (error) {
      console.error('Error detecting ingredients:', error);
      throw error;
    }
  }

  isFoodRelated(term) {
    const foodCategories = [
      'fruit', 'vegetable', 'meat', 'fish', 'seafood', 'spice', 'herb',
      'grain', 'dairy', 'nut', 'legume', 'ingredient', 'produce'
    ];
    
    return foodCategories.some(category => 
      term.toLowerCase().includes(category) ||
      this.getFoodKeywords().has(term.toLowerCase())
    );
  }

  getFoodKeywords() {
    // Common ingredients that might not be caught by categories
    return new Set([
      'tomato', 'potato', 'onion', 'garlic', 'carrot', 'pepper',
      'chicken', 'beef', 'pork', 'salmon', 'tuna', 'rice', 'pasta',
      'cheese', 'milk', 'egg', 'butter', 'oil', 'flour', 'sugar',
      // Add more ingredients as needed
    ]);
  }
}

module.exports = new VisionService();
