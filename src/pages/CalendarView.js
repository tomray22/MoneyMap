import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import DatePicker from 'react-datepicker';
import 'react-calendar/dist/Calendar.css';
import 'react-datepicker/dist/react-datepicker.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { enUS } from 'date-fns/locale'; // Import the locale
import '../styles/Calendar.css';

const CalendarView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const budgetData = location.state?.budgetData;

  const [selectedDate, setSelectedDate] = useState(new Date(budgetData?.startDate || new Date())); // Set initial date to start date
  const [startDate, setStartDate] = useState(new Date(budgetData?.startDate || new Date())); // Set default to start date
  const [endDate, setEndDate] = useState(null);

  // Handle date selection
  const handleDateChange = (date) => {
    setSelectedDate(date);
    const formattedDate = date.toDateString();

    // Calculate daily budgets
    const dailyBudgets = getDailyBudgets();
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
        <button onClick={() => navigate('/')}>Go to Setup</button>
      </div>
    );
  }

  // Calculate daily budget for each category
  const getDailyBudgets = () => {
    const { timePeriod, categories, startDate } = budgetData;
    const daysInBudget = timePeriod || 30;
    const dailyBudgets = {};
  
    // Load saved data from localStorage
    const savedData = JSON.parse(localStorage.getItem('dailyData')) || {};
  
    categories.forEach((category) => {
      const dailyAmount = (category.expected / daysInBudget).toFixed(2);
      for (let i = 0; i < daysInBudget; i++) {
        const date = new Date(startDate); // Use the selected start date
        date.setDate(date.getDate() + i);
        const dateKey = date.toDateString();
  
        if (!dailyBudgets[dateKey]) {
          dailyBudgets[dateKey] = {
            total: 0,
            categories: [],
          };
        }
  
        // Merge saved data with budget data
        const savedDayData = savedData[dateKey];
        const savedCategory = savedDayData?.find((row) => row.label === category.label);
  
        dailyBudgets[dateKey].categories.push({
          label: category.label,
          expected: parseFloat(dailyAmount),
          actual: savedCategory?.actual || 0,
          difference: savedCategory?.difference || parseFloat(dailyAmount),
        });
  
        dailyBudgets[dateKey].total += parseFloat(dailyAmount);
      }
    });
  
    return dailyBudgets;
  };

  const dailyBudgets = getDailyBudgets();

  // Custom tile content for the calendar
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateKey = date.toDateString();
      if (dailyBudgets[dateKey]) {
        return (
          <div className="budget-display">
            <strong>Total:</strong> ${dailyBudgets[dateKey].total.toFixed(2)}
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
          categories: dailyBudgets[dateKey].categories,
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
          body: day.categories.map((row) => [row.label, `$${row.expected.toFixed(2)}`, `$${row.actual || '0.00'}`, `$${row.difference.toFixed(2)}`]),
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
            minDate={new Date(budgetData?.startDate)} // Ensure the start date cannot be before the budget start date
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
      </div>
      <Calendar
        onClickDay={handleDateChange}
        value={selectedDate}
        tileContent={tileContent}
        locale={enUS} // Set the locale to enUS (starts on Sunday)
        defaultView="month" // Set the default view to month
        defaultActiveStartDate={new Date(budgetData.startDate)} // Set the initial view to the start date
      />
      <button onClick={() => navigate('/')} className="back-button">
        Go Back to Setup
      </button>
    </div>
  );
};

export default CalendarView;