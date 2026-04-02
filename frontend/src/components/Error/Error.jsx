import './Error.css';
import Button from '../Button/Button';

const Error = ({ message, onRetry }) => {
  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <h3 className="error-title">Error</h3>
      <p className="error-message">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="primary" size="md">
          Retry
        </Button>
      )}
    </div>
  );
};

export default Error;
