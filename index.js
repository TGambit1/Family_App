const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Create the express application
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Middlewares
app.use(cors());
app.use(express.json());

// Path to our simple JSON data store.  In a real production system this would
// be replaced with a proper database such as PostgreSQL or MongoDB, but for
// demonstration purposes a JSON file keeps the example self‑contained and
// easy to run without additional setup.  All reads/writes are performed
// asynchronously to avoid blocking the event loop.
const dataPath = `${__dirname}/data.json`;

async function readData() {
  try {
    const data = await fs.readFile(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // Return sensible defaults if the file does not exist or is malformed.
    return {
      users: [],
      posts: [],
      tasks: [],
      categories: {}
    };
  }
}

async function writeData(data) {
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, role }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'owner' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Simple helper that returns a flat array of task objects filtered by category
 * and subcategory.  Each task has the shape { id, title, completed, category,
 * subcategory, createdAt }.
 */
function filterTasks(tasks, category, subcategory) {
  return tasks.filter(task => {
    if (category && task.category !== category) return false;
    if (subcategory && task.subcategory !== subcategory) return false;
    return true;
  });
}

// Auth & users
// Registration: creates a user in "pending" status until admin approves.
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  const data = await readData();
  const existing = data.users.find(u => u.email?.toLowerCase() === String(email).toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const hasApprovedAdmin = data.users.some(u => (u.role === 'owner' || u.role === 'admin') && u.status === 'approved');
  const role = hasApprovedAdmin ? 'member' : 'owner';
  const status = role === 'owner' ? 'approved' : 'pending';
  const user = {
    id: uuidv4(),
    name,
    email,
    passwordHash,
    role,
    status,
    createdAt: new Date().toISOString()
  };
  data.users.push(user);
  await writeData(data);
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const data = await readData();
  const user = data.users.find(u => u.email?.toLowerCase() === String(email).toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash || '');
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.status !== 'approved') return res.status(403).json({ error: 'Account pending approval' });
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Admin: list pending users
app.get('/api/admin/pending-users', requireAuth, requireAdmin, async (req, res) => {
  const data = await readData();
  const pending = data.users.filter(u => u.status === 'pending');
  res.json(pending.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status })));
});

// Admin: approve or deny a user
app.post('/api/admin/users/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const data = await readData();
  const user = data.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.status = 'approved';
  await writeData(data);
  res.json({ id: user.id, status: user.status });
});

app.post('/api/admin/users/:id/deny', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const data = await readData();
  const idx = data.users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  const [removed] = data.users.splice(idx, 1);
  await writeData(data);
  res.json({ id: removed.id, removed: true });
});

// Endpoint to fetch available categories and subcategories.
app.get('/api/categories', async (req, res) => {
  const data = await readData();
  res.json(data.categories);
});

// Posts
app.get('/api/posts', async (req, res) => {
  const { category, subcategory } = req.query;
  const data = await readData();
  let posts = data.posts;
  if (category) posts = posts.filter(p => p.category === category);
  if (subcategory) posts = posts.filter(p => p.subcategory === subcategory);
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(posts);
});

app.post('/api/posts', requireAuth, async (req, res) => {
  const { category, subcategory, content } = req.body;
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Content is required and must be a string.' });
  }
  const data = await readData();
  const post = {
    id: uuidv4(),
    userId: req.user.id,
    category: category || null,
    subcategory: subcategory || null,
    content: content.trim(),
    createdAt: new Date().toISOString()
  };
  data.posts.push(post);
  await writeData(data);
  res.status(201).json(post);
});

// Tasks
app.get('/api/tasks', async (req, res) => {
  const { category, subcategory } = req.query;
  const data = await readData();
  const tasks = filterTasks(data.tasks, category, subcategory);
  tasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json(tasks);
});

app.post('/api/tasks', requireAuth, async (req, res) => {
  const { title, category, subcategory } = req.body;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Title is required and must be a string.' });
  }
  const data = await readData();
  const task = {
    id: uuidv4(),
    title: title.trim(),
    completed: false,
    category: category || null,
    subcategory: subcategory || null,
    createdAt: new Date().toISOString()
  };
  data.tasks.push(task);
  await writeData(data);
  res.status(201).json(task);
});

app.put('/api/tasks/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;
  const data = await readData();
  const task = data.tasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }
  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title must be a non‑empty string.' });
    }
    task.title = title.trim();
  }
  if (completed !== undefined) {
    task.completed = Boolean(completed);
  }
  await writeData(data);
  res.json(task);
});

app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const data = await readData();
  const index = data.tasks.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Task not found.' });
  }
  const [removed] = data.tasks.splice(index, 1);
  await writeData(data);
  res.json(removed);
});

// Placeholder Facebook family feed integration
// In production, exchange a short-lived token for a long-lived one and store per-user.
// Here we provide a stub that returns posts from our local posts plus a mock fb field.
app.get('/api/facebook/feed', requireAuth, async (req, res) => {
  const data = await readData();
  // Mock: take latest 10 posts and annotate as if from Facebook family group
  const items = [...data.posts]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10)
    .map(p => ({
      id: `fb_${p.id}`,
      platform: 'facebook',
      group: 'family-group',
      message: p.content,
      created_time: p.createdAt
    }));
  res.json({ items });
});

// A simple healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Family app backend listening on port ${PORT}`);
});