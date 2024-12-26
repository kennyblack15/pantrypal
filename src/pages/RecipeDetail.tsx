import React, { useState } from 'react';
import { ClockIcon, UserIcon, FireIcon, BookmarkIcon, ShareIcon, PrintIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface Step {
  number: number;
  instruction: string;
  timing?: string;
}

interface SideDish {
  name: string;
  description: string;
  image: string;
}

const RecipeDetail = () => {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions' | 'serving'>('ingredients');

  // Example data - would come from API in real app
  const recipe = {
    title: "Grilled Herb-Crusted Steak",
    description: "Perfectly grilled steak with a flavorful herb crust, creating a juicy and tender result that's sure to impress.",
    prepTime: "15 mins",
    cookTime: "20 mins",
    servings: 4,
    difficulty: "Medium",
    rating: 4.8,
    calories: 450,
    ingredients: [
      { name: "Ribeye steak", amount: "24", unit: "oz" },
      { name: "Fresh rosemary", amount: "2", unit: "sprigs" },
      { name: "Fresh thyme", amount: "4", unit: "sprigs" },
      { name: "Garlic", amount: "4", unit: "cloves" },
      { name: "Black pepper", amount: "1", unit: "tbsp" },
      { name: "Sea salt", amount: "2", unit: "tsp" },
      { name: "Olive oil", amount: "2", unit: "tbsp" },
    ],
    steps: [
      {
        number: 1,
        instruction: "Remove the steak from refrigerator 30 minutes before cooking to bring to room temperature.",
        timing: "30 mins before"
      },
      {
        number: 2,
        instruction: "Finely chop herbs and garlic, mix with salt, pepper, and oil to create a paste.",
        timing: "5 mins"
      },
      {
        number: 3,
        instruction: "Rub the herb mixture all over the steak, ensuring even coverage.",
        timing: "2 mins"
      },
      {
        number: 4,
        instruction: "Preheat grill to high heat (around 450°F/230°C).",
        timing: "10 mins"
      },
      {
        number: 5,
        instruction: "Grill steak 4-5 minutes per side for medium-rare, or adjust to desired doneness.",
        timing: "8-10 mins"
      },
      {
        number: 6,
        instruction: "Let rest for 5-10 minutes before slicing against the grain.",
        timing: "5-10 mins"
      }
    ],
    sideDishes: [
      {
        name: "Grilled Asparagus with Cherry Tomatoes",
        description: "Fresh asparagus spears and vine-ripened tomatoes, lightly seasoned and grilled to perfection.",
        image: "/images/plating-1.jpg"
      },
      {
        name: "Herb-Butter Ravioli with Roasted Tomatoes",
        description: "Delicate pasta pillows in a light herb butter sauce, served with garlic-roasted cherry tomatoes.",
        image: "/images/plating-2.jpg"
      }
    ],
    platingTips: [
      "Slice the meat against the grain for maximum tenderness",
      "Allow meat to rest for 5-10 minutes before slicing",
      "Arrange vegetables with varying heights for visual interest",
      "Use fresh herbs as garnish for color and flavor",
      "Drizzle any remaining pan juices around the plate"
    ]
  };

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Hero Section */}
      <div className="relative h-[50vh] md:h-[70vh] bg-black overflow-hidden">
        <img
          src="/images/grilled-meat.jpg"
          alt={recipe.title}
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        {/* Recipe Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-2 text-yellow-400 mb-4">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className={`h-6 w-6 ${i < Math.floor(recipe.rating) ? 'text-yellow-400' : 'text-gray-400'}`} />
              ))}
              <span className="text-white ml-2">{recipe.rating}</span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-white mb-4">
              {recipe.title}
            </h1>
            <p className="text-xl text-gray-200 max-w-2xl mb-6">
              {recipe.description}
            </p>
            <div className="flex flex-wrap gap-6 text-white">
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-6 w-6" />
                <span>Prep: {recipe.prepTime}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FireIcon className="h-6 w-6" />
                <span>Cook: {recipe.cookTime}</span>
              </div>
              <div className="flex items-center space-x-2">
                <UserIcon className="h-6 w-6" />
                <span>Serves: {recipe.servings}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mb-8">
          <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white shadow-sm hover:bg-gray-50">
            <PrintIcon className="h-5 w-5 text-gray-600" />
            <span>Print</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white shadow-sm hover:bg-gray-50">
            <ShareIcon className="h-5 w-5 text-gray-600" />
            <span>Share</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white shadow-sm hover:bg-gray-50">
            <BookmarkIcon className="h-5 w-5 text-gray-600" />
            <span>Save</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            className={`px-6 py-3 text-lg font-medium border-b-2 ${
              activeTab === 'ingredients'
                ? 'border-accent-warm text-accent-warm'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('ingredients')}
          >
            Ingredients
          </button>
          <button
            className={`px-6 py-3 text-lg font-medium border-b-2 ${
              activeTab === 'instructions'
                ? 'border-accent-warm text-accent-warm'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('instructions')}
          >
            Instructions
          </button>
          <button
            className={`px-6 py-3 text-lg font-medium border-b-2 ${
              activeTab === 'serving'
                ? 'border-accent-warm text-accent-warm'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('serving')}
          >
            Serving Ideas
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {activeTab === 'ingredients' ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-6">Ingredients</h2>
              <div className="grid gap-4">
                {recipe.ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-lg">{ingredient.name}</span>
                    <span className="text-gray-600">
                      {ingredient.amount} {ingredient.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'instructions' ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-6">Instructions</h2>
              {recipe.steps.map((step) => (
                <div key={step.number} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-warm text-white flex items-center justify-center">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg mb-2">{step.instruction}</p>
                    {step.timing && (
                      <p className="text-sm text-gray-500 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {step.timing}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-6">Plating Suggestions</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {recipe.sideDishes.map((dish, index) => (
                    <div key={index} className="group">
                      <div className="relative overflow-hidden rounded-lg mb-4">
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-full h-64 object-cover transform group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{dish.name}</h3>
                      <p className="text-gray-600">{dish.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-6">Plating Tips</h2>
                <div className="bg-primary-50 rounded-lg p-6">
                  <ul className="space-y-4">
                    {recipe.platingTips.map((tip, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-warm text-white flex items-center justify-center text-sm">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-6">Wine Pairing</h2>
                <div className="bg-accent-warm/5 rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium mb-2">Recommended Wines</h3>
                      <ul className="space-y-2 text-gray-700">
                        <li>• Full-bodied Cabernet Sauvignon</li>
                        <li>• Rich Malbec</li>
                        <li>• Bold Syrah/Shiraz</li>
                      </ul>
                      <p className="mt-4 text-sm text-gray-600">
                        Look for wines with good tannin structure to complement the rich flavors of the meat.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
