import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/BudgetTable.css';

const BudgetTable = () => {
  const location = useLocation();
  const { date, data } = location.state || {};
  const [rows, setRows] = useState([]);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('dailyData')) || {};
    console.log('Loaded savedData:', savedData); // Debugging log

    if (savedData[date]) {
      console.log('Data for this date:', savedData[date]); // Debugging log
      setRows(savedData[date]);
    } else if (data) {
      // If no saved data exists, use the initial data
      console.log('Using initial data:', data); // Debugging log
      setRows(data);
    }
  }, [date, data]);

  // Save data to localStorage whenever rows change
  useEffect(() => {
    if (rows.length > 0) {
      const savedData = JSON.parse(localStorage.getItem('dailyData')) || {};
      savedData[date] = rows;
      console.log('Saving data for this date:', savedData[date]); // Debugging log
      localStorage.setItem('dailyData', JSON.stringify(savedData));
    }
  }, [rows, date]);

  // Handle changes to the "Actual" column
  const handleActualChange = (index, value) => {
    const updatedRows = [...rows];
    updatedRows[index].actual = value;
    updatedRows[index].difference = updatedRows[index].expected - value;
    setRows(updatedRows);
  };

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Budget');
    XLSX.writeFile(workbook, `Budget_${date}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
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
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1em' }}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>Label</th>
            <th style={tableHeaderStyle}>Budgeted</th>
            <th style={tableHeaderStyle}>Actual</th>
            <th style={tableHeaderStyle}>Difference</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td style={tableCellStyle}>{row.label}</td>
              <td style={tableCellStyle}>${row.expected.toFixed(2)}</td>
              <td style={tableCellStyle}>
                <input
                  type="number"
                  value={row.actual || ''}
                  onChange={(e) => handleActualChange(index, parseFloat(e.target.value))}
                  style={inputStyle}
                  placeholder="Enter actual"
                />
              </td>
              <td style={tableCellStyle}>
                ${row.difference ? row.difference.toFixed(2) : row.expected.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '1em' }}>
        <button onClick={exportToExcel}>Export to Excel</button>
        <button onClick={exportToPDF}>Export to PDF</button>
      </div>
    </div>
  );
};

// Styles (same as before)
const tableHeaderStyle = {
  border: '1px solid #ddd',
  padding: '8px',
  textAlign: 'left',
  backgroundColor: '#f2f2f2',
};

const tableCellStyle = {
  border: '1px solid #ddd',
  padding: '8px',
};

const inputStyle = {
  width: '100%',
  padding: '4px',
  boxSizing: 'border-box',
};

export default BudgetTable;