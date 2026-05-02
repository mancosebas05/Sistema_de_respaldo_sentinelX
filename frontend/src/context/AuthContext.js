import React, { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

// ── Credenciales demo (funciona sin backend) ─────────────
const DEMO_USERS = {
  'admin@sentinelx.io':      { password: 'Admin2024!', rol: 'admin',     name: 'Admin Demo',     email: 'admin@sentinelx.io' },
  'ti@sentinelx.io':         { password: 'Ti2024!',    rol: 'ti',        name: 'TI Demo',        email: 'ti@sentinelx.io' },
  'operativo@sentinelx.io':  { password: 'Op2024!',    rol: 'operativo', name: 'Operativo Demo', email: 'operativo@sentinelx.io' },
  'directivo@sentinelx.io':  { password: 'Dir2024!',   rol: 'directivo', name: 'Directivo Demo', email: 'directivo@sentinelx.io' },
};

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sentinelx_user') || 'null');
      return stored;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      // Intenta con el backend real primero
      const res = await authAPI.login({ email, password });
      const { token, user: userData } = res.data || res;

      localStorage.setItem('sentinelx_token', token);
      localStorage.setItem('sentinelx_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (err) {
      // Si el backend falla, intenta con credenciales demo
      const demo = DEMO_USERS[email.toLowerCase()];
      if (demo && demo.password === password) {
        const userData = { name: demo.name, email: demo.email, rol: demo.rol };
        localStorage.setItem('sentinelx_token', 'demo-token');
        localStorage.setItem('sentinelx_user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      return { success: false, message: 'Credenciales incorrectas. Usa las credenciales demo.' };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch {}

    localStorage.removeItem('sentinelx_token');
    localStorage.removeItem('sentinelx_user');

    setUser(null);
  }, []);

  const hasPermission = useCallback((roles = []) => {
    if (!user) return false;
    if (roles.length === 0) return true;
    return roles.includes(user.rol);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      hasPermission,
      isAuth: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};