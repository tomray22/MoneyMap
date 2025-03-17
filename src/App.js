import React, { useState } from 'react';
import { HashRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { BudgetProvider } from './BudgetContext';
import BudgetPage from './pages/BudgetPage';
import CalendarView from './pages/CalendarView';
import BudgetTable from './components/BudgetTable';
import SummaryPage from './pages/SummaryPage';
import CurrencyConverter from './components/CurrencyConverter';
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
        {/* Currency Converter (fixed position) */}
        <CurrencyConverter onCurrencyChange={handleCurrencyChange} />

        <Routes>
          <Route
            path="/"
            element={
              <div className="home">
                {/* Main Content Wrapper */}
                <div className="main-content">
                  {/* Hero Section */}
                  <div className="hero">
                    <h1>Take Control of Your Finances</h1>
                    <p>
                      MoneyMap is your all-in-one budgeting tool designed to help you plan, track, and achieve your financial goals. Whether you're new to budgeting or a seasoned pro, MoneyMap makes it easy to manage your money.
                    </p>
                    <Link to="/budget">
                      <button className="start-button">Get Started</button>
                    </Link>
                  </div>

                  {/* Features Section */}
                  <div className="features">
                    <h2>Why Choose MoneyMap?</h2>
                    <div className="feature-cards">
                      <div className="feature-card">
                        <i className="fas fa-piggy-bank"></i>
                        <h3>Simple Budget Setup</h3>
                        <p>Create a budget in minutes with customizable categories and time periods. Perfect for beginners!</p>
                      </div>
                      <div className="feature-card">
                        <i className="fas fa-calendar-check"></i>
                        <h3>Daily Tracking</h3>
                        <p>Track your spending day by day with an interactive calendar. Stay on top of your finances effortlessly.</p>
                      </div>
                      <div className="feature-card">
                        <i className="fas fa-chart-line"></i>
                        <h3>Progress Insights</h3>
                        <p>See how much you've saved or spent compared to your budget. Visualize your progress with clear charts.</p>
                      </div>
                      <div className="feature-card">
                        <i className="fas fa-file-export"></i>
                        <h3>Export Your Data</h3>
                        <p>Export your budget and spending data to Excel or PDF for easy sharing and offline access.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <footer className="footer">
                  <p>&copy; 2023 MoneyMap. All rights reserved.</p>
                  <div className="footer-links">
                    <a href="/about">About</a>
                    <a href="/contact">Contact</a>
                    <a href="/privacy">Privacy Policy</a>
                  </div>
                </footer>
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