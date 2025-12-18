const { dbRun, dbGet, dbAll, generateId } = require('../database');

class Word {
  static async create(wordData) {
    const id = generateId();
    const { userId, word, meaning, sentence, category = null, source = 'User' } = wordData;
    
    const sql = `
      INSERT INTO words (id, user_id, word, meaning, sentence, category, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [id, userId, word, meaning, sentence, category, source];
    
    await dbRun(sql, params);
    return this.findById(id);
  }

  static async findById(id) {
    const sql = `
      SELECT w.*, 
             u.first_name, 
             u.last_name,
             u.email
      FROM words w
      LEFT JOIN users u ON w.user_id = u.id
      WHERE w.id = ?
    `;
    
    return await dbGet(sql, [id]);
  }

  static async findByUser(userId, options = {}) {
    const { 
      search = '', 
      sortBy = 'creation_date', 
      sortOrder = 'DESC',
      category = null,
      limit = 50,
      offset = 0
    } = options;

    let sql = `
      SELECT * FROM words 
      WHERE user_id = ?
    `;
    
    const params = [userId];

    // Add search filter
    if (search) {
      sql += ` AND (word LIKE ? OR meaning LIKE ? OR sentence LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Add category filter
    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    // Add sorting
    const validSortFields = ['word', 'creation_date', 'updated_at'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'creation_date';
    const order = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    sql += ` ORDER BY ${sortField} ${order}`;

    // Add pagination
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return await dbAll(sql, params);
  }

  static async update(id, wordData) {
    const { word, meaning, sentence, category } = wordData;
    
    const sql = `
      UPDATE words 
      SET word = ?, meaning = ?, sentence = ?, category = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const params = [word, meaning, sentence, category, id];
    
    await dbRun(sql, params);
    return this.findById(id);
  }

  static async delete(id) {
    const sql = 'DELETE FROM words WHERE id = ?';
    return await dbRun(sql, [id]);
  }

  static async getUserWordCount(userId) {
    const sql = 'SELECT COUNT(*) as count FROM words WHERE user_id = ?';
    const result = await dbGet(sql, [userId]);
    return result.count;
  }

  static async getUserCategories(userId) {
    const sql = `
      SELECT category, COUNT(*) as count
      FROM words 
      WHERE user_id = ? AND category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `;
    
    return await dbAll(sql, [userId]);
  }

  static async getRecentWords(userId, limit = 10) {
    const sql = `
      SELECT * FROM words 
      WHERE user_id = ? 
      ORDER BY creation_date DESC 
      LIMIT ?
    `;
    
    return await dbAll(sql, [userId, limit]);
  }

  static async searchGlobal(searchTerm, options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    const sql = `
      SELECT w.*, 
             u.first_name, 
             u.last_name,
             u.email
      FROM words w
      LEFT JOIN users u ON w.user_id = u.id
      WHERE w.word LIKE ? OR w.meaning LIKE ?
      ORDER BY w.creation_date DESC
      LIMIT ? OFFSET ?
    `;
    
    const searchPattern = `%${searchTerm}%`;
    return await dbAll(sql, [searchPattern, searchPattern, limit, offset]);
  }

  static async getCategories() {
    const sql = `
      SELECT name, icon, 
             (SELECT COUNT(*) FROM words WHERE category = categories.name) as word_count
      FROM categories
      ORDER BY name
    `;
    
    return await dbAll(sql);
  }

  static async getStats() {
    const totalWordsSql = 'SELECT COUNT(*) as total FROM words';
    const totalUsersSql = 'SELECT COUNT(*) as total FROM users';
    const recentActivitySql = `
      SELECT COUNT(*) as recent 
      FROM words 
      WHERE creation_date >= datetime('now', '-24 hours')
    `;
    const popularCategoriesSql = `
      SELECT category, COUNT(*) as count
      FROM words 
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
      LIMIT 5
    `;

    const [totalWords, totalUsers, recentActivity, popularCategories] = await Promise.all([
      dbGet(totalWordsSql),
      dbGet(totalUsersSql),
      dbGet(recentActivitySql),
      dbAll(popularCategoriesSql)
    ]);

    return {
      totalWords: totalWords.total || 0,
      totalUsers: totalUsers.total || 0,
      recentActivity: recentActivity.recent || 0,
      popularCategories: popularCategories
    };
  }
}

module.exports = Word;