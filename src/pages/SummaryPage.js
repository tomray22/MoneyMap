import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBudget } from '../BudgetContext';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { exportToCSV, exportToPDF } from '../components/exportUtils';
import CurrencyConverter from '../components/CurrencyConverter';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/SummaryPage.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

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

const SummaryView = () => {
  const { budgetData } = useBudget();
  const location = useLocation();
  const navigate = useNavigate();

  // State for currency and exchange rate
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1);

  // Get the selected date range from location state
  const { startDate: initialStartDate, endDate: initialEndDate } = location.state || {
    startDate: new Date(budgetData?.startDate || new Date()),
    endDate: new Date(budgetData?.endDate || new Date()),
  };

  const [startDate, setStartDate] = useState(new Date(initialStartDate));
  const [endDate, setEndDate] = useState(new Date(initialEndDate));
  const [savingsProgress, setSavingsProgress] = useState(0);
  const progressBarRef = useRef(null);

  // Handle currency change
  const handleCurrencyChange = (newCurrency, newExchangeRate) => {
    setCurrency(newCurrency);
    setExchangeRate(newExchangeRate);
  };

  // Calculate accumulated totals for the selected date range
  const calculateTotals = () => {
    const totals = { budgeted: 0, actual: 0, difference: 0, savings: 0, unexpectedExpenses: 0 };
    const savedData = JSON.parse(localStorage.getItem('dailyData')) || {};

    // Calculate the total budgeted amount for the selected date range
    if (budgetData?.categories) {
      budgetData.categories.forEach((category) => {
        if (category.schedule) {
          const { type, frequency, interval, day, date: scheduledDate } = category.schedule;
          let expected = 0;

          if (type === 'recurring') {
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
              let isScheduled = false;
              if (frequency === 'weekly') {
                const dayOfWeek = currentDate.toLocaleString('en-US', { weekday: 'long' });
                isScheduled = dayOfWeek === day;
              } else if (frequency === 'bi-weekly') {
                const dayOfWeek = currentDate.toLocaleString('en-US', { weekday: 'long' });
                const weeksSinceStart = Math.floor((currentDate - new Date(budgetData.startDate)) / (1000 * 60 * 60 * 24 * 7));
                isScheduled = dayOfWeek === day && weeksSinceStart % 2 === 0;
              } else if (frequency === 'monthly') {
                const dayOfMonth = currentDate.getDate();
                isScheduled = dayOfMonth === parseInt(day, 10);
              } else if (frequency === 'custom') {
                const daysSinceStart = Math.floor((currentDate - new Date(budgetData.startDate)) / (1000 * 60 * 60 * 24));
                isScheduled = daysSinceStart % interval === 0;
              }

              if (isScheduled) {
                expected += category.expected;
              }

              currentDate.setDate(currentDate.getDate() + 1);
            }
          } else if (type === 'one-time') {
            if (new Date(scheduledDate) >= startDate && new Date(scheduledDate) <= endDate) {
              expected += category.expected;
            }
          }

          totals.budgeted += expected;
        } else {
          const totalDaysInBudget = Math.ceil((new Date(budgetData.endDate) - new Date(budgetData.startDate)) / (1000 * 60 * 60 * 24));
          const daysInSelectedRange = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
          const proportion = daysInSelectedRange / totalDaysInBudget;
          totals.budgeted += category.expected * proportion;
        }
      });
    }

    // Calculate the total actual, difference, and unexpected expenses
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toDateString();
      if (savedData[dateKey]) {
        savedData[dateKey].rows.forEach((row) => {
          totals.budgeted += row.expected || 0;
          totals.actual += row.actual || 0;
          totals.difference += row.difference || 0;
        });

        totals.savings += savedData[dateKey].actualSavings || 0;
        totals.unexpectedExpenses += savedData[dateKey].unexpectedExpenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
      }
    }

    return totals;
  };

  const totals = calculateTotals();

  // Calculate savings goal progress
  const savingsGoal = budgetData?.budgetGoals?.savingsGoal || 0;
  const newSavingsProgress = (totals.savings / savingsGoal) * 100;

  // Animate the progress bar
  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${savingsProgress}%`;
    }
  }, [savingsProgress]);

  // Update savings progress with animation
  useEffect(() => {
    const animationDuration = 1000; // 1 second
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / animationDuration, 1);
      setSavingsProgress(progress * newSavingsProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [newSavingsProgress]);

  // Gather data for all days from localStorage
  const gatherDailyData = () => {
    const savedData = JSON.parse(localStorage.getItem('dailyData')) || {};
    const dailyData = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toDateString();
      if (savedData[dateKey]) {
        dailyData.push({
          date: dateKey,
          rows: savedData[dateKey].rows || [],
          supplementalIncomes: savedData[dateKey].supplementalIncomes || [],
          unexpectedExpenses: savedData[dateKey].unexpectedExpenses || [],
        });
      }
    }

    return dailyData;
  };

  // Export to CSV with Toastify alert
  const handleExportCSV = () => {
    const dailyData = gatherDailyData();
    const data = {
      totals: {
        budgeted: totals.budgeted * exchangeRate,
        actual: totals.actual * exchangeRate,
        difference: totals.difference * exchangeRate,
        savings: totals.savings * exchangeRate,
        unexpectedExpenses: totals.unexpectedExpenses * exchangeRate,
      },
      dailyData: dailyData.map((day) => ({
        date: day.date,
        rows: [
          ...day.rows,
          {
            label: 'Savings',
            expected: day.savings || 0,
            actual: day.savings || 0,
            difference: 0,
          },
        ],
        supplementalIncomes: day.supplementalIncomes || [],
        unexpectedExpenses: day.unexpectedExpenses || [],
        savings: day.savings || 0,
      })),
    };

    exportToCSV(data, `Summary_${startDate.toDateString()}_to_${endDate.toDateString()}`);
    toast.success('CSV exported successfully!');
  };

  // Export to PDF with Toastify alert
  const handleExportPDF = () => {
    const dailyData = gatherDailyData();
    const data = {
      totals: {
        budgeted: totals.budgeted * exchangeRate,
        actual: totals.actual * exchangeRate,
        difference: totals.difference * exchangeRate,
        savings: totals.savings * exchangeRate,
        unexpectedExpenses: totals.unexpectedExpenses * exchangeRate,
      },
      dailyData: dailyData.map((day) => ({
        date: day.date,
        rows: [
          ...day.rows,
          {
            label: 'Savings',
            expected: day.savings || 0,
            actual: day.savings || 0,
            difference: 0,
          },
        ],
        supplementalIncomes: day.supplementalIncomes || [],
        unexpectedExpenses: day.unexpectedExpenses || [],
        savings: day.savings || 0,
      })),
    };

    exportToPDF(data, `Summary_${startDate.toDateString()}_to_${endDate.toDateString()}`, currencySymbols[currency]);
    toast.success('PDF exported successfully!');
  };

  // Export to JSON with Toastify alert
  const handleExportJSON = () => {
    const dailyData = gatherDailyData();

    // Get all unique labels from the budgetData and dailyData
    const allLabels = new Set();

    // Add labels from budgetData categories
    if (budgetData?.categories) {
      budgetData.categories.forEach((category) => {
        allLabels.add(category.label);
      });
    }

    // Add labels from dailyData rows
    dailyData.forEach((day) => {
      day.rows.forEach((row) => {
        allLabels.add(row.label);
      });
    });

    // Ensure all days in the selected time period are included
    const allDaysData = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toDateString();
      const existingDay = dailyData.find((day) => day.date === dateKey);

      // Create a default row for each label
      const defaultRows = Array.from(allLabels).map((label) => ({
        label,
        expected: 0,
        actual: 0,
        difference: 0,
      }));

      // If data exists for this day, merge it with the default rows
      const rows = existingDay
        ? existingDay.rows.map((row) => ({
            label: row.label,
            expected: row.expected || 0,
            actual: row.actual || 0,
            difference: row.difference || 0,
          }))
        : defaultRows;

      allDaysData.push({
        date: dateKey,
        rows,
        supplementalIncomes: existingDay?.supplementalIncomes || [],
        unexpectedExpenses: existingDay?.unexpectedExpenses || [],
        savings: existingDay?.savings || 0,
      });
    }

    // Prepare the data for export
    const data = {
      totals: {
        budgeted: totals.budgeted * exchangeRate,
        actual: totals.actual * exchangeRate,
        difference: totals.difference * exchangeRate,
        savings: totals.savings * exchangeRate,
        unexpectedExpenses: totals.unexpectedExpenses * exchangeRate,
      },
      dailyData: allDaysData.map((day) => ({
        date: day.date,
        rows: [
          ...day.rows,
          {
            label: 'Savings',
            expected: day.savings || 0,
            actual: day.savings || 0,
            difference: 0,
          },
        ],
        supplementalIncomes: day.supplementalIncomes || [],
        unexpectedExpenses: day.unexpectedExpenses || [],
      })),
    };

    // Convert data to JSON and create a downloadable file
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Budget_Summary_${startDate.toDateString()}_to_${endDate.toDateString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('JSON exported successfully!');
  };

  // Data for the budgeted donut chart
  const budgetedChartData = {
    labels: [
      ...budgetData?.categories
        .filter((category) => category.label !== 'Savings') // Exclude Savings from the main list
        .map((category) => category.label),
      'Savings', // Add Savings as a separate slice
    ],
    datasets: [
      {
        label: 'Budgeted',
        data: [
          ...budgetData?.categories
            .filter((category) => category.label !== 'Savings') // Exclude Savings from the main list
            .map((category) => category.expected * exchangeRate),
          budgetData.remainingBudget * exchangeRate, // Use Budgeted Savings directly
        ],
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#FF6384',
        ],
      },
    ],
  };

  // Data for the actual spending donut chart
  const actualSpendingChartData = {
    labels: ['Spent', 'Savings', 'Unexpected Expenses'],
    datasets: [
      {
        label: 'Actual Spending',
        data: [
          totals.actual * exchangeRate,
          totals.savings * exchangeRate,
          totals.unexpectedExpenses * exchangeRate,
        ],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  return (
    <div className="summary-page">
      <h1>Budget Summary</h1>
      <CurrencyConverter onCurrencyChange={handleCurrencyChange} />
      <div className="date-range-display">
        <p>
          <strong>Date Range:</strong> {startDate.toDateString()} to {endDate.toDateString()}
        </p>
      </div>
      <div className="totals-display">
        <h2>Accumulated Totals</h2>
        <div className="totals-grid">
          <div className="totals-item" data-tooltip="Total amount budgeted for the selected date range">
            <span className="totals-label">Total Budgeted</span>
            <span className="totals-value">
              {currencySymbols[currency]}{(totals.budgeted * exchangeRate).toFixed(2)}
            </span>
          </div>
          <div className="totals-item" data-tooltip="Total amount actually spent for the selected date range">
            <span className="totals-label">Total Actual</span>
            <span className="totals-value">
              {currencySymbols[currency]}{(totals.actual * exchangeRate).toFixed(2)}
            </span>
          </div>
          <div className="totals-item" data-tooltip="Difference between budgeted and actual amounts">
            <span className="totals-label">Total Difference</span>
            <span className="totals-value">
              {currencySymbols[currency]}{(totals.difference * exchangeRate).toFixed(2)}
            </span>
          </div>
          <div className="totals-item" data-tooltip="Total savings accumulated for the selected date range">
            <span className="totals-label">Total Savings</span>
            <span className="totals-value">
              {currencySymbols[currency]}{(totals.savings * exchangeRate).toFixed(2)}
            </span>
          </div>
          <div className="totals-item" data-tooltip="Total unexpected expenses incurred for the selected date range">
            <span className="totals-label">Unexpected Expenses</span>
            <span className="totals-value">
              {currencySymbols[currency]}{(totals.unexpectedExpenses * exchangeRate).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      <div className="charts-container">
        <div className="chart">
          <h3>Budgeted Spending</h3>
          <Doughnut data={budgetedChartData} />
        </div>
        <div className="chart">
          <h3>Actual Spending</h3>
          <Doughnut data={actualSpendingChartData} />
        </div>
      </div>
      <div className="savings-goal-progress">
        <h3>Savings Goal Progress</h3>
        <div className="progress-bar">
          <div
            ref={progressBarRef}
            className="progress-fill"
            style={{ width: `${savingsProgress}%` }}
          ></div>
        </div>
        <p>
          {currencySymbols[currency]}{(totals.savings * exchangeRate).toFixed(2)} / {currencySymbols[currency]}{(savingsGoal * exchangeRate).toFixed(2)}
        </p>
      </div>
      <div className="export-buttons">
        <button onClick={handleExportCSV}>Export to CSV</button>
        <button onClick={handleExportPDF}>Export to PDF</button>
        <button onClick={handleExportJSON}>Export to JSON</button>
        <button onClick={() => navigate('/calendar')}>Back to Calendar</button>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default SummaryView;