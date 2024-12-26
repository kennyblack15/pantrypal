import React from 'react';
import { StarIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';

interface Recipe {
  id: number;
  title: string;
  image: string;
  prepTime: string;
  servings: number;
  difficulty: string;
  rating: number;
}

const demoRecipes: Recipe[] = [
  {
    id: 1,
    title: "Pasta Primavera",
    image: "https://source.unsplash.com/random/400x300?pasta",
    prepTime: "30 mins",
    servings: 4,
    difficulty: "Easy",
    rating: 4.5
  },
  // Add more demo recipes here
];

const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <img
        src={recipe.image}
        alt={recipe.title}
        className="w-full h-48 object-cover rounded-t-lg"
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{recipe.title}</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            {recipe.prepTime}
          </div>
          <div className="flex items-center">
            <UserIcon className="h-4 w-4 mr-1" />
            {recipe.servings} servings
          </div>
          <div className="flex items-center">
            <StarIcon className="h-4 w-4 mr-1" />
            {recipe.rating}
          </div>
        </div>
      </div>
    </div>
  );
};

const Recipes = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Recipes</h1>
        <div className="flex space-x-4">
          <input
            type="search"
            placeholder="Search recipes..."
            className="input-field"
          />
          <select className="input-field">
            <option value="">All Categories</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demoRecipes.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
};

export default Recipes;
