import { createContext, useContext, useState, useCallback } from 'react';

const Ctx = createContext();

function loadCompleted() {
  try {
    const saved = localStorage.getItem('sim_completed');
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

export function CompletedProvider({ children }) {
  const [completed, setCompleted] = useState(loadCompleted);

  const saveCompleted = useCallback((data) => {
    setCompleted(data);
    try { localStorage.setItem('sim_completed', JSON.stringify(data)); } catch { /* ignore */ }
  }, []);

  return <Ctx.Provider value={{ completed, saveCompleted }}>{children}</Ctx.Provider>;
}

export function useCompleted() {
  return useContext(Ctx);
}
