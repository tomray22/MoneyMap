import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBudget } from '../BudgetContext';
import { toast } from 'react-toastify';

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

const useBudgetSetup = (currency, exchangeRate) => {
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
  const [incomeType, setIncomeType] = useState('one-time');
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
        initialCategories.push('Savings');
      }
      setCategories(initialCategories);

      const initialRatios = {};
      const initialDollarAmounts = {};
      const initialCategorySettings = {};
      initialCategories.forEach((category) => {
        initialRatios[category] = '';
        initialDollarAmounts[category] = null;
        initialCategorySettings[category] = {
          useDollarAmounts: true,
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
      setTotalBudget('');
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
          calculatedBudget = income * 4;
          break;
        case 'bi-weekly':
          calculatedBudget = income * 2;
          break;
        case 'monthly':
          calculatedBudget = income;
          break;
        case 'annually':
          calculatedBudget = income / 12;
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
        if (!importedData.totals || !importedData.dailyData) {
          throw new Error('Invalid file format: Missing required fields.');
        }

        const startDate = new Date(importedData.dailyData[0].date);
        const endDate = new Date(importedData.dailyData[importedData.dailyData.length - 1].date);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Invalid date format in the imported file.');
        }

        const updatedBudgetData = {
          ...budgetData,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        };

        setBudgetData(updatedBudgetData);

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

        toast.success('Budget data imported successfully!');
        navigate('/calendar');
      } catch (error) {
        toast.error(`Error importing JSON file: ${error.message}`);
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
      toast.success(`Category "${newCategory.trim()}" added successfully!`);
    } else {
      toast.error('Category name is invalid or already exists.');
    }
  };

  // Remove a category (except Savings)
  const handleRemoveCategory = (categoryToRemove) => {
    if (categoryToRemove === 'Savings') {
      toast.error('Cannot remove the Savings category.');
      return;
    }
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
    toast.success(`Category "${categoryToRemove}" removed successfully!`);
  };

  // Handle ratio or dollar amount changes
  const handleRatioChange = (category, value) => {
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setRatios({ ...ratios, [category]: value });
    } else {
      toast.error('Please enter a valid percentage (0-100).');
    }
  };

  const handleDollarAmountChange = (category, value) => {
    if (value === null || (!isNaN(value) && value >= 0)) {
      setDollarAmounts({ ...dollarAmounts, [category]: value });
    } else {
      toast.error('Please enter a valid dollar amount.');
    }
  };

  // Handle time period changes
  const handleTimePeriodChange = (e) => {
    const period = e.target.value;
    setTimePeriod(period);

    const newEndDate = new Date(startDate);
    if (period === 'weekly') {
      newEndDate.setDate(newEndDate.getDate() + 7);
    } else if (period === 'bi-weekly') {
      newEndDate.setDate(newEndDate.getDate() + 14);
    } else if (period === 'monthly') {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    } else if (period === 'custom') {
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
    } else {
      toast.error('Please enter a valid number of days.');
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
        toast.warn(`Your savings goal (${currencySymbols[currency]}${goal.toFixed(2)}) exceeds your remaining budget (${currencySymbols[currency]}${remaining.toFixed(2)}).`);
      }
    }
  };

  // Complete the budget setup
  const handleCompleteSetup = () => {
    if (!totalBudget || isNaN(totalBudget)) {
      toast.error('Please enter a valid total budget.');
      return;
    }

    checkSavingsGoalFeasibility();

    let calculatedEndDate;
    if (timePeriod === 'weekly') {
      calculatedEndDate = new Date(startDate);
      calculatedEndDate.setDate(startDate.getDate() + 6);
    } else if (timePeriod === 'bi-weekly') {
      calculatedEndDate = new Date(startDate);
      calculatedEndDate.setDate(startDate.getDate() + 13);
    } else if (timePeriod === 'monthly') {
      calculatedEndDate = new Date(startDate);
      calculatedEndDate.setMonth(startDate.getMonth() + 1);
      calculatedEndDate.setDate(calculatedEndDate.getDate() - 1);
    } else if (timePeriod === 'custom' && customTimePeriod) {
      calculatedEndDate = new Date(startDate);
      calculatedEndDate.setDate(startDate.getDate() + parseInt(customTimePeriod, 10) - 1);
    } else {
      toast.error('Please specify a valid time period.');
      return;
    }

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
    toast.success('Budget setup completed successfully!');
    navigate('/calendar');
  };

  // Toggle drawer
  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  return {
    selectedTemplate,
    categories,
    ratios,
    dollarAmounts,
    totalBudget,
    setTotalBudget, // Add this
    timePeriod,
    customTimePeriod,
    startDate,
    setStartDate, // Add this
    endDate,
    setEndDate, // Add this
    isSetupComplete,
    newCategory,
    setNewCategory, // Add this
    categorySettings,
    remainingBudget,
    incomeType,
    incomeData,
    setIncomeData, // Add this
    savingsGoalEnabled,
    setSavingsGoalEnabled, // Add this
    savingsGoalAmount,
    setSavingsGoalAmount, // Add this
    isDrawerOpen,
    handleIncomeTypeChange,
    handleGrossIncomeChange,
    handleImportJSON,
    handleTemplateClick,
    handleAddCategory,
    handleRemoveCategory,
    handleRatioChange,
    handleDollarAmountChange,
    handleTimePeriodChange,
    handleCustomTimePeriodChange,
    handleCategorySettingChange,
    handleCompleteSetup,
    toggleDrawer,
    currencySymbols,
    templates, // Add this
  };
};

export default useBudgetSetup;
