import React, { createContext, useState, useContext, useEffect } from 'react';

const BudgetContext = createContext();

export const BudgetProvider = ({ children }) => {
  const [budgetData, setBudgetData] = useState(null);

  // Load budgetData from localStorage on initial render
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('budgetData'));
    if (savedData) {
      setBudgetData(savedData);
    }
  }, []);

  // Save budgetData to localStorage whenever it changes
  useEffect(() => {
    if (budgetData) {
      localStorage.setItem('budgetData', JSON.stringify(budgetData));
    }
  }, [budgetData]);

  // Debug logs to check if budgetData isn't being saved properly
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('budgetData'));
    console.log("Loaded budgetData from localStorage:", savedData); // Debugging log
    if (savedData) {
      setBudgetData(savedData);
    }
  }, []);  

  return (
    <BudgetContext.Provider value={{ budgetData, setBudgetData }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => useContext(BudgetContext);