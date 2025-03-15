import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useBudget } from '../BudgetContext';
import '../styles/BudgetTable.css';

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
  const { budgetData } = useBudget(); // Access budgetData from context
  const [rows, setRows] = useState([]);

  // Calculate totals for the table
  const totals = rows.reduce(
    (acc, row) => ({
      budgeted: acc.budgeted + row.expected,
      actual: acc.actual + (row.actual || 0),
      difference: acc.difference + row.difference,
    }),
    { budgeted: 0, actual: 0, difference: 0 }
  );

  // Load saved data from localStorage and recalculate rows when currency or exchangeRate changes
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('dailyData')) || {};
    if (savedData[date]) {
      // Use saved data for the selected date
      const updatedRows = savedData[date].map((row) => ({
        ...row,
        expected: row.expected * exchangeRate,
        actual: row.actual * exchangeRate,
        difference: row.difference * exchangeRate,
      }));
      setRows(updatedRows);
    } else if (budgetData?.categories) {
      // If no saved data exists, calculate the daily budget allocation
      const daysInBudget = Math.ceil((new Date(budgetData.endDate) - new Date(budgetData.startDate)) / (1000 * 60 * 60 * 24));
      const selectedDateObj = new Date(date);

      const initialRows = budgetData.categories
        .filter((category) => {
          if (category.schedule) {
            const { type, frequency, interval, day, date: scheduledDate } = category.schedule;

            if (type === 'recurring') {
              // Recurring payments with custom frequency and interval
              let isScheduled = false;
              if (frequency === 'weekly') {
                const dayOfWeek = selectedDateObj.toLocaleString('en-US', { weekday: 'long' });
                isScheduled = dayOfWeek === day;
              } else if (frequency === 'bi-weekly') {
                const dayOfWeek = selectedDateObj.toLocaleString('en-US', { weekday: 'long' });
                const weeksSinceStart = Math.floor((selectedDateObj - new Date(budgetData.startDate)) / (1000 * 60 * 60 * 24 * 7));
                isScheduled = dayOfWeek === day && weeksSinceStart % 2 === 0;
              } else if (frequency === 'monthly') {
                const dayOfMonth = selectedDateObj.getDate();
                isScheduled = dayOfMonth === parseInt(day, 10);
              } else if (frequency === 'custom') {
                const daysSinceStart = Math.floor((selectedDateObj - new Date(budgetData.startDate)) / (1000 * 60 * 60 * 24));
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
  }, [date, budgetData, exchangeRate, currency]); // Add currency and exchangeRate to dependencies

  // Save data to localStorage whenever rows change
  useEffect(() => {
    if (rows.length > 0) {
      const savedData = JSON.parse(localStorage.getItem('dailyData')) || {};
      savedData[date] = rows;
      localStorage.setItem('dailyData', JSON.stringify(savedData));
    }
  }, [rows, date]);

  // Handle changes to the "Actual" column
  const handleActualChange = (index, value) => {
    const updatedRows = [...rows];
    const actualValue = isNaN(value) ? 0 : parseFloat(value); // Validate input
    updatedRows[index].actual = actualValue * exchangeRate;
    updatedRows[index].difference = updatedRows[index].expected - (actualValue * exchangeRate);
    setRows(updatedRows);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (rows.length === 0) {
      alert('No data available to export.');
      return;
    }

    const data = rows.map((row) => ({
      Label: row.label,
      Budgeted: `${currencySymbols[currency]}${row.expected.toFixed(2)}`,
      Actual: `${currencySymbols[currency]}${(row.actual || 0).toFixed(2)}`,
      Difference: `${currencySymbols[currency]}${row.difference.toFixed(2)}`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Budget');
    XLSX.writeFile(workbook, `Budget_${date}.csv`);
  };

  // Export to PDF
  const exportToPDF = () => {
    if (rows.length === 0) {
      alert('No data available to export.');
      return;
    }
    const doc = new jsPDF();
    doc.text(`Budget for ${date}`, 10, 10);
    autoTable(doc, {
      head: [['Label', 'Budgeted', 'Actual', 'Difference']],
      body: rows.map((row) => [
        row.label,
        `${currencySymbols[currency]}${row.expected.toFixed(2)}`,
        `${currencySymbols[currency]}${(row.actual || 0).toFixed(2)}`,
        `${currencySymbols[currency]}${row.difference.toFixed(2)}`,
      ]),
    });
    doc.save(`Budget_${date}.pdf`);
  };

  if (!rows || rows.length === 0) {
    return <div>No data available for this day.</div>;
  }

  return (
    <div>
      {date && <h1>Budget for {date}</h1>}
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
            <tr key={index}>
              <td>{row.label}</td>
              <td>{currencySymbols[currency]}{row.expected.toFixed(2)}</td>
              <td>
                <input
                  type="number"
                  value={row.actual === undefined ? '' : (row.actual / exchangeRate).toFixed(2)}
                  onChange={(e) => handleActualChange(index, parseFloat(e.target.value))}
                  placeholder="Enter actual"
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
      <div className="export-buttons">
        <button onClick={exportToCSV}>Export to CSV</button>
        <button onClick={exportToPDF}>Export to PDF</button>
      </div>
    </div>
  );
};

export default BudgetTable;