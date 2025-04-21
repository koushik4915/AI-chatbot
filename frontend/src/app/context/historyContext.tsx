// app/Components/historyContext.tsx
"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type HistoryContextType = {
  showHistory: boolean;
  setShowHistory: React.Dispatch<React.SetStateAction<boolean>>;
};

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider = ({ children }: { children: ReactNode }) => {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <HistoryContext.Provider value={{ showHistory, setShowHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) throw new Error("useHistory must be used within a HistoryProvider");
  return context;
};
