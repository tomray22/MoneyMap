import React, { useState, useEffect } from 'react';
import '../styles/CurrencyConverter.css';

const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
  ];

const CurrencyConverter = ({ onCurrencyChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({});

  // Fetch exchange rates on component mount
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        setExchangeRates(data.rates);
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
      }
    };

    fetchExchangeRates();
  }, []);

  // Handle currency selection
  const handleCurrencyChange = (currency) => {
    setSelectedCurrency(currency);
    onCurrencyChange(currency, exchangeRates[currency]);
    setIsOpen(false);
  };

  return (
    <div className="currency-converter">
      <button className="hamburger-button" onClick={() => setIsOpen(!isOpen)}>
        ☰
      </button>
      {isOpen && (
        <div className="dropdown">
          <h3>Select Currency</h3>
            <ul>
                {currencies.map((currency) => (
                    <li key={currency.code} onClick={() => handleCurrencyChange(currency.code)}>
                    {currency.flag} {currency.name} ({currency.symbol})
                    </li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
};

export default CurrencyConverter;