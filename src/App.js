import React, { useState } from 'react';
import { HashRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { BudgetProvider } from './BudgetContext';
import BudgetPage from './pages/BudgetPage';
import CalendarView from './pages/CalendarView';
import BudgetTable from './components/BudgetTable';
import SummaryPage from './pages/SummaryPage';
import CurrencyConverter from './components/CurrencyConverter'; // Import the new component
import './styles/App.css';

const App = () => {
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1);

  // Handle currency change
  const handleCurrencyChange = (selectedCurrency, rate) => {
    setCurrency(selectedCurrency);
    setExchangeRate(rate);
  };

  return (
    <BudgetProvider>
      <Router>
        <CurrencyConverter onCurrencyChange={handleCurrencyChange} />
        <Routes>
          <Route
            path="/"
            element={
              <div className="home">
                <h1>Welcome to MoneyMap</h1>
                <p>
                  MoneyMap is your personal budgeting companion. Plan your expenses, track your
                  spending, and stay on top of your financial goals with ease.
                </p>
                <div className="features">
                  <h2>Features:</h2>
                  <ul>
                    <li>Set up a budget with custom categories and time periods.</li>
                    <li>Track your daily spending with an interactive calendar.</li>
                    <li>Export your budget data to Excel or PDF.</li>
                  </ul>
                </div>
                <Link to="/budget">
                  <button className="start-button">Start Budget Setup</button>
                </Link>
              </div>
            }
          />
          <Route path="/budget" element={<BudgetPage currency={currency} exchangeRate={exchangeRate} />} />
          <Route path="/calendar" element={<CalendarView currency={currency} exchangeRate={exchangeRate} />} />
          <Route path="/day/:date" element={<BudgetTable currency={currency} exchangeRate={exchangeRate} />} />
          <Route path="/summary" element={<SummaryPage currency={currency} exchangeRate={exchangeRate} />} />
        </Routes>
      </Router>
    </BudgetProvider>
  );
};

export default App;