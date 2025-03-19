import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBudget } from '../BudgetContext';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { exportToCSV, exportToPDF } from '../components/exportUtils';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ClipLoader } from 'react-spinners';
import { FaFileExport, FaPlus } from 'react-icons/fa';
import '../styles/BudgetTable.css';

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

const BudgetTable = ({ currency, exchangeRate }) => {
  const { date } = useParams(); // Get date from URL params
  const navigate = useNavigate();
  const { budgetData } = useBudget(); // Access budgetData from context
  const [rows, setRows] = useState([]);
  const [supplementalIncomes, setSupplementalIncomes] = useState([]);
  const [unexpectedExpenses, setUnexpectedExpenses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date(date));
  const [loading, setLoading] = useState(true);

  // Calculate totals for the main table (excluding Savings)
  const totals = rows.reduce(
    (acc, row) => ({
      budgeted: acc.budgeted + row.expected,
      actual: acc.actual + (row.actual || 0),
      difference: acc.difference + row.difference,
    }),
    { budgeted: 0, actual: 0, difference: 0 }
  );

  // Calculate daily Budgeted Savings
  const daysInBudget = Math.ceil((new Date(budgetData.endDate) - new Date(budgetData.startDate)) / (1000 * 60 * 60 * 24));
  const dailyBudgetedSavings = (budgetData.remainingBudget || 0) / daysInBudget;

  // Calculate Total Supplemental Income
  const totalSupplementalIncome = supplementalIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);

  // Calculate Total Unexpected Expenses
  const totalUnexpectedExpenses = unexpectedExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

  // Calculate Actual Savings
  const actualSavings = dailyBudgetedSavings + totalSupplementalIncome - totalUnexpectedExpenses + totals.difference;

  // Calculate Savings Difference (Actual - Budgeted)
  const savingsDifference = actualSavings - dailyBudgetedSavings;

  // Load saved data from localStorage and recalculate rows when currency or exchangeRate changes
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('dailyData')) || {};
    if (savedData[date]) {
      // Use saved data for the selected date
      const updatedRows = savedData[date].rows
        .filter((row) => row.label !== 'Savings') // Exclude Savings row from main table
        .map((row) => ({
          ...row,
          expected: row.expected * exchangeRate,
          actual: row.actual * exchangeRate,
          difference: row.difference * exchangeRate,
        }));
      setRows(updatedRows);

      // Load supplemental incomes and unexpected expenses
      setSupplementalIncomes(savedData[date].supplementalIncomes || []);
      setUnexpectedExpenses(savedData[date].unexpectedExpenses || []);
    } else if (budgetData?.categories) {
      // If no saved data exists, calculate the daily budget allocation
      const initialRows = budgetData.categories
        .filter((category) => {
          if (category.schedule) {
            const { type, frequency, interval, day, date: scheduledDate } = category.schedule;

            if (type === 'recurring') {
              // Recurring payments with custom frequency and interval
              let isScheduled = false;
              if (frequency === 'weekly') {
                const dayOfWeek = new Date(date).toLocaleString('en-US', { weekday: 'long' });
                isScheduled = dayOfWeek === day;
              } else if (frequency === 'bi-weekly') {
                const dayOfWeek = new Date(date).toLocaleString('en-US', { weekday: 'long' });
                const weeksSinceStart = Math.floor((new Date(date) - new Date(budgetData.startDate)) / (1000 * 60 * 60 * 24 * 7));
                isScheduled = dayOfWeek === day && weeksSinceStart % 2 === 0;
              } else if (frequency === 'monthly') {
                const dayOfMonth = new Date(date).getDate();
                isScheduled = dayOfMonth === parseInt(day, 10);
              } else if (frequency === 'custom') {
                const daysSinceStart = Math.floor((new Date(date) - new Date(budgetData.startDate)) / (1000 * 60 * 60 * 24));
                isScheduled = daysSinceStart % interval === 0;
              }
              return isScheduled;
            } else if (type === 'one-time') {
              // One-time payments
              return new Date(scheduledDate).toDateString() === date;
            }
          }
          return true; // Include all categories without a schedule
        })
        .filter((category) => category.label !== 'Savings') // Exclude Savings row from main table
        .map((category) => {
          // Calculate the expected amount for the day
          let expected = 0;
          if (category.schedule) {
            // For scheduled payments, use the full expected amount
            expected = category.expected * exchangeRate;
          } else {
            // For non-scheduled payments, spread the budget evenly
            expected = (category.expected / daysInBudget) * exchangeRate;
          }
          return {
            label: category.label,
            expected: expected,
            actual: (savedData[date]?.find((row) => row.label === category.label))?.actual || 0,
            difference: expected - ((savedData[date]?.find((row) => row.label === category.label))?.actual || 0),
          };
        });

      setRows(initialRows);
    }
    setLoading(false); // Set loading to false after data is loaded
  }, [date, budgetData, exchangeRate, currency]);

  // Handle date selection
  const handleDateChange = (date) => {
    setSelectedDate(date);
    navigate(`/day/${date.toDateString()}`);
  };

  // Handle changes to the "Actual" column
  const handleActualChange = (index, value) => {
    const updatedRows = [...rows];
    const actualValue = value === '' ? null : parseFloat(value); // Allow empty input
    updatedRows[index].actual = actualValue === null ? null : actualValue * exchangeRate;
    updatedRows[index].difference = updatedRows[index].expected - (updatedRows[index].actual || 0);
    setRows(updatedRows);

    // Save updated rows to localStorage
    const savedData = JSON.parse(localStorage.getItem('dailyData')) || {};
    savedData[date] = {
      rows: updatedRows,
      supplementalIncomes,
      unexpectedExpenses,
      actualSavings, // Include actualSavings in saved data
    };
    localStorage.setItem('dailyData', JSON.stringify(savedData));
  };

  // Add Supplemental Income Row
  const addSupplementalIncome = () => {
    const newIncome = {
      label: 'Supplemental Income',
      amount: 0,
    };
    setSupplementalIncomes([...supplementalIncomes, newIncome]);
  };

  // Add Unexpected Expense Row
  const addUnexpectedExpense = () => {
    const newExpense = {
      label: 'Unexpected Expense',
      amount: 0,
    };
    setUnexpectedExpenses([...unexpectedExpenses, newExpense]);
  };

  // Handle Supplemental Income Changes
  const handleSupplementalIncomeChange = (index, value) => {
    const updatedIncomes = [...supplementalIncomes];
    updatedIncomes[index].amount = value === '' ? null : parseFloat(value);
    setSupplementalIncomes(updatedIncomes);

    // Save updated supplemental incomes to localStorage
    const savedData = JSON.parse(localStorage.getItem('dailyData')) || {};
    savedData[date] = {
      rows,
      supplementalIncomes: updatedIncomes,
      unexpectedExpenses,
      actualSavings, // Include actualSavings in saved data
    };
    localStorage.setItem('dailyData', JSON.stringify(savedData));
  };

  // Handle Unexpected Expense Changes
  const handleUnexpectedExpenseChange = (index, value) => {
    const updatedExpenses = [...unexpectedExpenses];
    updatedExpenses[index].amount = value === '' ? null : parseFloat(value);
    setUnexpectedExpenses(updatedExpenses);

    // Save updated unexpected expenses to localStorage
    const savedData = JSON.parse(localStorage.getItem('dailyData')) || {};
    savedData[date] = {
      rows,
      supplementalIncomes,
      unexpectedExpenses: updatedExpenses,
      actualSavings, // Include actualSavings in saved data
    };
    localStorage.setItem('dailyData', JSON.stringify(savedData));
  };

  // Data for the budgeted donut chart
  const budgetedChartData = {
    labels: [...rows.map((row) => row.label), 'Budgeted Savings'],
    datasets: [
      {
        label: 'Budgeted',
        data: [...rows.map((row) => row.expected), dailyBudgetedSavings],
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#FF6384',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Data for the actual savings donut chart
  const actualSavingsChartData = {
    labels: ['Spent', 'Savings', 'Unexpected Expenses'],
    datasets: [
      {
        label: 'Actual Spending',
        data: [
          totals.actual, // Total actual spending
          actualSavings, // Actual savings
          totalUnexpectedExpenses, // Total unexpected expenses
        ],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        borderWidth: 1,
      },
    ],
  };

  // Export to CSV
  const handleExportCSV = () => {
    try {
      const data = {
        totals: {
          budgeted: totals.budgeted,
          actual: totals.actual,
          difference: totals.difference,
          savings: actualSavings,
          unexpectedExpenses: totalUnexpectedExpenses,
        },
        dailyData: [
          {
            date: date,
            rows: [
              ...rows,
              {
                label: 'Savings',
                expected: dailyBudgetedSavings,
                actual: actualSavings,
                difference: savingsDifference,
              },
            ],
            supplementalIncomes: supplementalIncomes,
            unexpectedExpenses: unexpectedExpenses,
            savings: actualSavings,
          },
        ],
      };

      exportToCSV(data, `Budget_${date}`);
      toast.success('Data exported to CSV successfully!', { position: 'bottom-right' });
    } catch (error) {
      toast.error('Failed to export data to CSV.', { position: 'bottom-right' });
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    try {
      const data = {
        totals: {
          budgeted: totals.budgeted,
          actual: totals.actual,
          difference: totals.difference,
          savings: actualSavings,
          unexpectedExpenses: totalUnexpectedExpenses,
        },
        dailyData: [
          {
            date: date,
            rows: [
              ...rows,
              {
                label: 'Savings',
                expected: dailyBudgetedSavings,
                actual: actualSavings,
                difference: savingsDifference,
              },
            ],
            supplementalIncomes: supplementalIncomes,
            unexpectedExpenses: unexpectedExpenses,
            savings: actualSavings,
          },
        ],
      };

      exportToPDF(data, `Budget_${date}`, currencySymbols[currency]);
      toast.success('Data exported to PDF successfully!', { position: 'bottom-right' });
    } catch (error) {
      toast.error('Failed to export data to PDF.', { position: 'bottom-right' });
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <ClipLoader color="#007bff" size={50} />
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return <div>No data available for this day.</div>;
  }

  return (
    <div className="page-container">
      {/* Header with Date Picker */}
      <div className="header">
        <h1>Budget for {selectedDate.toDateString()}</h1>
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          dateFormat="MMMM d, yyyy"
          className="date-picker"
        />
      </div>

      {/* Main Budget Table */}
      <table className="budget-table">
        <thead>
          <tr>
            <th>Label</th>
            <th>Budgeted</th>
            <th>Actual</th>
            <th>Difference</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              className={
                row.actual < row.expected
                  ? 'saved-more' // Green for saving more than expected
                  : row.actual > row.expected
                  ? 'overspent' // Red for overspending
                  : ''
              }
            >
              <td>{row.label}</td>
              <td>{currencySymbols[currency]}{row.expected.toFixed(2)}</td>
              <td>
                <input
                  type="number"
                  value={row.actual === null || row.actual === undefined ? '' : row.actual / exchangeRate}
                  onChange={(e) => handleActualChange(index, e.target.value)}
                  placeholder="Enter actual"
                  step="0.01"
                />
              </td>
              <td>{currencySymbols[currency]}{row.difference.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="totals-row">
            <td><strong>Totals</strong></td>
            <td><strong>{currencySymbols[currency]}{totals.budgeted.toFixed(2)}</strong></td>
            <td><strong>{currencySymbols[currency]}{totals.actual.toFixed(2)}</strong></td>
            <td><strong>{currencySymbols[currency]}{totals.difference.toFixed(2)}</strong></td>
          </tr>
        </tfoot>
      </table>

      {/* Supplemental Income and Unexpected Expenses Table */}
      <table className="income-expenses-table">
        <thead>
          <tr>
            <th>Label</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {supplementalIncomes.map((income, index) => (
            <tr key={`supplemental-${index}`} className="supplemental-income-row">
              <td>
                <input
                  type="text"
                  value={income.label}
                  onChange={(e) => {
                    const updatedIncomes = [...supplementalIncomes];
                    updatedIncomes[index].label = e.target.value;
                    setSupplementalIncomes(updatedIncomes);
                  }}
                  placeholder="Label (e.g., Bonus)"
                />
              </td>
              <td>
                <input
                  type="number"
                  value={income.amount === null || income.amount === undefined ? '' : income.amount / exchangeRate}
                  onChange={(e) => handleSupplementalIncomeChange(index, e.target.value)}
                  placeholder="Enter amount"
                  step="0.01"
                />
              </td>
            </tr>
          ))}
          {unexpectedExpenses.map((expense, index) => (
            <tr key={`unexpected-${index}`} className="unexpected-expense-row">
              <td>
                <input
                  type="text"
                  value={expense.label}
                  onChange={(e) => {
                    const updatedExpenses = [...unexpectedExpenses];
                    updatedExpenses[index].label = e.target.value;
                    setUnexpectedExpenses(updatedExpenses);
                  }}
                  placeholder="Label (e.g., Emergency)"
                />
              </td>
              <td>
                <input
                  type="number"
                  value={expense.amount === null || expense.amount === undefined ? '' : expense.amount / exchangeRate}
                  onChange={(e) => handleUnexpectedExpenseChange(index, e.target.value)}
                  placeholder="Enter amount"
                  step="0.01"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add Supplemental Income and Unexpected Expense Buttons */}
      <div className="buttons-container">
        <button onClick={addSupplementalIncome} className="add-supplemental-income">
          <FaPlus /> Add Supplemental Income
        </button>
        <button onClick={addUnexpectedExpense} className="add-unexpected-expense">
          <FaPlus /> Add Unexpected Expense
        </button>
      </div>

      {/* Savings Table */}
      <table className="savings-table">
        <thead>
          <tr>
            <th>Label</th>
            <th>Budgeted</th>
            <th>Actual</th>
            <th>Difference</th>
          </tr>
        </thead>
        <tbody>
          <tr className={
              actualSavings > dailyBudgetedSavings
                ? 'saved-more' // Green for saving more than expected
                : actualSavings < dailyBudgetedSavings
                ? 'overspent' // Red for saving less than expected
                : ''
            }>
            <td>Savings</td>
            <td>{currencySymbols[currency]}{dailyBudgetedSavings.toFixed(2)}</td>
            <td>{currencySymbols[currency]}{actualSavings.toFixed(2)}</td>
            <td>{currencySymbols[currency]}{savingsDifference.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* Donut Charts */}
      <div className="charts-container">
        <div className="chart">
          <h3>Budgeted Spending</h3>
          <Doughnut data={budgetedChartData} />
        </div>
        <div className="chart">
          <h3>Actual Spending</h3>
          <Doughnut data={actualSavingsChartData} />
        </div>
      </div>

      {/* Export Buttons */}
      <div className="export-buttons">
        <button onClick={handleExportCSV}>
          <FaFileExport /> Export to CSV
        </button>
        <button onClick={handleExportPDF}>
          <FaFileExport /> Export to PDF
        </button>
      </div>

      {/* Toast Container for Notifications */}
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default BudgetTable;