import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import DatePicker from 'react-datepicker';
import 'react-calendar/dist/Calendar.css';
import 'react-datepicker/dist/react-datepicker.css';
import { useBudget } from '../BudgetContext';
import { exportToCSV, exportToPDF } from '../components/exportUtils';
import { enUS } from 'date-fns/locale';
import '../styles/Calendar.css';
import Loading from '../components/Loading'; // Import the Loading component
import { motion } from 'framer-motion'; // Import framer-motion for animations
import { ToastContainer, toast } from 'react-toastify'; // Import toast notifications
import 'react-toastify/dist/ReactToastify.css'; // Import toast styles

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

const CalendarView = ({ currency, exchangeRate }) => {
  const { budgetData } = useBudget();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // Added loading state

  const [selectedDate, setSelectedDate] = useState(new Date(budgetData?.startDate || new Date()));
  const [startDate, setStartDate] = useState(new Date(budgetData?.startDate || new Date()));
  const [endDate, setEndDate] = useState(new Date(budgetData?.endDate || new Date()));

  // Memoize daily budgets to avoid recalculating on every render
  const dailyBudgets = useMemo(() => {
    if (!budgetData) return {};

    const { categories, startDate, endDate } = budgetData;
    const dailyBudgets = {};

    // Load saved data from localStorage
    const savedData = JSON.parse(localStorage.getItem('dailyData')) || {};

    // Loop through each day from startDate to endDate (inclusive)
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toDateString();
      dailyBudgets[dateKey] = dailyBudgets[dateKey] || { total: 0, categories: [], unexpectedExpenses: 0 };

      // Add unexpected expenses if they exist
      if (savedData[dateKey]?.unexpectedExpenses) {
        dailyBudgets[dateKey].unexpectedExpenses = savedData[dateKey].unexpectedExpenses.reduce(
          (sum, expense) => sum + (expense.amount || 0),
          0
        );
      }

      // Calculate budget categories
      categories.forEach((category) => {
        if (category.schedule) {
          // Handle scheduled payments
          const { type, days, date } = category.schedule;
          if (type === 'recurring') {
            // Recurring payments (e.g., every Monday and Friday)
            const dayOfWeek = d.toLocaleString('en-US', { weekday: 'long' });
            if (days.includes(dayOfWeek)) {
              const savedRow = savedData[dateKey]?.rows?.find((row) => row.label === category.label);
              dailyBudgets[dateKey].categories.push({
                label: category.label,
                expected: category.expected * exchangeRate,
                actual: (savedRow?.actual || 0) * exchangeRate,
                difference: category.expected * exchangeRate - (savedRow?.actual || 0) * exchangeRate,
              });
              dailyBudgets[dateKey].total += category.expected * exchangeRate;
            }
          } else if (type === 'one-time') {
            // One-time payments
            if (new Date(date).toDateString() === dateKey) {
              const savedRow = savedData[dateKey]?.rows?.find((row) => row.label === category.label);
              dailyBudgets[dateKey].categories.push({
                label: category.label,
                expected: category.expected * exchangeRate,
                actual: (savedRow?.actual || 0) * exchangeRate,
                difference: category.expected * exchangeRate - (savedRow?.actual || 0) * exchangeRate,
              });
              dailyBudgets[dateKey].total += category.expected * exchangeRate;
            }
          }
        } else {
          // Default behavior: spread the budget evenly
          const daysInBudget = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
          const dailyAmount = (category.expected / daysInBudget) * exchangeRate;
          const savedRow = savedData[dateKey]?.rows?.find((row) => row.label === category.label);
          dailyBudgets[dateKey].categories.push({
            label: category.label,
            expected: dailyAmount,
            actual: (savedRow?.actual || 0) * exchangeRate,
            difference: dailyAmount - (savedRow?.actual || 0) * exchangeRate,
          });
          dailyBudgets[dateKey].total += dailyAmount;
        }
      });
    }

    return dailyBudgets;
  }, [budgetData, exchangeRate]);

  // Simulate loading delay (replace with actual data loading logic)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500); // 2-second delay
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loading />; // Show loading screen
  }

  // Safely handle budgetData being undefined
  if (!budgetData) {
    return (
      <motion.div
        className="calendar-view"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Budget Calendar</h1>
        <p>Error: No budget data available. Please complete setup first.</p>
        <button onClick={() => navigate('/budget')}>Go to Setup</button>
        {toast.error('No budget data available. Please complete setup first.', { position: 'bottom-right' })}
      </motion.div>
    );
  }

  // Handle date selection
  const handleDateChange = (date) => {
    setSelectedDate(date);
    const formattedDate = date.toDateString();
    const selectedDayData = dailyBudgets[formattedDate];
    if (selectedDayData) {
      navigate(`/day/${formattedDate}`, { state: { date: formattedDate, data: selectedDayData.categories } });
    } else {
      toast.error('No budget data available for this day.', { position: 'bottom-right' });
    }
  };

  // Custom tile content for the calendar
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateKey = date.toDateString();
      if (dailyBudgets[dateKey]) {
        return (
          <div className="budget-display" data-total={`Total: ${currencySymbols[currency]}${dailyBudgets[dateKey].total.toFixed(2)}`}>
            <strong>Total:</strong> {currencySymbols[currency]}{dailyBudgets[dateKey].total.toFixed(2)}
          </div>
        );
      }
    }
    return null;
  };

  // Highlight the budget goal day and add green/red highlights
  const tileClassName = ({ date }) => {
    const dateKey = date.toDateString();
    const endDateKey = new Date(budgetData.endDate).toDateString();
    const dayData = dailyBudgets[dateKey];

    let className = '';
    if (dateKey === endDateKey) {
      className += ' budget-goal-day savings-goal-day-outline '; // Highlight savings goal date with outline
    }
    if (dayData) {
      const totalDifference = dayData.categories.reduce((sum, row) => sum + row.difference, 0);
      const totalUnexpectedExpenses = dayData.unexpectedExpenses || 0;

      // Subtract unexpected expenses from the total difference
      const netDifference = totalDifference - totalUnexpectedExpenses;

      console.log(`Date: ${dateKey}, Total Difference: ${totalDifference}, Unexpected Expenses: ${totalUnexpectedExpenses}, Net Difference: ${netDifference}`); // Debugging line

      if (netDifference > 0) {
        className += ' saved-more '; // Green for saving more than expected
      } else if (netDifference < 0) {
        className += ' overspent '; // Red for overspending
      }
    }
    return className.trim();
  };

  // Calculate totals for the selected date range
  const calculateTotals = (selectedData) => {
    const totals = {
      budgeted: 0,
      actual: 0,
      difference: 0,
      savings: 0,
      unexpectedExpenses: 0,
    };

    selectedData.forEach((day) => {
      day.rows.forEach((row) => {
        totals.budgeted += row.expected;
        totals.actual += row.actual;
        totals.difference += row.difference;
      });
      totals.savings += day.savings || 0;
      totals.unexpectedExpenses += day.unexpectedExpenses || 0;
    });

    return totals;
  };

  // Export data for the selected time range
  const exportTimeRangeData = (format) => {
    if (!startDate || !endDate) {
      toast.error('Please select a valid date range.', { position: 'bottom-right' });
      return;
    }

    // Gather data for the selected date range
    const selectedData = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toDateString();
      if (dailyBudgets[dateKey]) {
        selectedData.push({
          date: dateKey,
          rows: dailyBudgets[dateKey].categories.map((row) => ({
            label: row.label,
            expected: parseFloat(row.expected.toFixed(2)), // Ensure numeric value
            actual: parseFloat(row.actual.toFixed(2)), // Ensure numeric value
            difference: parseFloat(row.difference.toFixed(2)), // Ensure numeric value
          })),
          supplementalIncomes: dailyBudgets[dateKey].supplementalIncome
            ? [{ label: 'Supplemental Income', amount: parseFloat(dailyBudgets[dateKey].supplementalIncome.toFixed(2)) }]
            : [],
          unexpectedExpenses: dailyBudgets[dateKey].unexpectedExpenses
            ? [{ label: 'Unexpected Expenses', amount: parseFloat(dailyBudgets[dateKey].unexpectedExpenses.toFixed(2)) }]
            : [],
          savings: parseFloat((dailyBudgets[dateKey].savings || 0).toFixed(2)), // Ensure numeric value
        });
      }
    }

    if (selectedData.length === 0) {
      toast.error('No data available for the selected date range.', { position: 'bottom-right' });
      return;
    }

    // Calculate totals for the selected date range
    const totals = {
      budgeted: selectedData.reduce((sum, day) => sum + day.rows.reduce((rowSum, row) => rowSum + row.expected, 0), 0),
      actual: selectedData.reduce((sum, day) => sum + day.rows.reduce((rowSum, row) => rowSum + row.actual, 0), 0),
      difference: selectedData.reduce((sum, day) => sum + day.rows.reduce((rowSum, row) => rowSum + row.difference, 0), 0),
      savings: selectedData.reduce((sum, day) => sum + day.savings, 0),
      unexpectedExpenses: selectedData.reduce((sum, day) => sum + (day.unexpectedExpenses[0]?.amount || 0), 0),
    };

    // Prepare data for export
    const data = {
      totals,
      dailyData: selectedData,
    };

    // Export based on the selected format
    if (format === 'csv') {
      exportToCSV(data, `Budget_${startDate.toDateString()}_to_${endDate.toDateString()}`);
      toast.success('Data exported to CSV successfully!', { position: 'bottom-right' });
    } else if (format === 'pdf') {
      exportToPDF(data, `Budget_${startDate.toDateString()}_to_${endDate.toDateString()}`, currencySymbols[currency]);
      toast.success('Data exported to PDF successfully!', { position: 'bottom-right' });
    }
  };

  return (
    <motion.div
      className="calendar-view"
      initial={{ opacity: 0, y: -20 }} // Fade in and slide down
      animate={{ opacity: 1, y: 0 }} // Final state
      transition={{ duration: 0.5 }} // Animation duration
    >
      <h1>Budget Calendar</h1>
      <div className="date-range-picker">
        <label>
          Start Date:
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            minDate={new Date(budgetData.startDate)}
          />
        </label>
        <label>
          End Date:
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
          />
        </label>
        <button onClick={() => exportTimeRangeData('csv')}>Export to CSV</button>
        <button onClick={() => exportTimeRangeData('pdf')}>Export to PDF</button>
        <button onClick={() => navigate('/summary', { state: { startDate, endDate } })}>
          View Summary
        </button>
      </div>
      <Calendar
        onClickDay={handleDateChange}
        value={selectedDate}
        tileContent={tileContent}
        tileClassName={tileClassName}
        locale={enUS}
        defaultView="month"
        defaultActiveStartDate={new Date(budgetData.startDate)}
        minDate={new Date(budgetData.startDate)}
        maxDate={new Date(budgetData.endDate)}
      />
      <button onClick={() => navigate('/budget')} className="back-button">
        Go Back to Setup
      </button>
      <ToastContainer /> {/* Add toast container */}
    </motion.div>
  );
};

export default CalendarView;