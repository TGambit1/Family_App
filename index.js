const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Create the express application
const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Path to our simple JSON data store.  In a real production system this would
// be replaced with a proper database such as PostgreSQL or MongoDB, but for
// demonstration purposes a JSON file keeps the example self‑contained and
// easy to run without additional setup.  All reads/writes are performed
// asynchronously to avoid blocking the event loop.
const dataPath = `${__dirname}/../data.json`;

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

// Endpoint to fetch available categories and subcategories.  Useful to
// bootstrap the UI when the app first loads.  Returns an object keyed
// by high‑level group (life/planning/business) where each value is an
// array of subcategory names.
app.get('/api/categories', async (req, res) => {
  const data = await readData();
  res.json(data.categories);
});

// Endpoint to retrieve all posts or filter them by category or subcategory.
// Posts are sorted newest first.  Posts are simple objects with the
// properties { id, userId, category, subcategory, content, createdAt }.
app.get('/api/posts', async (req, res) => {
  const { category, subcategory } = req.query;
  const data = await readData();
  let posts = data.posts;
  if (category) {
    posts = posts.filter(p => p.category === category);
  }
  if (subcategory) {
    posts = posts.filter(p => p.subcategory === subcategory);
  }
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(posts);
});

// Create a new post.  The request body must include at least `content` and
// optionally `userId`, `category` and `subcategory`.  Missing fields will
// default to undefined.  The backend does not enforce any schema beyond
// storing the values provided; validation should occur in the client.
app.post('/api/posts', async (req, res) => {
  const { userId, category, subcategory, content } = req.body;
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Content is required and must be a string.' });
  }
  const data = await readData();
  const post = {
    id: uuidv4(),
    userId: userId || null,
    category: category || null,
    subcategory: subcategory || null,
    content: content.trim(),
    createdAt: new Date().toISOString()
  };
  data.posts.push(post);
  await writeData(data);
  res.status(201).json(post);
});

// Endpoint to fetch tasks.  Supports filtering by category and subcategory via
// query parameters.  Tasks are sorted by creation time ascending to provide
// a sense of progress.
app.get('/api/tasks', async (req, res) => {
  const { category, subcategory } = req.query;
  const data = await readData();
  const tasks = filterTasks(data.tasks, category, subcategory);
  tasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json(tasks);
});

// Create a new task.  Requires a `title` in the request body.  Category and
// subcategory are optional but recommended for organisation.  New tasks are
// marked as incomplete by default.
app.post('/api/tasks', async (req, res) => {
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

// Update a task by ID.  Allows toggling completion status and editing title.
app.put('/api/tasks/:id', async (req, res) => {
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

// Delete a task by ID.
app.delete('/api/tasks/:id', async (req, res) => {
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

// A simple healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Family app backend listening on port ${PORT}`);
});