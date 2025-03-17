import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper function to format currency values
const formatCurrency = (value, currencySymbol) => {
  return `${currencySymbol}${value.toFixed(2)}`;
};

export const exportToCSV = (data, fileName) => {
    const workbook = XLSX.utils.book_new();
  
    // Add totals sheet
    const totalsSheet = XLSX.utils.json_to_sheet([
      {
        Label: 'Totals',
        Budgeted: data.totals.budgeted,
        Actual: data.totals.actual,
        Difference: data.totals.difference,
        Savings: data.totals.savings,
        UnexpectedExpenses: data.totals.unexpectedExpenses,
      },
    ]);
    XLSX.utils.book_append_sheet(workbook, totalsSheet, 'Totals');
  
    // Add daily data sheets
    data.dailyData.forEach((day) => {
      const worksheetData = [
        ...day.rows,
        {
          Label: 'Savings',
          Budgeted: day.savings,
          Actual: day.savings,
          Difference: 0,
        },
        ...day.supplementalIncomes,
        ...day.unexpectedExpenses,
      ];
  
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, day.date);
    });
  
    XLSX.writeFile(workbook, `${fileName}.csv`);
  };

  export const exportToPDF = (data, fileName, currencySymbol) => {
    const doc = new jsPDF();
  
    // Set initial y-position
    let yPos = 10;
  
    // Add totals table
    doc.text(`Totals for ${fileName}`, 10, yPos);
    yPos += 10; // Move down after adding text
  
    autoTable(doc, {
      startY: yPos,
      head: [['Label', 'Budgeted', 'Actual', 'Difference', 'Savings', 'Unexpected Expenses']],
      body: [
        [
          'Totals',
          formatCurrency(data.totals.budgeted || 0, currencySymbol),
          formatCurrency(data.totals.actual || 0, currencySymbol),
          formatCurrency(data.totals.difference || 0, currencySymbol),
          formatCurrency(data.totals.savings || 0, currencySymbol),
          formatCurrency(data.totals.unexpectedExpenses || 0, currencySymbol),
        ],
      ],
    });
  
    // Update y-position after the totals table
    yPos = doc.lastAutoTable.finalY + 10;
  
    // Add daily data tables
    data.dailyData.forEach((day, index) => {
      if (index > 0) {
        doc.addPage(); // Add a new page for each day
        yPos = 10; // Reset y-position for the new page
      }
  
      // Add daily budget table
      doc.text(`Budget for ${day.date}`, 10, yPos);
      yPos += 10; // Move down after adding text
  
      autoTable(doc, {
        startY: yPos,
        head: [['Label', 'Budgeted', 'Actual', 'Difference']],
        body: [
          ...day.rows.map((row) => [
            row.label,
            formatCurrency(row.expected || 0, currencySymbol),
            formatCurrency(row.actual || 0, currencySymbol),
            formatCurrency(row.difference || 0, currencySymbol),
          ]),
          [
            'Savings',
            formatCurrency(day.savings || 0, currencySymbol),
            formatCurrency(day.savings || 0, currencySymbol),
            formatCurrency(0, currencySymbol),
          ],
        ],
      });
  
      // Update y-position after the daily budget table
      yPos = doc.lastAutoTable.finalY + 10;
  
      // Add supplemental income and unexpected expenses table
      doc.text('Supplemental Income and Unexpected Expenses', 10, yPos);
      yPos += 10; // Move down after adding text
  
      autoTable(doc, {
        startY: yPos,
        head: [['Label', 'Amount']],
        body: [
          ...day.supplementalIncomes.map((income) => [
            income.label,
            formatCurrency(income.amount || 0, currencySymbol),
          ]),
          ...day.unexpectedExpenses.map((expense) => [
            expense.label,
            formatCurrency(expense.amount || 0, currencySymbol),
          ]),
        ],
      });
  
      // Update y-position after the supplemental income and unexpected expenses table
      yPos = doc.lastAutoTable.finalY + 10;
    });
  
    // Save the PDF
    doc.save(`${fileName}.pdf`);
  };