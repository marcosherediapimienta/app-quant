import './Select.css';

const Select = ({ 
  label, 
  value, 
  onChange, 
  options = [],
  error,
  helperText,
  fullWidth = false,
  ...props 
}) => {
  return (
    <div className={`input-group ${fullWidth ? 'input-full-width' : ''}`}>
      {label && (
        <label className="input-label">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        className={`input select-input ${error ? 'input-error' : ''} ${!value ? 'input-placeholder' : ''}`}
        {...props}
      >
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled === true}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="input-error-text">{error}</span>
      )}
      {helperText && !error && (
        <span className="input-helper-text">{helperText}</span>
      )}
    </div>
  );
};

export default Select;

