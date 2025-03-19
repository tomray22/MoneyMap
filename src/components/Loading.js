import React, { useState, useEffect } from 'react';
import '../styles/Loading.css';

const Loading = () => {
  const messages = [
    "Crunching numbers...",
    "Counting pennies...",
    "Balancing the books...",
    "You can wait a bit longer, right?...",
    "Plotting your financial future...",
    "Calculating your net worth...",
    "Preparing your budget masterpiece...",
    "Almost there...",
  ];

  // Initialize messageIndex with a random index
  const [messageIndex, setMessageIndex] = useState(Math.floor(Math.random() * messages.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000); // Change message every 3 seconds

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <p>{messages[messageIndex]}</p>
    </div>
  );
};

export default Loading;