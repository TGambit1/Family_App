import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function TasksPage() {
  const [categories, setCategories] = useState({});
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      const res = await fetch(`${API_URL}/api/categories`);
      const data = await res.json();
      setCategories(data);
    }
    fetchCategories();
  }, []);

  // Fetch tasks whenever the category or subcategory changes
  useEffect(() => {
    async function fetchTasks() {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (subcategory) params.append('subcategory', subcategory);
      const res = await fetch(`${API_URL}/api/tasks?${params.toString()}`);
      const data = await res.json();
      setTasks(data);
    }
    fetchTasks();
  }, [category, subcategory]);

  async function handleCreateTask(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, subcategory })
      });
      const newTask = await res.json();
      setTasks(prev => [...prev, newTask]);
      setTitle('');
    } catch (err) {
      console.error('Failed to create task', err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTask(id, completed) {
    try {
      await fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed })
      });
      setTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: !completed } : t)));
    } catch (err) {
      console.error('Failed to toggle task', err);
    }
  }

  // Compute progress for a simple progress bar.  Avoid division by zero.
  const progress = tasks.length === 0 ? 0 : (tasks.filter(t => t.completed).length / tasks.length) * 100;

  return (
    <>
      <Navbar />
      <main className="container">
        <h1>Task Manager</h1>
        <p>Organise your family life by creating and completing tasks.</p>
        <form onSubmit={handleCreateTask} style={{ marginBottom: '2rem' }}>
          <div className="form-group">
            <label htmlFor="task-title">Task Title</label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Buy milk"
            />
          </div>
          <div className="form-group">
            <label htmlFor="task-category">Category</label>
            <select
              id="task-category"
              value={category}
              onChange={e => {
                setCategory(e.target.value);
                setSubcategory('');
              }}
            >
              <option value="">None</option>
              {Object.keys(categories).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          {category && categories[category] && (
            <div className="form-group">
              <label htmlFor="task-subcategory">Subcategory</label>
              <select
                id="task-subcategory"
                value={subcategory}
                onChange={e => setSubcategory(e.target.value)}
              >
                <option value="">None</option>
                {categories[category].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Adding...' : 'Add Task'}
          </button>
        </form>

        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <p style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '0.25rem' }}>
          {tasks.filter(t => t.completed).length} of {tasks.length} tasks completed
        </p>

        <section>
          {tasks.length === 0 && <p>No tasks yet. Add your first one!</p>}
          {tasks.map(task => (
            <div key={task.id} className="card" style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id, task.completed)}
                style={{ marginRight: '1rem' }}
              />
              <div>
                <p style={{ margin: 0, textDecoration: task.completed ? 'line-through' : 'none' }}>
                  {task.title}
                </p>
                <small style={{ color: '#6c757d' }}>
                  {task.category ? `${task.category} › ${task.subcategory || 'general'}` : ''}
                </small>
              </div>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}