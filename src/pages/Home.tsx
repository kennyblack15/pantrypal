import React from 'react';
import { Link } from 'react-router-dom';
import { CameraIcon, ArrowRightIcon, SparklesIcon, BookmarkIcon } from '@heroicons/react/24/outline';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Dynamic Food Image */}
      <div className="relative h-[80vh] bg-black overflow-hidden">
        <img
          src="/images/hero-sandwich.jpg"
          alt="Dynamic food composition"
          className="absolute w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
        <div className="relative max-w-4xl mx-auto px-4 h-full flex items-center">
          <div className="text-white">
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
              Turn Your Ingredients into
              <span className="text-accent-warm"> Culinary Magic</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl">
              Snap a photo of your ingredients and let PantryPal suggest amazing recipes you can create right now.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/scan"
                className="btn-primary inline-flex items-center justify-center space-x-2 text-lg px-6 py-3"
              >
                <CameraIcon className="h-6 w-6" />
                <span>Start Cooking</span>
              </Link>
              <Link
                to="/recipes"
                className="inline-flex items-center justify-center space-x-2 text-lg px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors duration-200"
              >
                <SparklesIcon className="h-6 w-6" />
                <span>Explore Recipes</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card bg-white/80 backdrop-blur">
            <CameraIcon className="h-10 w-10 text-accent-warm mb-4" />
            <h3 className="text-xl font-semibold mb-2">Instant Recognition</h3>
            <p className="text-gray-600">
              Our AI instantly identifies ingredients from your photos, making recipe discovery effortless.
            </p>
          </div>
          <div className="card bg-white/80 backdrop-blur">
            <SparklesIcon className="h-10 w-10 text-accent-warm mb-4" />
            <h3 className="text-xl font-semibold mb-2">Smart Suggestions</h3>
            <p className="text-gray-600">
              Get personalized recipe recommendations based on what you already have in your kitchen.
            </p>
          </div>
          <div className="card bg-white/80 backdrop-blur">
            <BookmarkIcon className="h-10 w-10 text-accent-warm mb-4" />
            <h3 className="text-xl font-semibold mb-2">Save Favorites</h3>
            <p className="text-gray-600">
              Build your personal cookbook with recipes you love and want to make again.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-accent-sauce py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
            Ready to Transform Your Cooking?
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            Join thousands of home chefs discovering new recipes every day.
          </p>
          <Link
            to="/scan"
            className="inline-flex items-center space-x-2 bg-white text-accent-sauce px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
          >
            <span>Get Started Now</span>
            <ArrowRightIcon className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
