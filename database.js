const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const DB_PATH = path.join(__dirname, 'database', 'lexicology.db');

let db;

// Initializing database connection
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
        return;
      }
      
      console.log('Connected to SQLite database');
      
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('Error enabling foreign keys:', err.message);
          reject(err);
          return;
        }
        
        // Creating tables
        createTables().then(resolve).catch(reject);
      });
    });
  });
};

// Create all required tables
const createTables = () => {
  return new Promise((resolve, reject) => {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE,
        birth_date TEXT NOT NULL,
        categories TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createWordsTable = `
      CREATE TABLE IF NOT EXISTS words (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        word TEXT NOT NULL,
        meaning TEXT NOT NULL,
        sentence TEXT NOT NULL,
        category TEXT,
        source TEXT DEFAULT 'User',
        creation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `;

    const createCategoriesTable = `
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        icon TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createUserCategoriesTable = `
      CREATE TABLE IF NOT EXISTS user_categories (
        user_id TEXT,
        category_id INTEGER,
        PRIMARY KEY (user_id, category_id),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
      )
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_words_user_id ON words(user_id);
      CREATE INDEX IF NOT EXISTS idx_words_category ON words(category);
      CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `;

    db.serialize(() => {
      db.run(createUsersTable, (err) => {
        if (err) reject(err);
      });
      
      db.run(createWordsTable, (err) => {
        if (err) reject(err);
      });
      
      db.run(createCategoriesTable, (err) => {
        if (err) reject(err);
      });
      
      db.run(createUserCategoriesTable, (err) => {
        if (err) reject(err);
      });
      
      db.run(createIndexes, (err) => {
        if (err) reject(err);
      });
      
      // Inserting default categories
      insertDefaultCategories().then(() => {
        console.log('Database tables created successfully');
        resolve();
      }).catch(reject);
    });
  });
};

// default word categories
const insertDefaultCategories = () => {
  return new Promise((resolve, reject) => {
    const categories = [
      { name: 'Technical', icon: 'gear' },
      { name: 'Programming', icon: 'keyboard' },
      { name: 'Cooking', icon: 'fork.knife' },
      { name: 'Sports', icon: 'sportscourt' },
      { name: 'History', icon: 'book.closed' },
      { name: 'Science', icon: 'atom' },
      { name: 'Arts & Culture', icon: 'paintpalette' },
      { name: 'Slang', icon: 'quote.bubble' },
      { name: 'Academic', icon: 'graduationcap' },
      { name: 'Colloquial', icon: 'waveform' },
      { name: 'Finance', icon: 'dollarsign.circle' },
      { name: 'Philosophy', icon: 'brain.head.profile' },
      { name: 'Literature', icon: 'book' },
      { name: 'Medical', icon: 'stethoscope' },
      { name: 'Technology', icon: 'laptopcomputer' }
    ];

    const insertCategory = db.prepare(`
      INSERT OR IGNORE INTO categories (name, icon) 
      VALUES (?, ?)
    `);

    categories.forEach(category => {
      insertCategory.run([category.name, category.icon]);
    });

    insertCategory.finalize((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Database query helper functions
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Generate UUID
const generateId = () => uuidv4();

module.exports = {
  initializeDatabase,
  dbRun,
  dbGet,
  dbAll,
  generateId,
  getDb: () => db
};