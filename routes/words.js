const express = require('express');
const router = express.Router();
const Word = require('../models/Word');
const User = require('../models/User');

// Create new word
router.post('/', async (req, res, next) => {
  try {
    const wordData = req.body;

    // Validate required fields
    if (!wordData.userId || !wordData.word || !wordData.meaning || !wordData.sentence) {
      return res.status(400).json({
        error: 'Missing required fields: userId, word, meaning, sentence'
      });
    }

    // Check if user exists
    const user = await User.findById(wordData.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const word = await Word.create(wordData);
    
    res.status(201).json({
      success: true,
      message: 'Word created successfully',
      word
    });
  } catch (error) {
    next(error);
  }
});

// Get all words with filtering and sorting
router.get('/', async (req, res, next) => {
  try {
    const { 
      userId = '',
      search = '',
      sort = 'newest',
      category = '',
      page = 1,
      limit = 50
    } = req.query;

    let words;
    let total = 0;

    if (userId) {
      // Get user's words
      const sortMap = {
        'newest': { sortBy: 'creation_date', sortOrder: 'DESC' },
        'oldest': { sortBy: 'creation_date', sortOrder: 'ASC' },
        'aToZ': { sortBy: 'word', sortOrder: 'ASC' },
        'zToA': { sortBy: 'word', sortOrder: 'DESC' }
      };

      const sortOptions = sortMap[sort] || sortMap.newest;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      words = await Word.findByUser(userId, {
        search,
        sortBy: sortOptions.sortBy,
        sortOrder: sortOptions.sortOrder,
        category: category || null,
        limit: parseInt(limit),
        offset
      });

      total = await Word.getUserWordCount(userId);
    } else {
      // Get all words (admin view)
      words = await Word.searchGlobal(search, {
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });
      
      // For demo purposes - in production, you'd have a separate count query
      total = words.length;
    }

    res.json({
      words,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get specific word
router.get('/:wordId', async (req, res, next) => {
  try {
    const { wordId } = req.params;
    const word = await Word.findById(wordId);
    
    if (!word) {
      return res.status(404).json({ error: 'Word not found' });
    }

    res.json(word);
  } catch (error) {
    next(error);
  }
});

// Update word
router.put('/:wordId', async (req, res, next) => {
  try {
    const { wordId } = req.params;
    const wordData = req.body;

    // Check if word exists
    const existingWord = await Word.findById(wordId);
    if (!existingWord) {
      return res.status(404).json({ error: 'Word not found' });
    }

    const updatedWord = await Word.update(wordId, wordData);
    
    res.json({
      success: true,
      message: 'Word updated successfully',
      word: updatedWord
    });
  } catch (error) {
    next(error);
  }
});

// Delete word
router.delete('/:wordId', async (req, res, next) => {
  try {
    const { wordId } = req.params;

    // Check if word exists
    const existingWord = await Word.findById(wordId);
    if (!existingWord) {
      return res.status(404).json({ error: 'Word not found' });
    }

    await Word.delete(wordId);
    
    res.json({
      success: true,
      message: 'Word deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get word statistics
router.get('/stats/overview', async (req, res, next) => {
  try {
    const stats = await Word.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Get all categories
router.get('/categories/list', async (req, res, next) => {
  try {
    const categories = await Word.getCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

// Search words globally
router.get('/search/global', async (req, res, next) => {
  try {
    const { q: searchTerm, limit = 20 } = req.query;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({
        error: 'Search term must be at least 2 characters'
      });
    }

    const words = await Word.searchGlobal(searchTerm.trim(), {
      limit: parseInt(limit)
    });

    res.json(words);
  } catch (error) {
    next(error);
  }
});

module.exports = router;