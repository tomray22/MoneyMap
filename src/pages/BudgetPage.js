import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useBudgetSetup from '../components/BudgetSetup';
import '../styles/BudgetPage.css'; // Import the stylesheet

const BudgetPage = ({ currency, exchangeRate }) => {
  const {
    selectedTemplate,
    categories,
    ratios,
    dollarAmounts,
    totalBudget,
    setTotalBudget, // Destructure this
    timePeriod,
    customTimePeriod,
    startDate,
    setStartDate, // Destructure this
    endDate,
    setEndDate, // Destructure this
    isSetupComplete,
    newCategory,
    setNewCategory, // Destructure this
    categorySettings,
    remainingBudget,
    incomeType,
    incomeData,
    setIncomeData, // Destructure this
    savingsGoalEnabled,
    setSavingsGoalEnabled, // Destructure this
    savingsGoalAmount,
    setSavingsGoalAmount, // Destructure this
    isDrawerOpen,
    handleIncomeTypeChange,
    handleGrossIncomeChange,
    handleImportJSON,
    handleTemplateClick,
    handleAddCategory,
    handleRemoveCategory,
    handleRatioChange,
    handleDollarAmountChange,
    handleTimePeriodChange,
    handleCustomTimePeriodChange,
    handleCategorySettingChange,
    handleCompleteSetup,
    toggleDrawer,
    currencySymbols,
    templates, // Destructure this
  } = useBudgetSetup(currency, exchangeRate);

  if (!isSetupComplete) {
    return (
      <div className="budget-setup">
        <h2>Budget Setup</h2>
        <div className="description">
          <p>Welcome to the Budget Setup page! Here, you can create a budget by selecting a template or creating a custom one. You can set your total budget, allocate funds to different categories, and specify the time period for your budget.</p>
        </div>

        {/* Income Type Toggle */}
        <h1 className="description">
          Select the type of budget you have
        </h1>
        <div className="income-type-toggle">
          <div
            className={`income-option ${incomeType === 'one-time' ? 'selected' : ''}`}
            onClick={() => handleIncomeTypeChange('one-time')}
          >
            <label>
              <input
                type="radio"
                value="one-time"
                checked={incomeType === 'one-time'}
                onChange={() => handleIncomeTypeChange('one-time')}
              />
              One-Time Budget
            </label>
            <p className="option-description">
              Use this if you have a single amount of money to budget (like savings or a bonus).
            </p>
          </div>

          <div
            className={`income-option ${incomeType === 'gross-income' ? 'selected' : ''}`}
            onClick={() => handleIncomeTypeChange('gross-income')}
          >
            <label>
              <input
                type="radio"
                value="gross-income"
                checked={incomeType === 'gross-income'}
                onChange={() => handleIncomeTypeChange('gross-income')}
              />
              Expected Gross Income
            </label>
            <p className="option-description">
              Use this if you get paid regularly (like a salary).
            </p>
          </div>

          <div
            className={`income-option ${incomeType === 'import' ? 'selected' : ''}`}
            onClick={() => handleIncomeTypeChange('import')}
          >
            <label>
              <input
                type="radio"
                value="import"
                checked={incomeType === 'import'}
                onChange={() => handleIncomeTypeChange('import')}
              />
              Load Previous Budget
            </label>
            <p className="option-description">
              Upload a file to load a budget you saved earlier.
            </p>
          </div>
        </div>

        {/* One-Time Budget Input */}
        {incomeType === 'one-time' && (
          <div className="budget-total">
            <h1 className="description">
              Enter the total amount of money you have to budget.
            </h1>
            <label>
              Total Budget:
              <input
                type="number"
                value={totalBudget || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setTotalBudget(value === '' ? '' : parseFloat(value) / exchangeRate);
                }}
                placeholder="Enter total budget"
                min="0"
              />
              <span>{currencySymbols[currency]}</span>
            </label>
            <p>
              Remaining Budget: {currencySymbols[currency]}{(remainingBudget * exchangeRate).toFixed(2)}
            </p>
          </div>
        )}

        {/* Gross Income Form */}
        {incomeType === 'gross-income' && (
          <div className="gross-income-form">
            <div className="gross-income-input">
              <label>
                Gross Income:
                <input
                  type="number"
                  value={incomeData.grossIncome}
                  onChange={(e) => handleGrossIncomeChange(e.target.value)}
                  placeholder="Enter gross income"
                  min="0"
                />
                <span>{currencySymbols[currency]}</span>
              </label>
            </div>
            <div className="income-interval-input">
              <label>
                Income Interval:
                <select
                  value={incomeData.incomeInterval}
                  onChange={(e) => setIncomeData({ ...incomeData, incomeInterval: e.target.value })}
                >
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="annually">Annually</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {/* Savings Goal Section */}
        <h1 className="description">
          Turn this on to set a savings target. The app will help you track your progress.
        </h1>
        <div className="savings-goal-section">
          <label>
            <input
              type="checkbox"
              checked={savingsGoalEnabled}
              onChange={(e) => setSavingsGoalEnabled(e.target.checked)}
            />
            Enable Savings Goal
          </label>
          {savingsGoalEnabled && (
            <div className="savings-goal-input">
              <label>
                Savings Goal Amount:
                <input
                  type="number"
                  value={savingsGoalAmount}
                  onChange={(e) => setSavingsGoalAmount(e.target.value)}
                  placeholder="Enter savings goal"
                  min="0"
                />
                <span>{currencySymbols[currency]}</span>
              </label>
            </div>
          )}
        </div>

        {/* Template Selection */}
        <h1 className="description">
          Choose a ready-made plan or create your own. Templates help you get started quickly.
        </h1>
        <div className="template-list">
          {templates.map((template) => (
            <div
              key={template.name}
              className={`template-item ${selectedTemplate?.name === template.name ? 'selected' : ''}`}
              onClick={() => handleTemplateClick(template)}
            >
              {template.name}
            </div>
          ))}
        </div>

        {/* Budget Setup Form */}
        {selectedTemplate && (
          <div className="ratio-form">
            <h3>{selectedTemplate.name} - Set Budget</h3>
            <p className="description">
              Assign amounts to each category. Use dollars ($) or percentages (%) to plan your spending.
            </p>
            <div className="time-period">
              <label>
                Time Period:
                <select value={timePeriod} onChange={handleTimePeriodChange}>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              <p className="description">
                Choose how long your budget will last (like 1 week or 1 month).
              </p>
              {timePeriod === 'custom' && (
                <label>
                  Custom Days:
                  <input
                    type="number"
                    value={customTimePeriod}
                    onChange={(e) => handleCustomTimePeriodChange(e)}
                    placeholder="Enter number of days"
                    min="1"
                  />
                </label>
              )}
            </div>
            <div className="start-date">
              <label>
                Start Date:
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  dateFormat="MM/dd/yyyy"
                />
              </label>
            </div>
            {timePeriod === 'custom' && (
              <div className="end-date">
                <label>
                  End Date:
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    dateFormat="MM/dd/yyyy"
                    minDate={startDate}
                  />
                </label>
              </div>
            )}
            <ul>
              {categories
                .filter((category) => category !== 'Savings') // Exclude savings from the main list
                .map((category) => (
                  <li key={category}>
                    <div className="category-header">
                      <span>{category}</span>
                      <div className="input-container">
                        <input
                          type="number"
                          value={
                            categorySettings[category].useDollarAmounts
                              ? dollarAmounts[category] === null || dollarAmounts[category] === undefined
                                ? ''
                                : dollarAmounts[category] * exchangeRate
                              : ratios[category] || ''
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            if (categorySettings[category].useDollarAmounts) {
                              handleDollarAmountChange(
                                category,
                                value === '' ? null : parseFloat(value) / exchangeRate
                              );
                            } else {
                              handleRatioChange(category, value);
                            }
                          }}
                          placeholder={
                            categorySettings[category].useDollarAmounts ? 'e.g., 50' : 'e.g., 20'
                          }
                          min="0"
                          max={categorySettings[category].useDollarAmounts ? undefined : 100}
                        />
                        <span className="input-symbol">
                          {categorySettings[category].useDollarAmounts ? currencySymbols[currency] : '%'}
                        </span>
                      </div>
                    </div>
                    <div className="category-buttons">
                      <button onClick={() => handleRemoveCategory(category)}>Remove</button>
                      <button
                        onClick={() =>
                          handleCategorySettingChange(category, 'useDollarAmounts', !categorySettings[category].useDollarAmounts)
                        }
                      >
                        {categorySettings[category].useDollarAmounts ? 'Use %' : 'Use $'}
                      </button>
                      <button
                        onClick={() =>
                          handleCategorySettingChange(category, 'scheduleType', categorySettings[category].scheduleType === 'none' ? 'recurring' : 'none')
                        }
                      >
                        {categorySettings[category].scheduleType === 'none' ? 'Add Schedule' : 'Remove Schedule'}
                      </button>
                    </div>
                    {categorySettings[category].scheduleType === 'recurring' && (
                      <div className="schedule-options">
                        {/* One-Time Payment Section */}
                        <div className="one-time-payment">
                          <label>
                            <input
                              type="checkbox"
                              checked={categorySettings[category].isOneTime}
                              onChange={(e) =>
                                handleCategorySettingChange(category, 'isOneTime', e.target.checked)
                              }
                            />
                            <span>One-Time Payment</span>
                          </label>
                          {categorySettings[category].isOneTime && (
                            <div className="one-time-date">
                              <DatePicker
                                selected={categorySettings[category].oneTimeDate}
                                onChange={(date) =>
                                  handleCategorySettingChange(category, 'oneTimeDate', date)
                                }
                                dateFormat="MM/dd/yyyy"
                                minDate={startDate}
                              />
                            </div>
                          )}
                        </div>

                        {/* Frequency and Day Section */}
                        {!categorySettings[category].isOneTime && (
                          <div className="recurring-options">
                            <div className="frequency-section">
                              <label>
                                Frequency:
                                <select
                                  value={categorySettings[category].frequency}
                                  onChange={(e) =>
                                    handleCategorySettingChange(category, 'frequency', e.target.value)
                                  }
                                >
                                  <option value="weekly">Weekly</option>
                                  <option value="bi-weekly">Bi-Weekly</option>
                                  <option value="monthly">Monthly</option>
                                  <option value="custom">Custom Interval</option>
                                </select>
                              </label>
                            </div>

                            {categorySettings[category].frequency === 'custom' && (
                              <div className="interval-section">
                                <label>
                                  Interval:
                                  <input
                                    type="number"
                                    value={categorySettings[category].interval || ''}
                                    onChange={(e) =>
                                      handleCategorySettingChange(category, 'interval', parseInt(e.target.value, 10))
                                    }
                                    placeholder="e.g., 2 (for every 2 weeks)"
                                    min="1"
                                  />
                                </label>
                              </div>
                            )}

                            <div className="day-section">
                              <label>
                                Day:
                                <select
                                  value={categorySettings[category].selectedDay}
                                  onChange={(e) =>
                                    handleCategorySettingChange(category, 'selectedDay', e.target.value)
                                  }
                                >
                                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                    <option key={day} value={day}>
                                      {day}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              <li>
                <div className="category-header">
                  <span>Savings</span>
                  <div className="input-container">
                    <input
                      type="number"
                      value={remainingBudget.toFixed(2)}
                      readOnly
                    />
                    <span className="input-symbol">{currencySymbols[currency]}</span>
                  </div>
                </div>
                {savingsGoalEnabled && (
                  <p className="savings-goal-info">
                    Goal: {currencySymbols[currency]}{savingsGoalAmount} (Remaining: {currencySymbols[currency]}{remainingBudget.toFixed(2)})
                  </p>
                )}
              </li>
            </ul>
            <div className="add-category">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter a new category"
              />
              <button onClick={handleAddCategory}>Add Category</button>
            </div>
            <button onClick={handleCompleteSetup} className="complete-setup">
              Complete Setup
            </button>
          </div>
        )}

        {/* Explanation Drawer */}
        <div className={`explanation-drawer ${isDrawerOpen ? 'open' : ''}`}>
          <button className="drawer-toggle" onClick={toggleDrawer}>
            {isDrawerOpen ? '<' : '?'}
          </button>
            <div className="drawer-content">
              <h4>How to Use This Page</h4>
              <p><strong>One-Time Budget:</strong> Use this if you have a single amount of money to budget (like savings or a bonus). You can also use it if your income changes often (like hourly pay).</p>
              <p><strong>Expected Gross Income:</strong> Use this if you get paid regularly (like a salary).</p>
              <p><strong>Income Interval:</strong> Choose how often you get paid (weekly, monthly, etc.).</p>
              <p><strong>Savings Goal:</strong> Turn this on to set a savings target. The app will help you track your progress.</p>
              <p><strong>Remaining Budget:</strong> This shows how much money is left after you assign amounts to your categories.</p>
              <p><strong>Templates:</strong> Choose a ready-made plan (like Travel or Daily Expenses) or create your own.</p>
              <p><strong>Categories:</strong> These are the things you spend money on (like food or rent). Add or remove them to fit your needs.</p>
              <p><strong>Use $:</strong> Switch between dollars ($) or percentages (%) to set your budget amounts.</p>
              <p><strong>Add Schedule:</strong> Plan when you’ll spend money on a category (like a one-time payment or every week).</p>
              <p><strong>Time Period:</strong> Choose how long your budget will last (like 1 week or 1 month).</p>
              <p><strong>Savings:</strong> This is the money left over after you’ve budgeted for everything else.</p>
            </div>
        </div>

        <ToastContainer />
      </div>
    );
  }

  return null;
};

export default BudgetPage;