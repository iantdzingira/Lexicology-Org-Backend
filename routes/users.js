const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Word = require('../models/Word');

// Creating new user (Sign up)
router.post('/signup', async (req, res, next) => {
  try {
    const userData = req.body;
    
    // Validating required fields
    if (!userData.firstName || !userData.lastName || !userData.birthDate) {
      return res.status(400).json({
        error: 'Missing required fields: firstName, lastName, birthDate'
      });
    }

    // Checking if email already exists
    if (userData.email) {
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({
          error: 'Email already registered'
        });
      }
    }

    const user = await User.create(userData);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        birthDate: user.birth_date,
        categories: JSON.parse(user.categories),
        createdAt: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user profile
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const categories = await User.getUserCategories(userId);
    const stats = await User.getUserStats(userId);

    res.json({
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        birthDate: user.birth_date,
        categories: JSON.parse(user.categories),
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      categories,
      stats
    });
  } catch (error) {
    next(error);
  }
});

// Updating user profile
router.put('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const userData = req.body;

    // Checking if user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check email uniqueness if being updated
    if (userData.email && userData.email !== existingUser.email) {
      const userWithEmail = await User.findByEmail(userData.email);
      if (userWithEmail && userWithEmail.id !== userId) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    const updatedUser = await User.update(userId, userData);
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        birthDate: updatedUser.birth_date,
        categories: JSON.parse(updatedUser.categories),
        updatedAt: updatedUser.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user's words
router.get('/:userId/words', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { 
      search = '', 
      sort = 'newest', 
      category = '',
      page = 1,
      limit = 20
    } = req.query;

    // Map sort parameter to database fields
    const sortMap = {
      'newest': { sortBy: 'creation_date', sortOrder: 'DESC' },
      'oldest': { sortBy: 'creation_date', sortOrder: 'ASC' },
      'aToZ': { sortBy: 'word', sortOrder: 'ASC' },
      'zToA': { sortBy: 'word', sortOrder: 'DESC' }
    };

    const sortOptions = sortMap[sort] || sortMap.newest;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const words = await Word.findByUser(userId, {
      search,
      sortBy: sortOptions.sortBy,
      sortOrder: sortOptions.sortOrder,
      category: category || null,
      limit: parseInt(limit),
      offset
    });

    const totalWords = await Word.getUserWordCount(userId);
    const categories = await Word.getUserCategories(userId);

    res.json({
      words,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalWords,
        totalPages: Math.ceil(totalWords / parseInt(limit))
      },
      categories
    });
  } catch (error) {
    next(error);
  }
});

// Get user statistics
router.get('/:userId/stats', async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const stats = await User.getUserStats(userId);
    const categories = await Word.getUserCategories(userId);
    const recentWords = await Word.getRecentWords(userId, 5);

    res.json({
      stats,
      categories,
      recentWords
    });
  } catch (error) {
    next(error);
  }
});

// Get all categories
router.get('/categories/all', async (req, res, next) => {
  try {
    const categories = await Word.getCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

module.exports = router;