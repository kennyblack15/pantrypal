import React from 'react';
import { CogIcon, HeartIcon, BookmarkIcon } from '@heroicons/react/24/outline';

const Profile = () => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="card mb-8">
        <div className="flex items-center space-x-4">
          <img
            src="https://source.unsplash.com/random/100x100?portrait"
            alt="Profile"
            className="w-20 h-20 rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">John Doe</h1>
            <p className="text-gray-600">Food enthusiast & home chef</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">12</div>
          <div className="text-gray-600">Recipes Created</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">48</div>
          <div className="text-gray-600">Recipes Saved</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">156</div>
          <div className="text-gray-600">Photos Taken</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button className="card flex items-center justify-center space-x-2 hover:bg-gray-50">
          <HeartIcon className="h-5 w-5 text-primary-600" />
          <span>Favorite Recipes</span>
        </button>
        <button className="card flex items-center justify-center space-x-2 hover:bg-gray-50">
          <BookmarkIcon className="h-5 w-5 text-primary-600" />
          <span>Saved Items</span>
        </button>
        <button className="card flex items-center justify-center space-x-2 hover:bg-gray-50">
          <CogIcon className="h-5 w-5 text-primary-600" />
          <span>Settings</span>
        </button>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 py-2 border-b last:border-0">
              <div className="w-2 h-2 rounded-full bg-primary-500"></div>
              <div className="flex-1">
                <p className="text-gray-900">Scanned ingredients for dinner</p>
                <p className="text-sm text-gray-500">2 hours ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
