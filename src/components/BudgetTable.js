import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useBudget } from '../BudgetContext'; // Import useBudget
import '../styles/BudgetTable.css';

const BudgetTable = () => {
  const { date } = useParams(); // Get date from URL params
  const { budgetData } = useBudget(); // Access budgetData from context
  const [rows, setRows] = useState([]);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('dailyData')) || {};
    if (savedData[date]) {
      // Use saved data for the selected date
      setRows(savedData[date]);
    } else if (budgetData?.categories) {
      // If no saved data exists, calculate the daily budget allocation
      const daysInBudget = Math.ceil((new Date(budgetData.endDate) - new Date(budgetData.startDate)) / (1000 * 60 * 60 * 24));
      const initialRows = budgetData.categories
        .filter((category) => {
          if (category.schedule) {
            const { type, days, date: scheduledDate } = category.schedule;
            if (type === 'recurring') {
              const dayOfWeek = new Date(date).toLocaleString('en-US', { weekday: 'long' });
              return days.includes(dayOfWeek);
            } else if (type === 'one-time') {
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
            expected = category.expected;
          } else {
            // For non-scheduled payments, spread the budget evenly
            expected = (category.expected / daysInBudget).toFixed(2);
          }
          return {
            label: category.label,
            expected: parseFloat(expected),
            actual: 0,
            difference: parseFloat(expected),
          };
        });
      setRows(initialRows);
    }
  }, [date, budgetData]);

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
    updatedRows[index].actual = actualValue;
    updatedRows[index].difference = updatedRows[index].expected - actualValue;
    setRows(updatedRows);
  };

  // Export to Excel
  const exportToExcel = () => {
    if (rows.length === 0) {
      alert('No data available to export.');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Budget');
    XLSX.writeFile(workbook, `Budget_${date}.xlsx`);
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
      body: rows.map((row) => [row.label, `$${row.expected.toFixed(2)}`, `$${row.actual || '0.00'}`, `$${row.difference.toFixed(2)}`]),
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
              <td>${row.expected.toFixed(2)}</td>
              <td>
                <input
                  type="number"
                  value={row.actual || ''}
                  onChange={(e) => handleActualChange(index, parseFloat(e.target.value))}
                  placeholder="Enter actual"
                />
              </td>
              <td>${row.difference ? row.difference.toFixed(2) : row.expected.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="export-buttons">
        <button onClick={exportToExcel}>Export to Excel</button>
        <button onClick={exportToPDF}>Export to PDF</button>
      </div>
    </div>
  );
};

export default BudgetTable;