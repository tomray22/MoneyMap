import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useBudget } from '../BudgetContext';
import '../styles/SummaryPage.css';

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

const SummaryPage = ({ currency, exchangeRate }) => {
  const { budgetData } = useBudget();
  const location = useLocation();
  const navigate = useNavigate();

  // Get the selected date range from location state
  const { startDate: initialStartDate, endDate: initialEndDate } = location.state || {
    startDate: new Date(budgetData?.startDate || new Date()),
    endDate: new Date(budgetData?.endDate || new Date()),
  };

  const [startDate, setStartDate] = useState(new Date(initialStartDate));
  const [endDate, setEndDate] = useState(new Date(initialEndDate));

  // Calculate accumulated totals for the selected date range
  const calculateTotals = () => {
    const totals = { budgeted: 0, actual: 0, difference: 0, savings: 0 };
    const savedData = JSON.parse(localStorage.getItem('dailyData')) || {};

    // Calculate the total budgeted amount for the selected date range
    if (budgetData?.categories) {
      budgetData.categories.forEach((category) => {
        if (category.schedule) {
          // For scheduled payments, calculate the expected amount for the selected range
          const { type, frequency, interval, day, date: scheduledDate } = category.schedule;
          let expected = 0;

          if (type === 'recurring') {
            // Recurring payments with custom frequency and interval
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

              // Move to the next day
              currentDate.setDate(currentDate.getDate() + 1);
            }
          } else if (type === 'one-time') {
            // One-time payments
            if (new Date(scheduledDate) >= startDate && new Date(scheduledDate) <= endDate) {
              expected += category.expected;
            }
          }

          totals.budgeted += expected;
        } else {
          // For non-scheduled payments, calculate the proportion of the budget for the selected range
          const totalDaysInBudget = Math.ceil((new Date(budgetData.endDate) - new Date(budgetData.startDate)) / (1000 * 60 * 60 * 24));
          const daysInSelectedRange = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
          const proportion = daysInSelectedRange / totalDaysInBudget;
          totals.budgeted += category.expected * proportion;
        }
      });
    }

    // Calculate the total actual and difference amounts
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toDateString();
      if (savedData[dateKey]) {
        savedData[dateKey].rows.forEach((row) => {
          totals.budgeted += row.expected || 0;
          totals.actual += row.actual || 0;
          totals.difference += row.difference || 0;
        });

        // Add actualSavings to the totals
        totals.savings += savedData[dateKey].actualSavings || 0;
      }
    }

    return totals;
  };

  const totals = calculateTotals();

  // Export to CSV
  const exportToCSV = () => {
    const data = [
      {
        Label: 'Totals',
        Budgeted: `${currencySymbols[currency]}${(totals.budgeted * exchangeRate).toFixed(2)}`,
        Actual: `${currencySymbols[currency]}${(totals.actual * exchangeRate).toFixed(2)}`,
        Difference: `${currencySymbols[currency]}${(totals.difference * exchangeRate).toFixed(2)}`,
        Savings: `${currencySymbols[currency]}${(totals.savings * exchangeRate).toFixed(2)}`,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');
    XLSX.writeFile(workbook, `Summary_${startDate.toDateString()}_to_${endDate.toDateString()}.csv`);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Budget Summary (${startDate.toDateString()} to ${endDate.toDateString()})`, 10, 10);
    autoTable(doc, {
      head: [['Label', 'Budgeted', 'Actual', 'Difference', 'Savings']],
      body: [[
        'Totals',
        `${currencySymbols[currency]}${(totals.budgeted * exchangeRate).toFixed(2)}`,
        `${currencySymbols[currency]}${(totals.actual * exchangeRate).toFixed(2)}`,
        `${currencySymbols[currency]}${(totals.difference * exchangeRate).toFixed(2)}`,
        `${currencySymbols[currency]}${(totals.savings * exchangeRate).toFixed(2)}`,
      ]],
    });
    doc.save(`Summary_${startDate.toDateString()}_to_${endDate.toDateString()}.pdf`);
  };

  return (
    <div className="summary-page">
      <h1>Budget Summary</h1>
      <div className="date-range-display">
        <p>
          <strong>Date Range:</strong> {startDate.toDateString()} to {endDate.toDateString()}
        </p>
      </div>
      <div className="totals-display">
        <h2>Accumulated Totals</h2>
        <div className="totals-grid">
          <div className="totals-item">
            <span className="totals-label">Total Budgeted</span>
            <span className="totals-value">
              {currencySymbols[currency]}{(totals.budgeted * exchangeRate).toFixed(2)}
            </span>
          </div>
          <div className="totals-item">
            <span className="totals-label">Total Actual</span>
            <span className="totals-value">
              {currencySymbols[currency]}{(totals.actual * exchangeRate).toFixed(2)}
            </span>
          </div>
          <div className="totals-item">
            <span className="totals-label">Total Difference</span>
            <span className="totals-value">
              {currencySymbols[currency]}{(totals.difference * exchangeRate).toFixed(2)}
            </span>
          </div>
          <div className="totals-item">
            <span className="totals-label">Total Savings</span>
            <span className="totals-value">
              {currencySymbols[currency]}{(totals.savings * exchangeRate).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      <div className="export-buttons">
        <button onClick={exportToCSV}>Export to CSV</button>
        <button onClick={exportToPDF}>Export to PDF</button>
        <button onClick={() => navigate('/calendar')}>Back to Calendar</button>
      </div>
    </div>
  );
};

export default SummaryPage;