import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useBudgetSetup from '../components/BudgetSetup';
import '../styles/BudgetPage.css'; // Import the stylesheet
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import { FaArrowLeft, FaArrowRight, FaInfoCircle } from 'react-icons/fa'; // Icons for navigation and hints

const BudgetPage = ({ currency, exchangeRate }) => {
  const {
    selectedTemplate,
    categories,
    ratios,
    dollarAmounts,
    totalBudget,
    setTotalBudget,
    timePeriod,
    customTimePeriod,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isSetupComplete,
    newCategory,
    setNewCategory,
    categorySettings,
    remainingBudget,
    incomeType,
    incomeData,
    setIncomeData,
    savingsGoalEnabled,
    setSavingsGoalEnabled,
    savingsGoalAmount,
    setSavingsGoalAmount,
    handleIncomeTypeChange,
    handlenetIncomeChange,
    handleTemplateClick,
    handleAddCategory,
    handleRemoveCategory,
    handleRatioChange,
    handleDollarAmountChange,
    handleTimePeriodChange,
    handleCustomTimePeriodChange,
    handleCategorySettingChange,
    handleCompleteSetup,
    currencySymbols,
    templates,
    hasSavedData,
  } = useBudgetSetup(currency, exchangeRate);

  const navigate = useNavigate();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // If setup is complete, navigate to CalendarView
  if (isSetupComplete) {
    navigate('/calendar');
  }

  // If there's saved data and the user selects "Continue Working", navigate to CalendarView
  if (incomeType === 'continue' && hasSavedData()) {
    navigate('/calendar');
  }

  // Function to go to the next step
  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Function to go to the previous step
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Information hints for each step
  const stepHints = {
    1: "Choose the type of budget you want to create. Select 'One-Time Budget' if you have a fixed amount, 'Expected Net Income' if you have regular income, or 'Continue Working' to resume an existing budget.",
    2: incomeType === 'one-time'
      ? "Enter the total amount of money you have to budget. This could be savings, a bonus, or any one-time amount."
      : "Enter your net income and how often you get paid. This helps calculate your monthly budget.",
    3: "Set a savings goal if you want to save a specific amount. The app will help you track your progress.",
    4: "Choose a template to get started quickly or create your own custom budget.",
    5: "Set the time period for your budget. Choose how long your budget will last (e.g., 1 week, 1 month).",
    6: "Assign amounts to each category. Use dollars ($) or percentages (%) to plan your spending. Add or remove categories as needed.",
  };

  return (
    <div className="budget-setup">
      <h2>Budget Setup</h2>

      {/* Information Hint */}
      <div className="info-hint">
        <FaInfoCircle /> {stepHints[currentStep]}
      </div>

      {/* Step 1: Budget Type */}
      {currentStep === 1 && (
        <div className="step">
          <h3>What type of budget do you have?</h3>
          <p className="hint">
            <strong>Hint:</strong> Choose the option that best fits your income. If your income changes often (like hourly pay), use <strong>One-Time Budget</strong>.
          </p>
          <div className="income-type-toggle">
            {/* One-Time Budget Option */}
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
                Use this if you have a single amount of money to budget (like savings or a bonus). <strong>Hourly workers:</strong> Use this for your minimum expected income.
              </p>
            </div>

            {/* net Income Option */}
            <div
              className={`income-option ${incomeType === 'net-income' ? 'selected' : ''}`}
              onClick={() => handleIncomeTypeChange('net-income')}
            >
              <label>
                <input
                  type="radio"
                  value="net-income"
                  checked={incomeType === 'net-income'}
                  onChange={() => handleIncomeTypeChange('net-income')}
                />
                Expected Net Income
              </label>
              <p className="option-description">
                Use this if you get paid regularly (like a salary).
              </p>
            </div>

            {/* Continue Working Option */}
            <div
              className={`income-option ${incomeType === 'continue' ? 'selected' : ''}`}
              onClick={() => handleIncomeTypeChange('continue')}
              style={{ opacity: hasSavedData() ? 1 : 0.5, pointerEvents: hasSavedData() ? 'auto' : 'none' }}
            >
              <label>
                <input
                  type="radio"
                  value="continue"
                  checked={incomeType === 'continue'}
                  onChange={() => handleIncomeTypeChange('continue')}
                  disabled={!hasSavedData()}
                />
                Continue Working
              </label>
              <p className="option-description">
                Continue working on your existing budget.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Budget Amount */}
      {currentStep === 2 && (
        <div className="step">
          <h3>{incomeType === 'one-time' ? 'Enter your total budget.' : 'Enter your net income details.'}</h3>
          <p className="hint">
            <strong>Hint:</strong> If you're an hourly worker, enter the <strong>minimum amount</strong> you expect to earn. You can track extra earnings later using <strong>Supplemental Income</strong>.
          </p>
          {incomeType === 'one-time' ? (
            <div className="budget-total">
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
            </div>
          ) : (
            <div className="net-income-form">
              <div className="net-income-input">
                <label>
                  Net Income:
                  <input
                    type="number"
                    value={incomeData.netIncome}
                    onChange={(e) => handlenetIncomeChange(e.target.value)}
                    placeholder="Enter net income"
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
        </div>
      )}

      {/* Step 3: Savings Goal */}
      {currentStep === 3 && (
        <div className="step">
          <h3>Do you have a savings goal?</h3>
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
        </div>
      )}

      {/* Step 4: Template Selection */}
      {currentStep === 4 && (
        <div className="step">
          <h3>Choose a template or create your own.</h3>
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
        </div>
      )}

      {/* Step 5: Time Period */}
      {currentStep === 5 && (
        <div className="step">
          <h3>How long will your budget last?</h3>
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
        </div>
      )}

      {/* Step 6: Assign Money */}
      {currentStep === 6 && (
        <div className="step">
          <h3>Assign amounts to each category.</h3>

          {/* Remaining Budget Display */}
          <div className="remaining-budget">
            <strong>Remaining Budget:</strong> {currencySymbols[currency]}{(remainingBudget * exchangeRate).toFixed(2)}
          </div>

          {/* Add Category Bar */}
          <div className="add-category">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter a new category"
            />
            <button onClick={handleAddCategory}>Add Category</button>
          </div>

          {/* Category List */}
          <ul>
            {categories
              .filter((category) => category !== 'Savings') // Exclude Savings from the main list
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
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        placeholder={
                          categorySettings[category].useDollarAmounts ? 'e.g., 50' : 'e.g., 20'
                        }
                        min="0"
                        max={categorySettings[category].useDollarAmounts ? undefined : 100}
                        title={categorySettings[category].useDollarAmounts ? 'Enter the dollar amount for this category.' : 'Enter the percentage of your budget for this category.'}
                      />
                      <span className="input-symbol">
                        {categorySettings[category].useDollarAmounts ? currencySymbols[currency] : '%'}
                      </span>
                    </div>
                  </div>

                  {/* Category Buttons */}
                  <div className="category-buttons">
                    {/* Toggle Between Dollars and Percentages */}
                    <button
                      onClick={() =>
                        handleCategorySettingChange(category, 'useDollarAmounts', !categorySettings[category].useDollarAmounts)
                      }
                    >
                      {categorySettings[category].useDollarAmounts ? 'Use %' : 'Use $'}
                    </button>

                    {/* Toggle Between Recurring and One-Time Payments */}
                    <button
                      onClick={() =>
                        handleCategorySettingChange(category, 'scheduleType', categorySettings[category].scheduleType === 'none' ? 'recurring' : 'none')
                      }
                    >
                      {categorySettings[category].scheduleType === 'none' ? 'Add Schedule' : 'Remove Schedule'}
                    </button>

                    {/* Delete Category Button */}
                    <button onClick={() => handleRemoveCategory(category)}>Delete</button>
                  </div>

                  {/* Recurring/One-Time Payment Options */}
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

            {/* Savings Display */}
            <li className="savings-display">
              <div className="category-header">
                <span>Savings</span>
                <div className="input-container">
                  <input
                    type="number"
                    value={remainingBudget.toFixed(2)}
                    readOnly
                    className="savings-input"
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

          {/* Complete Setup Button */}
          <button onClick={handleCompleteSetup} className="complete-setup">
            Complete Setup
          </button>
        </div>
      )}

      
      {/* Step Navigation */}
      <div className="step-navigation">
        <button onClick={prevStep} disabled={currentStep === 1}>
          <FaArrowLeft /> Back
        </button>
        <button onClick={nextStep} disabled={currentStep === 6}>
          Next <FaArrowRight />
        </button>
      </div>

      <ToastContainer />
    </div>
  );
};

export default BudgetPage;