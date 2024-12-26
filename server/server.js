require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const auth = require('./middleware/auth');
const userService = require('./services/userService');
const visionService = require('./services/visionService');
const recipeService = require('./services/recipeService');
const nutritionService = require('./services/nutritionService');
const mealPlanService = require('./services/mealPlanService');
const securityMonitorService = require('./services/securityMonitorService');
const keyRotationService = require('./services/keyRotationService');
const auditService = require('./services/auditService');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Security middleware
app.use(async (req, res, next) => {
  try {
    // Log request for security monitoring
    await securityMonitorService.logSecurityEvent({
      type: 'request',
      ip: req.ip,
      details: {
        method: req.method,
        path: req.path,
        userAgent: req.headers['user-agent']
      }
    });

    // Create audit log
    await auditService.logAction({
      userId: req.userId,
      action: req.method,
      resource: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'pending'
    });

    // Store audit ID for response logging
    req.auditId = Date.now();

    // Modify response to log audit completion
    const originalSend = res.send;
    res.send = function (body) {
      auditService.logAction({
        userId: req.userId,
        action: req.method,
        resource: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        status: res.statusCode < 400 ? 'success' : 'failure',
        details: { responseStatus: res.statusCode }
      });
      
      originalSend.call(this, body);
    };

    next();
  } catch (error) {
    next(error);
  }
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await userService.register(email, password);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await userService.login(email, password);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Protected Routes
app.post('/api/scan', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Get user preferences
    const user = await userService.getUserById(req.userId);
    const dietaryPreferences = user.preferences.dietaryRestrictions || [];

    // Detect ingredients from image
    const ingredients = await visionService.detectIngredients(req.file.buffer);
    
    // Get recipe suggestions based on ingredients and dietary preferences
    const recipes = await recipeService.suggestRecipes(ingredients, dietaryPreferences);

    // Add to user history
    await userService.addToHistory(req.userId, ingredients, recipes[0].id);

    res.json({
      success: true,
      ingredients,
      suggestions: recipes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ 
      error: 'Error processing image',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get('/api/preferences', auth, async (req, res) => {
  try {
    const user = await userService.getUserById(req.userId);
    res.json(user.preferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/preferences', auth, async (req, res) => {
  try {
    const preferences = req.body;
    const updatedPreferences = await userService.updatePreferences(req.userId, preferences);
    res.json(updatedPreferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/recipes/:recipeId/rate', auth, async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const ratings = await userService.rateRecipe(
      req.userId,
      req.params.recipeId,
      rating,
      feedback
    );
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/recipes/:recipeId/favorite', auth, async (req, res) => {
  try {
    const { recipeName } = req.body;
    const favorites = await userService.toggleFavorite(
      req.userId,
      req.params.recipeId,
      recipeName
    );
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/history', auth, async (req, res) => {
  try {
    const history = await userService.getUserHistory(req.userId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/favorites', auth, async (req, res) => {
  try {
    const favorites = await userService.getFavoriteRecipes(req.userId);
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Nutrition Routes
app.post('/api/recipes/:recipeId/nutrition', auth, async (req, res) => {
  try {
    const recipe = await recipeService.getRecipeById(req.params.recipeId);
    const nutrition = await nutritionService.analyzeRecipe(recipe);
    res.json(nutrition);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Meal Planning Routes
app.post('/api/meal-plans', auth, async (req, res) => {
  try {
    const plan = await mealPlanService.createPlan(req.userId, req.body.preferences);
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/meal-plans', auth, async (req, res) => {
  try {
    const plans = await mealPlanService.getUserPlans(req.userId);
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/meal-plans/:planId', auth, async (req, res) => {
  try {
    const plan = await mealPlanService.getPlanById(req.params.planId);
    if (!plan || plan.userId.toString() !== req.userId) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/meal-plans/:planId', auth, async (req, res) => {
  try {
    const plan = await mealPlanService.updatePlan(req.params.planId, req.body);
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/meal-plans/:planId/shopping-list', auth, async (req, res) => {
  try {
    const shoppingList = await mealPlanService.updateShoppingList(
      req.params.planId,
      req.body.updates
    );
    res.json(shoppingList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Security monitoring routes (protected, admin only)
app.get('/api/security/audit', auth, async (req, res) => {
  try {
    const logs = await auditService.queryAuditLogs(req.query);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/security/audit/report', auth, async (req, res) => {
  try {
    const report = await auditService.generateAuditReport(req.query);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/security/audit/export', auth, async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const data = await auditService.exportAuditLogs(req.query, format);
    
    res.setHeader('Content-Disposition', `attachment; filename=audit_logs.${format}`);
    res.send(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/security/monitor', auth, async (req, res) => {
  try {
    const startDate = req.query.startDate || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate || new Date();
    
    const report = await securityMonitorService.generateSecurityReport(startDate, endDate);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/security/keys/rotate', auth, async (req, res) => {
  try {
    const { keyType } = req.body;
    
    switch (keyType) {
      case 'jwt':
        await keyRotationService.rotateJWTSecret();
        break;
      case 'encryption':
        await keyRotationService.rotateEncryptionKey();
        break;
      case 'api':
        await keyRotationService.rotateAPIKeys();
        break;
      default:
        throw new Error('Invalid key type');
    }
    
    res.json({ message: 'Key rotation successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available dietary restrictions
app.get('/api/dietary-options', (req, res) => {
  const dietaryService = require('./services/dietaryService');
  res.json({
    success: true,
    options: Object.keys(dietaryService.restrictions)
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Initialize security services
(async () => {
  try {
    await keyRotationService.initialize();
    console.log('Security services initialized successfully');
  } catch (error) {
    console.error('Error initializing security services:', error);
  }
})();

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Vision API and Recipe Service initialized`);
});
