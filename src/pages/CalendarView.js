import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import DatePicker from 'react-datepicker';
import 'react-calendar/dist/Calendar.css';
import 'react-datepicker/dist/react-datepicker.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { enUS } from 'date-fns/locale';
import { useBudget } from '../BudgetContext';
import '../styles/Calendar.css';

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

    categories.forEach((category) => {
      if (category.schedule) {
        // Handle scheduled payments
        const { type, days, date } = category.schedule;
        if (type === 'recurring') {
          // Recurring payments (e.g., every Monday and Friday)
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.toLocaleString('en-US', { weekday: 'long' });
            if (days.includes(dayOfWeek)) {
              const dateKey = d.toDateString();
              dailyBudgets[dateKey] = dailyBudgets[dateKey] || { total: 0, categories: [] };
              dailyBudgets[dateKey].categories.push({
                label: category.label,
                expected: category.expected * exchangeRate,
                actual: (savedData[dateKey]?.find((row) => row.label === category.label)?.actual || 0) * exchangeRate,
                difference: category.expected * exchangeRate,
              });
              dailyBudgets[dateKey].total += category.expected * exchangeRate;
            }
          }
        } else if (type === 'one-time') {
          // One-time payments
          const dateKey = new Date(date).toDateString();
          if (new Date(date) >= startDate && new Date(date) <= endDate) {
            dailyBudgets[dateKey] = dailyBudgets[dateKey] || { total: 0, categories: [] };
            dailyBudgets[dateKey].categories.push({
              label: category.label,
              expected: category.expected * exchangeRate,
              actual: (savedData[dateKey]?.find((row) => row.label === category.label)?.actual || 0) * exchangeRate,
              difference: category.expected * exchangeRate,
            });
            dailyBudgets[dateKey].total += category.expected * exchangeRate;
          }
        }
      } else {
        // Default behavior: spread the budget evenly
        const daysInBudget = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const dailyAmount = (category.expected / daysInBudget) * exchangeRate;
        for (let i = 0; i < daysInBudget; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          const dateKey = date.toDateString();
          dailyBudgets[dateKey] = dailyBudgets[dateKey] || { total: 0, categories: [] };
          dailyBudgets[dateKey].categories.push({
            label: category.label,
            expected: dailyAmount,
            actual: (savedData[dateKey]?.find((row) => row.label === category.label)?.actual || 0) * exchangeRate,
            difference: dailyAmount,
          });
          dailyBudgets[dateKey].total += dailyAmount;
        }
      }
    });

    return dailyBudgets;
  }, [budgetData, exchangeRate]);

  // Handle date selection
  const handleDateChange = (date) => {
    setSelectedDate(date);
    const formattedDate = date.toDateString();
    const selectedDayData = dailyBudgets[formattedDate];
    if (selectedDayData) {
      navigate(`/day/${formattedDate}`, { state: { date: formattedDate, data: selectedDayData.categories } });
    } else {
      alert('No budget data available for this day.');
    }
  };

  // Safely handle budgetData being undefined
  if (!budgetData) {
    return (
      <div className="calendar-view">
        <h1>Budget Calendar</h1>
        <p>Error: No budget data available. Please complete setup first.</p>
        <button onClick={() => navigate('/budget')}>Go to Setup</button>
      </div>
    );
  }

  // Custom tile content for the calendar
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateKey = date.toDateString();
      if (dailyBudgets[dateKey]) {
        return (
          <div className="budget-display">
            <strong>Total:</strong> {currencySymbols[currency]}{dailyBudgets[dateKey].total.toFixed(2)}
          </div>
        );
      }
    }
    return null;
  };

  // Export data for the selected time range
  const exportTimeRangeData = (format) => {
    if (!startDate || !endDate) {
      alert('Please select a valid date range.');
      return;
    }

    const selectedData = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toDateString();
      if (dailyBudgets[dateKey]) {
        selectedData.push({
          date: dateKey,
          categories: dailyBudgets[dateKey].categories.map((row) => ({
            ...row,
            expected: row.expected.toFixed(2),
            actual: row.actual.toFixed(2),
            difference: row.difference.toFixed(2),
          })),
        });
      }
    }

    if (selectedData.length === 0) {
      alert('No data available for the selected date range.');
      return;
    }

    if (format === 'excel') {
      const workbook = XLSX.utils.book_new();
      selectedData.forEach((day) => {
        const worksheet = XLSX.utils.json_to_sheet(day.categories);
        XLSX.utils.book_append_sheet(workbook, worksheet, day.date);
      });
      XLSX.writeFile(workbook, `Budget_${startDate.toDateString()}_to_${endDate.toDateString()}.xlsx`);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      selectedData.forEach((day, index) => {
        if (index > 0) doc.addPage(); // Add a new page for each day
        doc.text(`Budget for ${day.date}`, 10, 10);
        autoTable(doc, {
          head: [['Label', 'Budgeted', 'Actual', 'Difference']],
          body: day.categories.map((row) => [
            row.label,
            `${currencySymbols[currency]}${row.expected}`,
            `${currencySymbols[currency]}${row.actual}`,
            `${currencySymbols[currency]}${row.difference}`,
          ]),
        });
      });
      doc.save(`Budget_${startDate.toDateString()}_to_${endDate.toDateString()}.pdf`);
    }
  };

  return (
    <div className="calendar-view">
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
        <button onClick={() => exportTimeRangeData('excel')}>Export to Excel</button>
        <button onClick={() => exportTimeRangeData('pdf')}>Export to PDF</button>
        <button
          onClick={() =>
            navigate('/summary', { state: { startDate, endDate } })
          }
        >
          View Summary
        </button>
      </div>
      <Calendar
        onClickDay={handleDateChange}
        value={selectedDate}
        tileContent={tileContent}
        locale={enUS}
        defaultView="month"
        defaultActiveStartDate={new Date(budgetData.startDate)}
        minDate={new Date(budgetData.startDate)}
        maxDate={new Date(budgetData.endDate)}
      />
      <button onClick={() => navigate('/budget')} className="back-button">
        Go Back to Setup
      </button>
    </div>
  );
};

export default CalendarView;