import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const Ctx = createContext();

export function CompletedProvider({ children }) {
  const [completed, setCompleted] = useState({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sim_completed');
      if (saved) setCompleted(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const saveCompleted = useCallback((data) => {
    setCompleted(data);
    try { localStorage.setItem('sim_completed', JSON.stringify(data)); } catch { /* ignore */ }
  }, []);

  return <Ctx.Provider value={{ completed, saveCompleted }}>{children}</Ctx.Provider>;
}

export function useCompleted() {
  return useContext(Ctx);
}
