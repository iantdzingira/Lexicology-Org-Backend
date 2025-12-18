const { dbRun, dbGet, dbAll, generateId } = require('../database');

class User {
  static async create(userData) {
    const id = generateId();
    const { firstName, lastName, email, birthDate, categories = [] } = userData;
    
    const sql = `
      INSERT INTO users (id, first_name, last_name, email, birth_date, categories)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      id,
      firstName,
      lastName,
      email || null,
      birthDate,
      JSON.stringify(categories)
    ];
    
    await dbRun(sql, params);
    
    // Link user to selected categories
    if (categories.length > 0) {
      await this.linkUserToCategories(id, categories);
    }
    
    return this.findById(id);
  }

  static async findById(id) {
    const sql = 'SELECT * FROM users WHERE id = ?';
    const user = await dbGet(sql, [id]);
    
    if (user) {
      user.categories = JSON.parse(user.categories || '[]');
    }
    
    return user;
  }

  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const user = await dbGet(sql, [email]);
    
    if (user) {
      user.categories = JSON.parse(user.categories || '[]');
    }
    
    return user;
  }

  static async update(id, userData) {
    const { firstName, lastName, email, birthDate, categories } = userData;
    
    const sql = `
      UPDATE users 
      SET first_name = ?, last_name = ?, email = ?, birth_date = ?, categories = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const params = [
      firstName,
      lastName,
      email || null,
      birthDate,
      JSON.stringify(categories),
      id
    ];
    
    await dbRun(sql, params);
    
    // Update user categories
    await this.updateUserCategories(id, categories);
    
    return this.findById(id);
  }

  static async linkUserToCategories(userId, categories) {
    // First, get category IDs
    const categorySql = 'SELECT id FROM categories WHERE name IN (' + categories.map(() => '?').join(',') + ')';
    const categoryRows = await dbAll(categorySql, categories);
    
    // Insert user-category relationships
    for (const category of categoryRows) {
      const linkSql = 'INSERT OR IGNORE INTO user_categories (user_id, category_id) VALUES (?, ?)';
      await dbRun(linkSql, [userId, category.id]);
    }
  }

  static async updateUserCategories(userId, categories) {
    // Remove all existing user categories
    const deleteSql = 'DELETE FROM user_categories WHERE user_id = ?';
    await dbRun(deleteSql, [userId]);
    
    // Add new categories
    if (categories.length > 0) {
      await this.linkUserToCategories(userId, categories);
    }
  }

  static async getUserCategories(userId) {
    const sql = `
      SELECT c.name, c.icon 
      FROM categories c
      JOIN user_categories uc ON c.id = uc.category_id
      WHERE uc.user_id = ?
    `;
    
    return await dbAll(sql, [userId]);
  }

  static async getAll() {
    const sql = 'SELECT * FROM users ORDER BY created_at DESC';
    const users = await dbAll(sql);
    
    return users.map(user => ({
      ...user,
      categories: JSON.parse(user.categories || '[]')
    }));
  }

  static async delete(id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    return await dbRun(sql, [id]);
  }

  static async getUserStats(userId) {
    const wordsSql = 'SELECT COUNT(*) as total_words FROM words WHERE user_id = ?';
    const categoriesSql = `
      SELECT COUNT(DISTINCT category) as unique_categories 
      FROM words 
      WHERE user_id = ? AND category IS NOT NULL
    `;
    const recentWordsSql = `
      SELECT COUNT(*) as recent_words 
      FROM words 
      WHERE user_id = ? 
      AND creation_date >= datetime('now', '-7 days')
    `;

    const [words, categories, recentWords] = await Promise.all([
      dbGet(wordsSql, [userId]),
      dbGet(categoriesSql, [userId]),
      dbGet(recentWordsSql, [userId])
    ]);

    return {
      totalWords: words.total_words || 0,
      uniqueCategories: categories.unique_categories || 0,
      recentWords: recentWords.recent_words || 0
    };
  }
}

module.exports = User;