import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  company: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage on mount
    const storedIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const company = localStorage.getItem('userCompany');
    const email = localStorage.getItem('userEmail');

    if (storedIsLoggedIn && company && email) {
      setUser({ company, email });
      setIsLoggedIn(true);
    }
    
    // Mark loading as complete
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userCompany', userData.company);
    localStorage.setItem('userEmail', userData.email);
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userCompany');
    localStorage.removeItem('userEmail');
  };

  const value = {
    user,
    isLoggedIn,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
