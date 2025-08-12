import { useContext, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { AuthContext } from './_app';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminPage() {
  const { user, token } = useContext(AuthContext);
  const [pending, setPending] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!token) return;
      const res = await fetch(`${API_URL}/api/admin/pending-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPending(await res.json());
      } else {
        setError('Failed to load pending users');
      }
    }
    load();
  }, [token]);

  async function approve(id) {
    const res = await fetch(`${API_URL}/api/admin/users/${id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setPending(p => p.filter(u => u.id !== id));
  }

  async function deny(id) {
    const res = await fetch(`${API_URL}/api/admin/users/${id}/deny`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setPending(p => p.filter(u => u.id !== id));
  }

  const isAdmin = user && (user.role === 'owner' || user.role === 'admin');

  return (
    <>
      <Navbar />
      <main className="container">
        <h1>Admin Approvals</h1>
        {!isAdmin && <p>Admin access required.</p>}
        {isAdmin && (
          <div className="card">
            <h3>Pending Users</h3>
            {error && <p style={{ color: 'crimson' }}>{error}</p>}
            {pending.length === 0 && <p>No pending users.</p>}
            {pending.map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <div>
                  <strong>{u.name}</strong>
                  <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>{u.email}</div>
                </div>
                <div>
                  <button className="btn" style={{ marginRight: 8 }} onClick={() => approve(u.id)}>Approve</button>
                  <button className="btn secondary" onClick={() => deny(u.id)}>Deny</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}