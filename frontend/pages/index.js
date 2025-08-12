import { useContext, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { AuthContext } from './_app';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function HomePage() {
  const { token } = useContext(AuthContext);
  const [categories, setCategories] = useState({});
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [content, setContent] = useState('');
  const [posts, setPosts] = useState([]);
  const [fbItems, setFbItems] = useState([]);

  useEffect(() => {
    async function load() {
      const [catsRes, postsRes] = await Promise.all([
        fetch(`${API_URL}/api/categories`),
        fetch(`${API_URL}/api/posts`)
      ]);
      const cats = await catsRes.json();
      const p = await postsRes.json();
      setCategories(cats);
      setPosts(p);
    }
    load();
  }, []);

  useEffect(() => {
    async function loadFb() {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/facebook/feed`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setFbItems(data.items || []);
      } catch {}
    }
    loadFb();
  }, [token]);

  async function submitPost(e) {
    e.preventDefault();
    if (!content.trim()) return;
    const res = await fetch(`${API_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ content, category, subcategory })
    });
    if (res.ok) {
      const created = await res.json();
      setPosts(prev => [created, ...prev]);
      setContent('');
      setCategory('');
      setSubcategory('');
    }
  }

  return (
    <>
      <Navbar />
      <main className="container">
        <h1>Family Feed</h1>
        <p>Share updates, milestones, memories. Encourage connection and intentional family life.</p>

        {token ? (
          <form onSubmit={submitPost} className="card" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label htmlFor="content">What would you like to share?</label>
              <textarea id="content" value={content} onChange={e => setContent(e.target.value)} rows={3} />
            </div>
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select id="category" value={category} onChange={e => { setCategory(e.target.value); setSubcategory(''); }}>
                <option value="">None</option>
                {Object.keys(categories).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            {category && categories[category] && (
              <div className="form-group">
                <label htmlFor="subcategory">Subcategory</label>
                <select id="subcategory" value={subcategory} onChange={e => setSubcategory(e.target.value)}>
                  <option value="">None</option>
                  {categories[category].map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}
            <button className="btn" type="submit">Post</button>
          </form>
        ) : (
          <div className="card">Login to share updates with your family.</div>
        )}

        <section>
          <h2>Latest Posts</h2>
          {posts.length === 0 && <p>No posts yet.</p>}
          {posts.map(p => (
            <div key={p.id} className="card">
              <p style={{ margin: 0 }}>{p.content}</p>
              <small style={{ color: '#6c757d' }}>{p.category ? `${p.category} › ${p.subcategory || 'general'}` : 'general'}</small>
            </div>
          ))}
        </section>

        <section style={{ marginTop: '2rem' }}>
          <h2>Family Facebook Feed</h2>
          {!token && <p>Login to view connected family Facebook posts.</p>}
          {token && fbItems.length === 0 && <p>No recent Facebook items.</p>}
          {token && fbItems.map(item => (
            <div key={item.id} className="card">
              <p style={{ margin: 0 }}>{item.message}</p>
              <small style={{ color: '#6c757d' }}>From {item.platform} · {new Date(item.created_time).toLocaleString()}</small>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}