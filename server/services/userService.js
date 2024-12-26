const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  preferences: {
    dietaryRestrictions: [String],
    allergies: [String],
    favoriteRecipes: [{
      recipeId: String,
      name: String,
      timestamp: Date
    }],
    ratings: [{
      recipeId: String,
      rating: Number,
      feedback: String,
      timestamp: Date
    }]
  },
  history: [{
    ingredients: [String],
    recipeId: String,
    timestamp: Date
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model('User', userSchema);

class UserService {
  constructor() {
    this.connect();
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
    }
  }

  generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });
  }

  async register(email, password) {
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('Email already registered');
      }

      const user = new User({
        email,
        password,
        preferences: {
          dietaryRestrictions: [],
          allergies: [],
          favoriteRecipes: [],
          ratings: []
        }
      });

      await user.save();
      const token = this.generateToken(user._id);

      return {
        token,
        user: {
          id: user._id,
          email: user.email,
          preferences: user.preferences
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async login(email, password) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('User not found');
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error('Invalid password');
      }

      const token = this.generateToken(user._id);

      return {
        token,
        user: {
          id: user._id,
          email: user.email,
          preferences: user.preferences
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async updatePreferences(userId, preferences) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { preferences } },
        { new: true }
      );

      return user.preferences;
    } catch (error) {
      throw error;
    }
  }

  async addToHistory(userId, ingredients, recipeId) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            history: {
              ingredients,
              recipeId,
              timestamp: new Date()
            }
          }
        },
        { new: true }
      );

      return user.history;
    } catch (error) {
      throw error;
    }
  }

  async rateRecipe(userId, recipeId, rating, feedback) {
    try {
      const user = await User.findById(userId);
      
      // Update existing rating or add new one
      const ratingIndex = user.preferences.ratings.findIndex(
        r => r.recipeId === recipeId
      );

      if (ratingIndex > -1) {
        user.preferences.ratings[ratingIndex] = {
          recipeId,
          rating,
          feedback,
          timestamp: new Date()
        };
      } else {
        user.preferences.ratings.push({
          recipeId,
          rating,
          feedback,
          timestamp: new Date()
        });
      }

      await user.save();
      return user.preferences.ratings;
    } catch (error) {
      throw error;
    }
  }

  async toggleFavorite(userId, recipeId, recipeName) {
    try {
      const user = await User.findById(userId);
      
      const favoriteIndex = user.preferences.favoriteRecipes.findIndex(
        f => f.recipeId === recipeId
      );

      if (favoriteIndex > -1) {
        // Remove from favorites
        user.preferences.favoriteRecipes.splice(favoriteIndex, 1);
      } else {
        // Add to favorites
        user.preferences.favoriteRecipes.push({
          recipeId,
          name: recipeName,
          timestamp: new Date()
        });
      }

      await user.save();
      return user.preferences.favoriteRecipes;
    } catch (error) {
      throw error;
    }
  }

  async getUserHistory(userId) {
    try {
      const user = await User.findById(userId);
      return user.history;
    } catch (error) {
      throw error;
    }
  }

  async getFavoriteRecipes(userId) {
    try {
      const user = await User.findById(userId);
      return user.preferences.favoriteRecipes;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserService();
