import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
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
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // Success message state

  // Simulate loading for 2 seconds (e.g., fetching data)
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  // Handle currency change
  const handleCurrencyChange = (selectedCurrency, rate) => {
    setCurrency(selectedCurrency);
    setExchangeRate(rate);
    setShowSuccessMessage(true); // Show success message on currency change
    setTimeout(() => setShowSuccessMessage(false), 3000); // Hide message after 3 seconds
  };

  return (
    <BudgetProvider>
      <Router>
        {/* Loading Animation */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}
  
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="success-message">
            Currency updated to {currency} successfully!
          </div>
        )}
  
        {/* Main Content Wrapper */}
        <div className="main-content">
          {/* Header */}
          <header className="header">
            <h1>MoneyMap</h1>
          </header>
  
          {/* Routes */}
          <Routes>
            <Route
              path="/"
              element={
                <div className="home">
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
              }
            />
            <Route
              path="/budget"
              element={
                <>
                  <CurrencyConverter onCurrencyChange={handleCurrencyChange} />
                  <BudgetPage currency={currency} exchangeRate={exchangeRate} />
                </>
              }
            />
            <Route
              path="/calendar"
              element={
                <>
                  <CurrencyConverter onCurrencyChange={handleCurrencyChange} />
                  <CalendarView currency={currency} exchangeRate={exchangeRate} />
                </>
              }
            />
            <Route
              path="/day/:date"
              element={
                <>
                  <CurrencyConverter onCurrencyChange={handleCurrencyChange} />
                  <BudgetTable currency={currency} exchangeRate={exchangeRate} />
                </>
              }
            />
            <Route
              path="/summary"
              element={
                <>
                  <CurrencyConverter onCurrencyChange={handleCurrencyChange} />
                  <SummaryPage currency={currency} exchangeRate={exchangeRate} />
                </>
              }
            />
          </Routes>
        </div>
  
        {/* Footer */}
        <footer className="footer">
          <p>&copy; 2025 MoneyMap. All rights reserved.</p>
          <div className="footer-links">
          </div>
        </footer>
      </Router>
    </BudgetProvider>
  );
};

export default App;