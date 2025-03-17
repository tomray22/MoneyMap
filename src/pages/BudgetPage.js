import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useBudget } from '../BudgetContext';
import '../styles/BudgetSetup.css';

// Currency symbols for display
const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  KRW: '₩',
  PHP: '₱',
  SGD: 'S$',
  NZD: 'NZ$',
};

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

const BudgetPage = ({ currency, exchangeRate }) => {
  const navigate = useNavigate(); 
  const { budgetData, setBudgetData } = useBudget();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [categories, setCategories] = useState([]);
  const [ratios, setRatios] = useState({});
  const [dollarAmounts, setDollarAmounts] = useState({});
  const [totalBudget, setTotalBudget] = useState('');
  const [timePeriod, setTimePeriod] = useState('monthly');
  const [customTimePeriod, setCustomTimePeriod] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categorySettings, setCategorySettings] = useState({});
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [incomeType, setIncomeType] = useState('one-time'); // 'one-time' or 'gross-income'
  const [incomeData, setIncomeData] = useState({
    grossIncome: '',
    incomeInterval: 'monthly',
  });
  const [savingsGoalEnabled, setSavingsGoalEnabled] = useState(false);
  const [savingsGoalAmount, setSavingsGoalAmount] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Clear dailyData from localStorage when returning to setup
  useEffect(() => {
    if (!isSetupComplete) {
      localStorage.removeItem('dailyData');
    }
  }, [isSetupComplete]);

  // Load categories and ratios when a template is selected
  useEffect(() => {
    if (selectedTemplate) {
      const initialCategories = [...selectedTemplate.categories];
      if (!initialCategories.includes('Savings')) {
        initialCategories.push('Savings'); // Add unremovable Savings category
      }
      setCategories(initialCategories);

      const initialRatios = {};
      const initialDollarAmounts = {};
      const initialCategorySettings = {};
      initialCategories.forEach((category) => {
        initialRatios[category] = '';
        initialDollarAmounts[category] = null;
        initialCategorySettings[category] = {
          useDollarAmounts: false,
          scheduleType: 'none',
          isOneTime: false,
          oneTimeDate: new Date(),
          frequency: 'weekly',
          interval: 1,
          selectedDay: 'Monday',
          selectedDays: [],
        };
      });
      setRatios(initialRatios);
      setDollarAmounts(initialDollarAmounts);
      setCategorySettings(initialCategorySettings);
    }
  }, [selectedTemplate]);

  // Calculate remaining budget
  useEffect(() => {
    if (totalBudget) {
      let allocated = 0;
      categories.forEach((category) => {
        if (categorySettings[category].useDollarAmounts) {
          allocated += parseFloat(dollarAmounts[category] || 0);
        } else {
          allocated += ((ratios[category] || 0) / 100) * totalBudget;
        }
      });
      setRemainingBudget(totalBudget - allocated);
    }
  }, [categories, ratios, dollarAmounts, totalBudget, categorySettings]);

  // Handle income type change
  const handleIncomeTypeChange = (type) => {
    setIncomeType(type);
    if (type !== 'import') {
      setTotalBudget(''); // Reset total budget when switching income type
    }
  };

  // Handle gross income change
  const handleGrossIncomeChange = (value) => {
    setIncomeData({ ...incomeData, grossIncome: value });
    if (incomeData.incomeInterval && value) {
      const income = parseFloat(value);
      let calculatedBudget = 0;
      switch (incomeData.incomeInterval) {
        case 'weekly':
          calculatedBudget = income * 4; // Approximate monthly budget
          break;
        case 'bi-weekly':
          calculatedBudget = income * 2; // Approximate monthly budget
          break;
        case 'monthly':
          calculatedBudget = income;
          break;
        case 'annually':
          calculatedBudget = income / 12; // Approximate monthly budget
          break;
        default:
          calculatedBudget = 0;
      }
      setTotalBudget(calculatedBudget.toFixed(2));
    }
  };

  // Handle importing from a JSON 
  const handleImportJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
  
        // Validate the imported data structure
        if (!importedData.totals || !importedData.dailyData) {
          throw new Error('Invalid file format: Missing required fields.');
        }
  
        // Extract the date range from the dailyData
        const startDate = new Date(importedData.dailyData[0].date); // First day in the range
        const endDate = new Date(importedData.dailyData[importedData.dailyData.length - 1].date); // Last day in the range
  
        // Validate the dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Invalid date format in the imported file.');
        }
  
        // Prepare the updated budget data
        const updatedBudgetData = {
          ...budgetData, // Preserve existing budget data
          startDate: startDate.toISOString(), // Convert to ISO string for consistency
          endDate: endDate.toISOString(),
        };
  
        // Update the budget state with the imported data
        setBudgetData(updatedBudgetData);
  
        // Save the dailyData to localStorage
        const updatedDailyData = {};
        importedData.dailyData.forEach((day) => {
          updatedDailyData[day.date] = {
            rows: day.rows,
            supplementalIncomes: day.supplementalIncomes || [],
            unexpectedExpenses: day.unexpectedExpenses || [],
            savings: day.savings || 0,
          };
        });
        localStorage.setItem('dailyData', JSON.stringify(updatedDailyData));
  
        alert('Budget data imported successfully!');
        navigate('/calendar'); // Navigate to the Calendar view
      } catch (error) {
        alert(`Error importing JSON file: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Handle template selection
  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
  };

  // Add a new category
  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updatedCategories = [...categories, newCategory.trim()];
      setCategories(updatedCategories);
      setRatios({ ...ratios, [newCategory.trim()]: '' });
      setDollarAmounts({ ...dollarAmounts, [newCategory.trim()]: null });
      setCategorySettings({
        ...categorySettings,
        [newCategory.trim()]: {
          useDollarAmounts: false,
          scheduleType: 'none',
          isOneTime: false,
          oneTimeDate: new Date(),
          frequency: 'weekly',
          interval: 1,
          selectedDay: 'Monday',
          selectedDays: [],
        },
      });
      setNewCategory('');
    }
  };

  // Remove a category (except Savings)
  const handleRemoveCategory = (categoryToRemove) => {
    if (categoryToRemove === 'Savings') return; // Prevent removing Savings
    const updatedCategories = categories.filter((category) => category !== categoryToRemove);
    setCategories(updatedCategories);
    const updatedRatios = { ...ratios };
    const updatedDollarAmounts = { ...dollarAmounts };
    const updatedCategorySettings = { ...categorySettings };
    delete updatedRatios[categoryToRemove];
    delete updatedDollarAmounts[categoryToRemove];
    delete updatedCategorySettings[categoryToRemove];
    setRatios(updatedRatios);
    setDollarAmounts(updatedDollarAmounts);
    setCategorySettings(updatedCategorySettings);
  };

  // Handle ratio or dollar amount changes
  const handleRatioChange = (category, value) => {
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setRatios({ ...ratios, [category]: value });
    }
  };

  const handleDollarAmountChange = (category, value) => {
    if (value === null || (!isNaN(value) && value >= 0)) {
      setDollarAmounts({ ...dollarAmounts, [category]: value });
    }
  };

  // Handle time period changes
  const handleTimePeriodChange = (e) => {
    const period = e.target.value;
    setTimePeriod(period);

    // Set end date based on the selected time period
    const newEndDate = new Date(startDate);
    if (period === 'weekly') {
      newEndDate.setDate(newEndDate.getDate() + 7);
    } else if (period === 'bi-weekly') {
      newEndDate.setDate(newEndDate.getDate() + 14);
    } else if (period === 'monthly') {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    } else if (period === 'custom') {
      // Custom period: end date will be set manually
      return;
    }
    setEndDate(newEndDate);
  };

  // Handle custom time period changes
  const handleCustomTimePeriodChange = (e) => {
    const days = parseInt(e.target.value, 10);
    if (!isNaN(days)) {
      const newEndDate = new Date(startDate);
      newEndDate.setDate(newEndDate.getDate() + days);
      setEndDate(newEndDate);
      setCustomTimePeriod(days);
    }
  };

  // Handle category settings changes
  const handleCategorySettingChange = (category, field, value) => {
    setCategorySettings({
      ...categorySettings,
      [category]: {
        ...categorySettings[category],
        [field]: value,
      },
    });
  };

  // Check savings goal feasibility
  const checkSavingsGoalFeasibility = () => {
    if (savingsGoalEnabled && savingsGoalAmount) {
      const goal = parseFloat(savingsGoalAmount);
      const remaining = remainingBudget;

      if (goal > remaining) {
        alert(`Warning: Your savings goal (${currencySymbols[currency]}${goal.toFixed(2)}) exceeds your remaining budget (${currencySymbols[currency]}${remaining.toFixed(2)}).`);
      }
    }
  };

  // Complete the budget setup
  const handleCompleteSetup = () => {
    if (!totalBudget || isNaN(totalBudget)) {
      alert('Please enter a valid total budget.');
      return;
    }

    checkSavingsGoalFeasibility(); // Check savings goal feasibility

    // Calculate end date based on time period
    let calculatedEndDate;
    if (timePeriod === 'weekly') {
      calculatedEndDate = new Date(startDate);
      calculatedEndDate.setDate(startDate.getDate() + 6); // 6 days after start (7 days total)
    } else if (timePeriod === 'bi-weekly') {
      calculatedEndDate = new Date(startDate);
      calculatedEndDate.setDate(startDate.getDate() + 13); // 13 days after start (14 days total)
    } else if (timePeriod === 'monthly') {
      calculatedEndDate = new Date(startDate);
      calculatedEndDate.setMonth(startDate.getMonth() + 1);
      calculatedEndDate.setDate(calculatedEndDate.getDate() - 1); // Last day of the month
    } else if (timePeriod === 'custom' && customTimePeriod) {
      calculatedEndDate = new Date(startDate);
      calculatedEndDate.setDate(startDate.getDate() + parseInt(customTimePeriod, 10) - 1); // Subtract 1 day
    } else {
      alert('Please specify a valid time period.');
      return;
    }

    // Prepare budget data
    const calculatedCategories = categories.map((category) => ({
      label: category,
      expected: categorySettings[category].useDollarAmounts
        ? parseFloat(dollarAmounts[category] || 0)
        : ((ratios[category] || 0) / 100) * totalBudget,
      schedule: categorySettings[category].scheduleType === 'none'
        ? null
        : {
            type: categorySettings[category].isOneTime ? 'one-time' : 'recurring',
            date: categorySettings[category].isOneTime
              ? categorySettings[category].oneTimeDate.toISOString().split('T')[0]
              : null,
            frequency: categorySettings[category].frequency,
            interval: categorySettings[category].interval || 1,
            day: categorySettings[category].selectedDay,
          },
    }));

    const newBudgetData = {
      categories: calculatedCategories,
      totalBudget: parseFloat(totalBudget),
      startDate,
      endDate: calculatedEndDate,
      incomeType,
      grossIncome: incomeType === 'gross-income' ? parseFloat(incomeData.grossIncome) : null,
      incomeInterval: incomeType === 'gross-income' ? incomeData.incomeInterval : null,
      budgetGoals: {
        savingsGoal: savingsGoalEnabled ? parseFloat(savingsGoalAmount) : 0,
        savingsInterval: 'monthly',
      },
      remainingBudget: remainingBudget,
    };

    setBudgetData(newBudgetData);
    setIsSetupComplete(true);
    navigate('/calendar');
    };

  // Toggle drawer
  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  if (!isSetupComplete) {
    return (
      <div className="budget-setup">
        <h2>Budget Setup</h2>

        {/* Description */}
        <div className="description">
          <p>Welcome to the Budget Setup page! Here, you can create a budget by selecting a template or creating a custom one. You can set your total budget, allocate funds to different categories, and specify the time period for your budget.</p>
        </div>

        {/* Income Type Toggle */}
        <div className="income-type-toggle">

        {/* One-Time Budget Tile */}
        <div
          className={`income-option ${incomeType === 'one-time' ? 'selected' : ''}`}
          onClick={() => handleIncomeTypeChange('one-time')}
        >
          <label>
            <input
              type="radio"
              value="one-time"
              checked={incomeType === 'one-time'}
              onChange={() => handleIncomeTypeChange('one-time')}
            />
            One-Time Budget
          </label>
          <p className="option-description">
            Use this if you have a fixed amount of money to budget (e.g., a savings fund or a one-time payment).
          </p>
        </div>

        {/* Expected Gross Income Tile */}
        <div
          className={`income-option ${incomeType === 'gross-income' ? 'selected' : ''}`}
          onClick={() => handleIncomeTypeChange('gross-income')}
        >
          <label>
            <input
              type="radio"
              value="gross-income"
              checked={incomeType === 'gross-income'}
              onChange={() => handleIncomeTypeChange('gross-income')}
            />
            Expected Gross Income
          </label>
          <p className="option-description">
            Use this if you want to budget based on your regular income (e.g., salary or monthly earnings).
          </p>
        </div>

        {/* Load Previous Budget Tile */}
        <div
          className={`income-option ${incomeType === 'import' ? 'selected' : ''}`}
          onClick={() => handleIncomeTypeChange('import')}
        >
          <label>
            <input
              type="radio"
              value="import"
              checked={incomeType === 'import'}
              onChange={() => handleIncomeTypeChange('import')}
            />
            Load Previous Budget
          </label>
          <p className="option-description">
            Upload a previously exported budget JSON file to load your data. (WIP)
          </p>
          {incomeType === 'import' && (
            <div className="import-section">
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
              />
            </div>
          )}
        </div>
      </div>

        {/* One-Time Budget Input */}
        {incomeType === 'one-time' && (
          <div className="budget-total">
            <label>
              Total Budget:
              <input
                type="number"
                value={totalBudget || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setTotalBudget(value === '' ? '' : parseFloat(value) / exchangeRate);
                }}
                placeholder="Enter total budget"
                min="0"
              />
              <span>{currencySymbols[currency]}</span>
            </label>
            <p>
              Remaining Budget: {currencySymbols[currency]}{(remainingBudget * exchangeRate).toFixed(2)}
            </p>
          </div>
        )}

        {/* Gross Income Form */}
        {incomeType === 'gross-income' && (
          <div className="gross-income-form">
            <div className="gross-income-input">
              <label>
                Gross Income:
                <input
                  type="number"
                  value={incomeData.grossIncome}
                  onChange={(e) => handleGrossIncomeChange(e.target.value)}
                  placeholder="Enter gross income"
                  min="0"
                />
                <span>{currencySymbols[currency]}</span>
              </label>
            </div>
            <div className="income-interval-input">
              <label>
                Income Interval:
                <select
                  value={incomeData.incomeInterval}
                  onChange={(e) => setIncomeData({ ...incomeData, incomeInterval: e.target.value })}
                >
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="annually">Annually</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {/* Savings Goal Section */}
        <div className="savings-goal-section">
          <label>
            <input
              type="checkbox"
              checked={savingsGoalEnabled}
              onChange={(e) => setSavingsGoalEnabled(e.target.checked)}
            />
            Enable Savings Goal
          </label>
          {savingsGoalEnabled && (
            <div className="savings-goal-input">
              <label>
                Savings Goal Amount:
                <input
                  type="number"
                  value={savingsGoalAmount}
                  onChange={(e) => setSavingsGoalAmount(e.target.value)}
                  placeholder="Enter savings goal"
                  min="0"
                />
                <span>{currencySymbols[currency]}</span>
              </label>
            </div>
          )}
        </div>

        {/* Template Selection */}
        <div className="template-list">
          {templates.map((template) => (
            <div
              key={template.name}
              className={`template-item ${selectedTemplate?.name === template.name ? 'selected' : ''}`}
              onClick={() => handleTemplateClick(template)}
            >
              {template.name}
            </div>
          ))}
        </div>

        {/* Budget Setup Form */}
        {selectedTemplate && (
          <div className="ratio-form">
            <h3>{selectedTemplate.name} - Set Budget</h3>
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
                    onChange={(e) => handleCustomTimePeriodChange(e)}
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
            {timePeriod === 'custom' && (
              <div className="end-date">
                <label>
                  End Date:
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    dateFormat="MM/dd/yyyy"
                    minDate={startDate}
                  />
                </label>
              </div>
            )}
            <ul>
              {categories
                .filter((category) => category !== 'Savings') // Exclude savings from the main list
                .map((category) => (
                  <li key={category}>
                    <div className="category-header">
                      <span>{category}</span>
                      <div className="input-container">
                        <input
                          type="number"
                          value={
                            categorySettings[category].useDollarAmounts
                              ? dollarAmounts[category] === null || dollarAmounts[category] === undefined
                                ? ''
                                : dollarAmounts[category] * exchangeRate
                              : ratios[category] || ''
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            if (categorySettings[category].useDollarAmounts) {
                              handleDollarAmountChange(
                                category,
                                value === '' ? null : parseFloat(value) / exchangeRate
                              );
                            } else {
                              handleRatioChange(category, value);
                            }
                          }}
                          placeholder={
                            categorySettings[category].useDollarAmounts ? 'e.g., 50' : 'e.g., 20'
                          }
                          min="0"
                          max={categorySettings[category].useDollarAmounts ? undefined : 100}
                        />
                        <span className="input-symbol">
                          {categorySettings[category].useDollarAmounts ? currencySymbols[currency] : '%'}
                        </span>
                      </div>
                    </div>
                    <div className="category-buttons">
                      <button onClick={() => handleRemoveCategory(category)}>Remove</button>
                      <button
                        onClick={() =>
                          handleCategorySettingChange(category, 'useDollarAmounts', !categorySettings[category].useDollarAmounts)
                        }
                      >
                        {categorySettings[category].useDollarAmounts ? 'Use %' : 'Use $'}
                      </button>
                      <button
                        onClick={() =>
                          handleCategorySettingChange(category, 'scheduleType', categorySettings[category].scheduleType === 'none' ? 'recurring' : 'none')
                        }
                      >
                        {categorySettings[category].scheduleType === 'none' ? 'Add Schedule' : 'Remove Schedule'}
                      </button>
                    </div>
                    {categorySettings[category].scheduleType === 'recurring' && (
                      <div className="schedule-options">
                        {/* One-Time Payment Section */}
                        <div className="one-time-payment">
                          <label>
                            <input
                              type="checkbox"
                              checked={categorySettings[category].isOneTime}
                              onChange={(e) =>
                                handleCategorySettingChange(category, 'isOneTime', e.target.checked)
                              }
                            />
                            <span>One-Time Payment</span>
                          </label>
                          {categorySettings[category].isOneTime && (
                            <div className="one-time-date">
                              <DatePicker
                                selected={categorySettings[category].oneTimeDate}
                                onChange={(date) =>
                                  handleCategorySettingChange(category, 'oneTimeDate', date)
                                }
                                dateFormat="MM/dd/yyyy"
                                minDate={startDate}
                              />
                            </div>
                          )}
                        </div>

                        {/* Frequency and Day Section */}
                        {!categorySettings[category].isOneTime && (
                          <div className="recurring-options">
                            <div className="frequency-section">
                              <label>
                                Frequency:
                                <select
                                  value={categorySettings[category].frequency}
                                  onChange={(e) =>
                                    handleCategorySettingChange(category, 'frequency', e.target.value)
                                  }
                                >
                                  <option value="weekly">Weekly</option>
                                  <option value="bi-weekly">Bi-Weekly</option>
                                  <option value="monthly">Monthly</option>
                                  <option value="custom">Custom Interval</option>
                                </select>
                              </label>
                            </div>

                            {categorySettings[category].frequency === 'custom' && (
                              <div className="interval-section">
                                <label>
                                  Interval:
                                  <input
                                    type="number"
                                    value={categorySettings[category].interval || ''}
                                    onChange={(e) =>
                                      handleCategorySettingChange(category, 'interval', parseInt(e.target.value, 10))
                                    }
                                    placeholder="e.g., 2 (for every 2 weeks)"
                                    min="1"
                                  />
                                </label>
                              </div>
                            )}

                            <div className="day-section">
                              <label>
                                Day:
                                <select
                                  value={categorySettings[category].selectedDay}
                                  onChange={(e) =>
                                    handleCategorySettingChange(category, 'selectedDay', e.target.value)
                                  }
                                >
                                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                    <option key={day} value={day}>
                                      {day}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              <li>
                <div className="category-header">
                  <span>Savings</span>
                  <div className="input-container">
                    <input
                      type="number"
                      value={remainingBudget.toFixed(2)}
                      readOnly
                    />
                    <span className="input-symbol">{currencySymbols[currency]}</span>
                  </div>
                </div>
                {savingsGoalEnabled && (
                  <p className="savings-goal-info">
                    Goal: {currencySymbols[currency]}{savingsGoalAmount} (Remaining: {currencySymbols[currency]}{remainingBudget.toFixed(2)})
                  </p>
                )}
              </li>
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

        {/* Explanation Drawer */}
        <div className={`explanation-drawer ${isDrawerOpen ? 'open' : ''}`}>
          <button className="drawer-toggle" onClick={toggleDrawer}>
            {isDrawerOpen ? '›' : '‹'}
          </button>
          <div className="drawer-content">
			        <h4>How to Use This Page</h4>
			        <p><strong>One-Time Budget:</strong> Use this if you have a fixed amount of money to budget. Can also be used if pay isn't clearly defined like hourly pay, and can be adjusted through supplemental income in the daily budgets</p>
			        <p><strong>Expected Gross Income:</strong> Use this if you want to budget based on your regular income.</p>
			        <p><strong>Income Interval:</strong> If you are receiving a regular income, how often is it received.</p>
              <p><strong>Savings Goal:</strong> If enabled, sets a goal date at the end of your budget duration (Time Period) for you to track your savings progress.</p>
			        <p><strong>Remaining Budget:</strong> If you are one a One-Time Budget, shows how much of the budget is yet to be allocated</p>
			        <p><strong>Templates:</strong> Travel Budget & Daily Expense plans have preset categories for convenience. However, you can have a more flexible plan by adding categories to the Custom plan</p>
			        <p><strong>Categories:</strong> Add or remove categories to customize your budget.</p>
			        <p><strong>Use $:</strong> Switches the default method of entering budget allocation of a category. This app uses % by default.</p>
			        <p><strong>Add Schedule:</strong> Allows for categories to be paid for either one time on a specific date or on a recurring basis</p>
			        <p><strong>Time Period:</strong> Set the duration for your budget (e.g., weekly, monthly).</p>
			        <p><strong>Savings:</strong> The remainder calculated after the budget is allocated to other categories</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default BudgetPage;