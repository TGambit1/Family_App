import Link from 'next/link';
import { useContext } from 'react';
import { AuthContext } from '../pages/_app';

export default function Navbar() {
  const { user, setAuth } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div>
        <Link href="/">Home</Link>
        <Link href="/tasks">Tasks</Link>
        {user && (user.role === 'owner' || user.role === 'admin') && (
          <Link href="/admin">Admin</Link>
        )}
      </div>
      <div>
        {!user ? (
          <>
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </>
        ) : (
          <button className="btn secondary" onClick={() => setAuth({ user: null, token: null })}>Logout</button>
        )}
      </div>
    </nav>
  );
}