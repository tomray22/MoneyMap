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
  const navigate = useNavigate();

  // Clear dailyData from localStorage when returning to setup
  useEffect(() => {
    if (!isSetupComplete) {
      localStorage.removeItem('dailyData');
    }
  }, [isSetupComplete]);

  // Load categories and ratios when a template is selected
  useEffect(() => {
    if (selectedTemplate) {
      setCategories(selectedTemplate.categories);
      const initialRatios = {};
      const initialDollarAmounts = {};
      const initialCategorySettings = {};
      selectedTemplate.categories.forEach((category) => {
        initialRatios[category] = '';
        initialDollarAmounts[category] = null; // Use null instead of ''
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
      setDollarAmounts({ ...dollarAmounts, [newCategory.trim()]: null }); // Use null instead of ''
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

  // Remove a category
  const handleRemoveCategory = (categoryToRemove) => {
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

  // Complete the budget setup
  const handleCompleteSetup = () => {
    if (!totalBudget || isNaN(totalBudget)) {
      alert('Please enter a valid total budget.');
      return;
    }

    // Calculate end date based on time period
    let calculatedEndDate;
    if (timePeriod === 'weekly') {
      calculatedEndDate = new Date(startDate);
      calculatedEndDate.setDate(startDate.getDate() + 7);
    } else if (timePeriod === 'bi-weekly') {
      calculatedEndDate = new Date(startDate);
      calculatedEndDate.setDate(startDate.getDate() + 14);
    } else if (timePeriod === 'monthly') {
      calculatedEndDate = new Date(startDate);
      calculatedEndDate.setMonth(startDate.getMonth() + 1);
    } else if (timePeriod === 'custom' && customTimePeriod) {
      calculatedEndDate = new Date(startDate);
      calculatedEndDate.setDate(startDate.getDate() + parseInt(customTimePeriod, 10));
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
    };

    setBudgetData(newBudgetData);
    setIsSetupComplete(true);
    navigate('/calendar');
  };

  if (!isSetupComplete) {
    return (
      <div className="budget-setup">
        <h2>Budget Setup</h2>
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
        {selectedTemplate && (
          <div className="ratio-form">
            <h3>{selectedTemplate.name} - Set Budget</h3>
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
              </label>
              <p>
                Remaining Budget: {currencySymbols[currency]}{(remainingBudget * exchangeRate).toFixed(2)}
              </p>
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
              {categories.map((category) => (
                <li key={category}>
                  <div className="category-header">
                    <span>{category}</span>
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
                      <label>
                        <input
                          type="checkbox"
                          checked={categorySettings[category].isOneTime}
                          onChange={(e) =>
                            handleCategorySettingChange(category, 'isOneTime', e.target.checked)
                          }
                        />
                        One-Time Payment
                      </label>

                      {categorySettings[category].isOneTime ? (
                        <div className="one-time-date">
                          <label>
                            Date:
                            <DatePicker
                              selected={categorySettings[category].oneTimeDate}
                              onChange={(date) =>
                                handleCategorySettingChange(category, 'oneTimeDate', date)
                              }
                              dateFormat="MM/dd/yyyy"
                              minDate={startDate}
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="recurring-options">
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

                          {categorySettings[category].frequency === 'custom' && (
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
                          )}

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
                      )}
                    </div>
                  )}
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
  }

  return null;
};

export default BudgetPage;