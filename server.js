const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database('./vocab_app.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        firstName TEXT,
        lastName TEXT,
        birthDate TEXT,
        categories TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS words (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        word TEXT,
        meaning TEXT,
        sentence TEXT,
        source TEXT,
        creation_date TEXT
    )`);
});

app.post('/api/users', (req, res) => {
    const { firstName, lastName, birthDate, email, categories } = req.body;
    const categoriesString = JSON.stringify(categories);
    
    const sql = `INSERT OR REPLACE INTO users (firstName, lastName, birthDate, email, categories) VALUES (?, ?, ?, ?, ?)`;
    const params = [firstName, lastName, birthDate, email, categoriesString];
    
    db.run(sql, params, function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.status(201).json({ message: "User saved", id: this.lastID });
    });
});

app.post('/api/words', (req, res) => {
    const { id, user_id, word, meaning, sentence, source, creation_date } = req.body;
    
    const sql = `INSERT INTO words (id, user_id, word, meaning, sentence, source, creation_date) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [id, user_id, word, meaning, sentence, source, creation_date];
    
    db.run(sql, params, function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.status(201).json({ message: "Word uploaded", id: id });
    });
});

app.get('/api/words', (req, res) => {
    db.all("SELECT * FROM words ORDER BY creation_date DESC", [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});