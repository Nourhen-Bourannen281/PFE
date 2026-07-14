import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUser, storeUser, storeToken, clearStorage } from '../services/storage';
import { connectSocket, disconnectSocket } from '../services/socket';

interface User {
  id: string;
  nom: string;
  email: string;
  role: string;
  telephone?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await getUser();
      if (storedUser) {
        setUser(storedUser);
        connectSocket(storedUser.id);
      }
    } catch (error) {
      console.error('Erreur chargement user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User, token: string) => {
    await storeUser(userData);
    await storeToken(token);
    setUser(userData);
    connectSocket(userData.id);
  };

  const logout = async () => {
    try {
      await clearStorage();
    } catch (error) {
      console.error('Erreur nettoyage storage:', error);
    } finally {
      setUser(null);
      disconnectSocket();
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};