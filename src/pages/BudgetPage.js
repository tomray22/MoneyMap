import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BudgetTable from '../components/BudgetTable';
import BudgetSetup from '../components/BudgetSetup';

const BudgetPage = () => {
  const [budgetData, setBudgetData] = useState(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const navigate = useNavigate();

  const handleSetupComplete = (data) => {
    setBudgetData(data);
    setIsSetupComplete(true);
    navigate('/calendar', { state: { budgetData: data } });
  };

  const calculateExpectedValues = (categories, ratios, totalBudget) => {
    const expectedValues = {};
    categories.forEach((category) => {
      expectedValues[category.label] = ((ratios[category.label] || 0) / 100) * totalBudget;
    });
    return expectedValues;
  };

  return (
    <div className="app">
      {!isSetupComplete ? (
        <BudgetSetup onSetupComplete={handleSetupComplete} />
      ) : (
        <BudgetTable
          categories={budgetData.categories}
          expectedValues={calculateExpectedValues(
            budgetData.categories,
            budgetData.ratios,
            budgetData.totalBudget
          )}
        />
      )}
    </div>
  );
};

export default BudgetPage;