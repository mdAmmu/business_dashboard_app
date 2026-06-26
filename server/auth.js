// Simple Auth & Employee Backend (Express + SQLite + JWT + bcrypt)
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const SECRET = 'supersecretkey'; // Use env var in production
const DB_PATH = __dirname + '/data/app.db';

app.use(cors());
app.use(bodyParser.json());

// --- SQLite Setup ---
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT
  )`);
  // Create default admin if not exists
  db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
    if (!row) {
      bcrypt.hash('admin123', 10, (err, hash) => {
        db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hash, 'admin']);
      });
    }
  });
});

// --- Middleware: JWT Auth ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// --- Middleware: Admin Only ---
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  next();
}

// --- Routes ---
// Login (admin or employee)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    bcrypt.compare(password, user.password, (err, result) => {
      if (!result) return res.status(401).json({ error: 'Invalid credentials' });
      // Issue JWT
      const token = jwt.sign({ username: user.username, role: user.role }, SECRET, { expiresIn: '1h' });
      res.json({ token, role: user.role });
    });
  });
});

// Add Employee (admin only)
app.post('/employees', authenticateToken, adminOnly, (req, res) => {
  const { name, email, username, password } = req.body;
  if (!name || !email || !username || !password) return res.status(400).json({ error: 'Missing fields' });
  // Add to employees table
  db.run('INSERT INTO employees (name, email) VALUES (?, ?)', [name, email], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to add employee' });
    // Add to users table as employee
    bcrypt.hash(password, 10, (err, hash) => {
      db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hash, 'employee']);
      res.json({ id: this.lastID, name, email, username });
    });
  });
});

// List Employees (any logged-in user)
app.get('/employees', authenticateToken, (req, res) => {
  db.all('SELECT * FROM employees', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch employees' });
    res.json(rows);
  });
});

// --- Start Server ---
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
}); 