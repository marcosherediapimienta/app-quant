import './Input.css';

const Input = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
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
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && (
        <span className="input-error-text">{error}</span>
      )}
      {helperText && !error && (
        <span className="input-helper-text">{helperText}</span>
      )}
    </div>
  );
};

export default Input;

