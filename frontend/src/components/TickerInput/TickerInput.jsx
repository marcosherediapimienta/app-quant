import { useState, useRef, useEffect } from 'react';
import './TickerInput.css';

const TickerInput = ({
  label,
  value = [],
  onChange,
  placeholder = 'Type ticker and press Enter',
  helperText,
  fullWidth = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase();
    const cleaned = val.replace(/[^A-Z0-9,\s]/g, '');
    setInputValue(cleaned);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTicker();
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTicker(value.length - 1);
    }
  };

  const addTicker = () => {
    const trimmed = inputValue.replace(/,/g, '').trim();
    if (!trimmed) return;

    const tickers = trimmed.split(/[\s,]+/).filter(t => t.length > 0);
    
    const newTickers = [...value];
    tickers.forEach(ticker => {
      const upperTicker = ticker.toUpperCase().trim();
      if (upperTicker && /^[A-Z0-9]{1,5}$/.test(upperTicker)) {
        if (!newTickers.includes(upperTicker)) {
          newTickers.push(upperTicker);
        }
      }
    });
    
    onChange(newTickers);
    setInputValue('');
  };

  const removeTicker = (index) => {
    const newTickers = value.filter((_, i) => i !== index);
    onChange(newTickers);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const tickers = pastedText
      .toUpperCase()
      .split(/[\s,]+/)
      .filter(t => /^[A-Z0-9]{1,5}$/.test(t.trim()));
    
    const newTickers = [...new Set([...value, ...tickers])];
    onChange(newTickers);
    setInputValue('');
  };

  return (
    <div className={`input-group ticker-input-wrapper ${fullWidth ? 'input-full-width' : ''}`}>
      {label && <label className="input-label">{label}</label>}
      
      <div className="ticker-input-container">
        <div 
          className="ticker-chips"
          onClick={() => inputRef.current?.focus()}
        >
          {value.map((ticker, index) => (
            <span key={index} className="ticker-chip">
              {ticker}
              <button
                type="button"
                className="ticker-chip-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTicker(index);
                }}
                aria-label={`Remove ${ticker}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            className="ticker-input-field"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={value.length === 0 ? placeholder : ''}
            autoComplete="off"
          />
        </div>
      </div>

      {helperText && (
        <span className="input-helper-text">{helperText}</span>
      )}
    </div>
  );
};

export default TickerInput;

