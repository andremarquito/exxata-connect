import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'exxata_users';

export const UsersContext = createContext(null);

export function UsersProvider({ children }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);

  // Inicializa usuários do localStorage, garantindo que o usuário logado exista na base
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    let initial = [];
    if (raw) {
      try {
        initial = JSON.parse(raw);
      } catch {
        initial = [];
      }
    }

    if (user) {
      const exists = initial.some((u) => u.id === user.id);
      if (!exists) {
        initial = [
          ...initial,
          {
            id: user.id,
            name: user.name || 'Usuário',
            email: user.email || 'user@exxata.com',
            role: user.role || 'admin',
            status: 'Ativo',
            lastActive: new Date().toISOString(),
          },
        ];
      }
    }

    setUsers(initial);
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  const addUser = ({ name, email, role = 'collaborator', status = 'Ativo' }) => {
    const id = Date.now();
    const newUser = { id, name, email, role, status, lastActive: new Date().toISOString() };
    setUsers((prev) => [newUser, ...prev]);
    return newUser;
  };

  const updateUser = (id, patch) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  };

  const deleteUser = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const getUserById = (id) => users.find((u) => u.id === Number(id));
  const getUserByEmail = (email) => users.find((u) => u.email?.toLowerCase() === String(email).toLowerCase());

  const value = useMemo(
    () => ({ users, addUser, updateUser, deleteUser, getUserById, getUserByEmail }),
    [users]
  );

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export const useUsers = () => {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error('useUsers deve ser usado dentro de UsersProvider');
  return ctx;
};
