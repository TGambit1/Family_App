import { useState } from 'react';
import Navbar from '../components/Navbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        if (data.status === 'approved') {
          setMessage('Account created as owner. You can now login.');
        } else {
          setMessage('Registration successful. Awaiting admin approval.');
        }
        setName('');
        setEmail('');
        setPassword('');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="container">
        <h1>Register</h1>
        <form onSubmit={onSubmit} className="card" style={{ maxWidth: 480 }}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {message && <p style={{ color: 'seagreen' }}>{message}</p>}
          {error && <p style={{ color: 'crimson' }}>{error}</p>}
          <button type="submit" className="btn" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
        </form>
      </main>
    </>
  );
}