import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/BudgetSetup.css';

const templates = [
  {
    name: 'Travel Budget',
    categories: ['Food', 'Transportation', 'Lodging', 'Entertainment', 'Miscellaneous'],
  },
  {
    name: 'Daily Expenses',
    categories: ['Groceries', 'Transport', 'Utilities', 'Leisure', 'Savings'],
  },
  {
    name: 'Custom',
    categories: [],
  },
];

const BudgetSetup = ({ onSetupComplete }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [categories, setCategories] = useState([]);
  const [ratios, setRatios] = useState({});
  const [totalBudget, setTotalBudget] = useState('');
  const [timePeriod, setTimePeriod] = useState('monthly');
  const [customTimePeriod, setCustomTimePeriod] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [startDate, setStartDate] = useState(new Date()); // Add start date state

  useEffect(() => {
    if (selectedTemplate) {
      setCategories(selectedTemplate.categories);
      const initialRatios = {};
      selectedTemplate.categories.forEach((category) => {
        initialRatios[category] = '';
      });
      setRatios(initialRatios);
    }
  }, [selectedTemplate]);

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updatedCategories = [...categories, newCategory.trim()];
      setCategories(updatedCategories);
      setRatios({ ...ratios, [newCategory.trim()]: '' });
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (categoryToRemove) => {
    const updatedCategories = categories.filter((category) => category !== categoryToRemove);
    setCategories(updatedCategories);
    const updatedRatios = { ...ratios };
    delete updatedRatios[categoryToRemove];
    setRatios(updatedRatios);
  };

  const handleRatioChange = (category, value) => {
    if (!isNaN(value) && value >= 0 && value <= 100) {
      const updatedRatios = { ...ratios, [category]: value };
      setRatios(updatedRatios);
    }
  };

  const handleTimePeriodChange = (e) => {
    setTimePeriod(e.target.value);
  };

  const handleCustomTimePeriodChange = (e) => {
    setCustomTimePeriod(e.target.value);
  };

  const handleCompleteSetup = () => {
    if (!totalBudget || isNaN(totalBudget)) {
      alert('Please enter a valid total budget.');
      return;
    }
  
    const totalRatio = Object.values(ratios).reduce((sum, value) => sum + parseFloat(value || 0), 0);
    if (totalRatio > 100) {
      alert('The total ratio exceeds 100%. Please adjust the values.');
      return;
    }
  
    let timePeriodDays;
    if (timePeriod === 'weekly') {
      timePeriodDays = 7;
    } else if (timePeriod === 'bi-weekly') {
      timePeriodDays = 14;
    } else if (timePeriod === 'monthly') {
      timePeriodDays = 30;
    } else if (timePeriod === 'custom' && customTimePeriod) {
      timePeriodDays = parseInt(customTimePeriod, 10);
      if (isNaN(timePeriodDays) || timePeriodDays <= 0) {
        alert('Please enter a valid number of days for the custom time period.');
        return;
      }
    } else {
      alert('Please specify a valid time period.');
      return;
    }
  
    const calculatedCategories = categories.map((category) => ({
      label: category,
      expected: ((ratios[category] || 0) / 100) * totalBudget,
    }));
  
    const budgetData = {
      categories: calculatedCategories,
      totalBudget: parseFloat(totalBudget),
      timePeriod: timePeriodDays,
      ratios,
      startDate, // Include the start date in the budget data
    };
  
    // Clear old data from localStorage
    localStorage.removeItem('dailyData');
  
    // Save budget data to localStorage
    localStorage.setItem('budgetData', JSON.stringify(budgetData));
  
    onSetupComplete(budgetData);
  };

  return (
    <div className="budget-setup">
      <h2>Budget Setup</h2>
      <div className="template-list">
        {templates.map((template) => (
          <div
            key={template.name}
            className={`template-item ${
              selectedTemplate?.name === template.name ? 'selected' : ''
            }`}
            onClick={() => handleTemplateClick(template)}
          >
            {template.name}
          </div>
        ))}
      </div>
      {selectedTemplate && (
        <div className="ratio-form">
          <h3>{selectedTemplate.name} - Set Ratios</h3>
          <div className="budget-total">
            <label>
              Total Budget:
              <input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                placeholder="Enter total budget"
                min="0"
              />
            </label>
          </div>
          <div className="time-period">
            <label>
              Time Period:
              <select value={timePeriod} onChange={handleTimePeriodChange}>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            {timePeriod === 'custom' && (
              <label>
                Custom Days:
                <input
                  type="number"
                  value={customTimePeriod}
                  onChange={handleCustomTimePeriodChange}
                  placeholder="Enter number of days"
                  min="1"
                />
              </label>
            )}
          </div>
          <div className="start-date">
            <label>
              Start Date:
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                dateFormat="MM/dd/yyyy"
              />
            </label>
          </div>
          <p>Enter percentages for each category (e.g., 20 for 20%). Total should not exceed 100%.</p>
          <ul>
            {categories.map((category) => (
              <li key={category}>
                {category}
                <input
                  type="number"
                  value={ratios[category] || ''}
                  onChange={(e) => handleRatioChange(category, e.target.value)}
                  placeholder="e.g., 20"
                  min="0"
                  max="100"
                />
                <button onClick={() => handleRemoveCategory(category)}>Remove</button>
              </li>
            ))}
          </ul>
          <div className="add-category">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter a new category"
            />
            <button onClick={handleAddCategory}>Add Category</button>
          </div>
          <button onClick={handleCompleteSetup} className="complete-setup">
            Complete Setup
          </button>
        </div>
      )}
    </div>
  );
};

export default BudgetSetup;