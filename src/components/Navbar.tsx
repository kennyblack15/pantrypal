import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, CameraIcon, BookOpenIcon, UserIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-primary-600' : 'text-gray-600 hover:text-primary-500';
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="PantryPal" className="h-8 w-auto" />
            <span className="text-xl font-bold text-primary-600">PantryPal</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex space-x-8">
            <Link to="/" className={`flex items-center space-x-1 ${isActive('/')}`}>
              <HomeIcon className="h-5 w-5" />
              <span>Home</span>
            </Link>
            <Link to="/scan" className={`flex items-center space-x-1 ${isActive('/scan')}`}>
              <CameraIcon className="h-5 w-5" />
              <span>Scan</span>
            </Link>
            <Link to="/recipes" className={`flex items-center space-x-1 ${isActive('/recipes')}`}>
              <BookOpenIcon className="h-5 w-5" />
              <span>Recipes</span>
            </Link>
            <Link to="/profile" className={`flex items-center space-x-1 ${isActive('/profile')}`}>
              <UserIcon className="h-5 w-5" />
              <span>Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
