import { createContext, useEffect, useMemo, useState } from 'react';
import '../styles/globals.css';

export const AuthContext = createContext({
  user: null,
  token: null,
  setAuth: () => {}
});

export default function MyApp({ Component, pageProps }) {
  const [auth, setAuthState] = useState({ user: null, token: null });

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('auth') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAuthState(parsed);
      } catch {}
    }
  }, []);

  function setAuth(next) {
    setAuthState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('auth', JSON.stringify(next));
    }
  }

  const value = useMemo(() => ({ ...auth, setAuth }), [auth.token, auth.user]);

  return (
    <AuthContext.Provider value={value}>
      <Component {...pageProps} />
    </AuthContext.Provider>
  );
}