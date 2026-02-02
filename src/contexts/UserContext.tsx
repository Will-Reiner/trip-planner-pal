import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  photo: string | null;
  role?: string;
}

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAdmin: () => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'trip_planner_current_user';
const LEGACY_STORAGE_KEY = 'trip_planner_user';

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    const legacyStored = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyStored) {
      const parsed = JSON.parse(legacyStored);
      return {
        id: parsed.id,
        name: parsed.nome ?? parsed.name,
        photo: parsed.avatar_url ?? parsed.photo ?? null,
      } as User;
    }

    return null;
  });

  // Salva no localStorage sempre que o usuário mudar
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentUser]);
  
  const isAdmin = () => {
    return currentUser?.role === 'admin';
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, isAdmin }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
