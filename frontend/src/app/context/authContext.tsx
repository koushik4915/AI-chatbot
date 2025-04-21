"use client";
import { createContext, useEffect, useState, useContext, ReactNode } from "react";

type AuthContextType = {
  isLoggedin: boolean;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoggedin, setIsLoggedin] = useState(false);
  const expiryTime = new Date().getTime()+60*60*1000;

  useEffect(() => {
    const token = sessionStorage.getItem("Token");
    setIsLoggedin(!!token);
  }, []);

  const login = (token: string) => {
    sessionStorage.setItem("Token", token);
    sessionStorage.setItem("expiry_Time",expiryTime.toString())
    setIsLoggedin(true);
   
  };

  const logout = () => {
    sessionStorage.removeItem("Token");
    sessionStorage.removeItem("chatId")
    setIsLoggedin(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
