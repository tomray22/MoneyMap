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
    categories: ['Groceries', 'Transport', 'Utilities', 'Leisure'],
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
    netIncome: '',
    incomeInterval: 'monthly',
  });
  const [savingsGoalEnabled, setSavingsGoalEnabled] = useState(false);
  const [savingsGoalAmount, setSavingsGoalAmount] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Track whether the savings goal warning has been shown
  const [hasShownSavingsWarning, setHasShownSavingsWarning] = useState(false);

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
    if (type !== 'continue') {
      setTotalBudget('');
    }
  };

  // Handle net income change
  const handlenetIncomeChange = (value) => {
    setIncomeData({ ...incomeData, netIncome: value });
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

  // Add a function to check if there is data in local storage
  const hasSavedData = () => {
    const budgetData = localStorage.getItem('budgetData');
    if (!budgetData) return false; // No data in localStorage
  
    try {
      const parsedData = JSON.parse(budgetData);
      // Check if the data is valid (e.g., categories exist and totalBudget is set)
      return (
        parsedData.categories &&
        parsedData.categories.length > 0 &&
        parsedData.totalBudget !== null &&
        parsedData.totalBudget !== undefined
      );
    } catch (error) {
      console.error('Error parsing budgetData from localStorage:', error);
      return false; // Invalid JSON or corrupted data
    }
  };

  // Handle template selection
  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
  };

  // Add a new category
  const handleAddCategory = () => {
    const categoryName = newCategory.trim();

    // Check if the category name is empty or already exists
    if (!categoryName) {
      toast.error('Category name cannot be empty.');
      return;
    }

    if (categories.includes(categoryName)) {
      toast.error('Category name already exists.');
      return;
    }

    // Check if the category name is "Savings" or a derivative
    const savingsKeywords = ['savings', 'saving', 'save']; // Add more derivatives if needed
    const isSavingsRelated = savingsKeywords.some((keyword) =>
      categoryName.toLowerCase().includes(keyword)
    );

    if (isSavingsRelated) {
      toast.error('Cannot use "Savings" or related terms as a category name.');
      return;
    }

    // Add the new category
    const updatedCategories = [...categories, categoryName];
    setCategories(updatedCategories);
    setRatios({ ...ratios, [categoryName]: '' });
    setDollarAmounts({ ...dollarAmounts, [categoryName]: null });
    setCategorySettings({
      ...categorySettings,
      [categoryName]: {
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
    toast.success(`Category "${categoryName}" added successfully!`);
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

  // Complete the budget setup
  const handleCompleteSetup = () => {
    // Validate required fields
    if (!totalBudget || isNaN(totalBudget)) {
      toast.error('Please enter a valid total budget.');
      return;
    }

    // Check if all categories (except Savings) have valid amounts
    const hasInvalidAmounts = categories.some((category) => {
      if (category === 'Savings') return false; // Skip Savings
      if (categorySettings[category].useDollarAmounts) {
        return dollarAmounts[category] === null || dollarAmounts[category] === undefined;
      } else {
        return ratios[category] === null || ratios[category] === undefined;
      }
    });

    if (hasInvalidAmounts) {
      toast.error('Please assign amounts to all categories.');
      return;
    }

    // Check if Savings Goal > Savings
    if (savingsGoalEnabled && savingsGoalAmount > remainingBudget && !hasShownSavingsWarning) {
      toast.warn(
        `Your savings goal (${currencySymbols[currency]}${savingsGoalAmount}) exceeds your remaining budget (${currencySymbols[currency]}${remainingBudget.toFixed(2)}). You may need to adjust your spending or increase your income. Press "Complete Setup" again to proceed if you understand.`
      );
      setHasShownSavingsWarning(true); // Mark that the warning has been shown
      return; // Stop the setup process the first time
    }

    // Clear dailyData only if the user is NOT continuing an existing budget
    if (incomeType !== 'continue') {
      localStorage.removeItem('dailyData');
    }

    // Proceed with setup
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
      netIncome: incomeType === 'net-income' ? parseFloat(incomeData.netIncome) : null,
      incomeInterval: incomeType === 'net-income' ? incomeData.incomeInterval : null,
      budgetGoals: {
        savingsGoal: savingsGoalEnabled ? parseFloat(savingsGoalAmount) : 0,
        savingsInterval: 'monthly',
      },
      remainingBudget: remainingBudget,
    };

    setBudgetData(newBudgetData);
    localStorage.setItem('budgetData', JSON.stringify(newBudgetData));
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
    setTotalBudget,
    timePeriod,
    customTimePeriod,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isSetupComplete,
    newCategory,
    setNewCategory,
    categorySettings,
    remainingBudget,
    incomeType,
    incomeData,
    setIncomeData,
    savingsGoalEnabled,
    setSavingsGoalEnabled,
    savingsGoalAmount,
    setSavingsGoalAmount,
    isDrawerOpen,
    hasSavedData,
    handleIncomeTypeChange,
    handlenetIncomeChange,
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
    templates,
  };
};

export default useBudgetSetup;