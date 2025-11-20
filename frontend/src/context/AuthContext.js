import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext({
  isAuthenticated: false,
  role: null,
  user: null,
  login: async (_credentials) => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  // Load from localStorage on first mount
  useEffect(() => {
    const stored = localStorage.getItem('ssaems_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setIsAuthenticated(!!parsed?.isAuthenticated);
        setRole(parsed?.role || null);
        setUser(parsed?.user || null);
      } catch (_) {
        // ignore parse errors
      }
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    const payload = JSON.stringify({ isAuthenticated, role, user });
    localStorage.setItem('ssaems_auth', payload);
  }, [isAuthenticated, role, user]);

  // Login implementation
  const login = async ({ username, role: selectedRole, token }) => {
    // Optional small delay if needed
    await new Promise((r) => setTimeout(r, 50));

    setIsAuthenticated(true);
    setRole(selectedRole);
    setUser({ username });

    // Preserve backend-issued JWT if supplied; otherwise fall back (dev only)
    const existing = localStorage.getItem('token');
    const finalToken = token || existing || ('dev-token-' + Date.now());
    localStorage.setItem('token', finalToken);
    localStorage.setItem('userType', selectedRole);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRole(null);
    setUser(null);
    localStorage.removeItem('ssaems_auth');
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
  };

  const value = useMemo(
    () => ({ isAuthenticated, role, user, login, logout }),
    [isAuthenticated, role, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
