import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import BudgetPage from './pages/BudgetPage';
import CalendarView from './pages/CalendarView';
import BudgetTable from './components/BudgetTable';
import './styles/App.css';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Define routes for different pages */}
        <Route
          path="/"
          element={
            <div className="home">
              <h1>Welcome to MoneyMap</h1>
              <p>
                MoneyMap is your personal budgeting companion. Plan your expenses, track your spending,
                and stay on top of your financial goals with ease.
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
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/day/:date" element={<BudgetTable />} />
      </Routes>
    </Router>
  );
};

export default App;