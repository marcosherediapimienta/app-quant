import { useEffect, useMemo, useRef, useState } from 'react';
import './MultiSelect.css';

const MultiSelect = ({
  label,
  value = [],
  options = [],
  onChange,
  placeholder = 'Select...',
  helperText,
  fullWidth = false,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selectedSet = useMemo(() => new Set(value), [value]);
  const selectedLabels = useMemo(() => {
    const map = new Map(options.map(o => [o.value, o.label]));
    return value.map(v => map.get(v) || v);
  }, [options, value]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const toggleValue = (v) => {
    const next = new Set(value);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(Array.from(next));
  };

  const clearAll = () => onChange([]);
  const selectAll = () => onChange(Array.from(new Set(options.map(o => o.value))));

  return (
    <div ref={rootRef} className={`input-group multiselect-wrapper ${fullWidth ? 'input-full-width' : ''}`}>
      {label && <label className="input-label">{label}</label>}

      <button
        type="button"
        className="input multiselect-trigger"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className={`multiselect-trigger-text ${value.length === 0 ? 'placeholder' : ''}`}>
          {value.length === 0 ? placeholder : selectedLabels.join(', ')}
        </span>
        <span className="multiselect-caret">▾</span>
      </button>

      {open && (
        <div className="multiselect-popover">
          <div className="multiselect-actions">
            <button type="button" className="multiselect-action" onClick={selectAll}>
              Select all
            </button>
            <button type="button" className="multiselect-action" onClick={clearAll}>
              Clear all
            </button>
          </div>

          <div className="multiselect-options">
            {options.map((opt) => (
              <label key={opt.value} className="multiselect-option">
                <input
                  type="checkbox"
                  checked={selectedSet.has(opt.value)}
                  onChange={() => toggleValue(opt.value)}
                />
                <span className="multiselect-option-label">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {helperText && (
        <span className="input-helper-text">{helperText}</span>
      )}
    </div>
  );
};

export default MultiSelect;


