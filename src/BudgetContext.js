import React, { createContext, useState, useContext, useEffect } from 'react';

const BudgetContext = createContext();

export const BudgetProvider = ({ children }) => {
  const [budgetData, setBudgetData] = useState({
    incomeType: 'one-time', // 'one-time' or 'net-income'
    netIncome: null, // Only used if incomeType is 'net-income'
    incomeInterval: 'monthly', // Only used if incomeType is 'net-income'
    totalBudget: null, // Only used if incomeType is 'one-time'
    categories: [],
    startDate: new Date(),
    endDate: null,
    timePeriod: 'monthly',
    budgetGoals: {
      savingsGoal: null, // For future Savings Goal feature
      savingsInterval: 'monthly',
    },
    remainingBudget: 0, // For Budgeted Savings
  });


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

  return (
    <BudgetContext.Provider value={{ budgetData, setBudgetData }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => useContext(BudgetContext);