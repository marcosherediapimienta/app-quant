import { useState } from 'react';
import { riskService } from '../../services/riskService';
import { useAnalysis } from '../../hooks/useAnalysis';
import { parseTickers } from '../../utils/formatters';
import { CAPM_BENCHMARK_SELECT_OPTIONS } from '../../utils/options';
import { yahooTickerToRiskBenchmarkKey } from '../../utils/benchmarkOptions';
import Loading from '../../components/Loading/Loading';
import Error from '../../components/Error/Error';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Select from '../../components/Select/Select';
import Card from '../../components/Card/Card';
import RiskDashboard from '../../components/Results/RiskDashboard';
import './Risk.css';

const Risk = () => {
  const [tickerInput, setTickerInput] = useState('');
  const [benchmarkName, setBenchmarkName] = useState('');
  const [riskFreeRate, setRiskFreeRate] = useState('');
  const [weightsInput, setWeightsInput] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const analysis = useAnalysis();

  const calculateWeights = (numAssets) => {
    if (weightsInput.trim()) {
      const weights = weightsInput.split(',').map(w => parseFloat(w.trim()));
      if (weights.length !== numAssets) {
        throw new Error(`Number of weights (${weights.length}) must match number of assets (${numAssets})`);
      }
      const sum = weights.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1.0) > 0.01) {
        throw new Error(`Weights must sum to 1.0 (current sum: ${sum})`);
      }
      return weights;
    }
    return null;
  };

  const handleAnalyzeComplete = async () => {
    try {
      const tickers = parseTickers(tickerInput);
      if (tickers.length === 0) {
        throw new Error('Please enter at least one ticker');
      }

      if (!benchmarkName?.trim()) {
        throw new Error('Please select a benchmark');
      }

      const riskBenchmarkKey = yahooTickerToRiskBenchmarkKey(benchmarkName);
      if (!riskBenchmarkKey) {
        throw new Error('Unsupported benchmark for risk analysis');
      }

      const weights = calculateWeights(tickers.length);
      const riskFreeRateValue = parseFloat(riskFreeRate);
      const confidenceLevelValue = parseFloat(confidenceLevel);

      if (isNaN(riskFreeRateValue)) {
        throw new Error('Risk-free rate must be a valid number');
      }

      if (isNaN(confidenceLevelValue) || confidenceLevelValue <= 0 || confidenceLevelValue >= 1) {
        throw new Error('Confidence level must be a number between 0 and 1');
      }

      await analysis.execute(() =>
        riskService.analyzeComplete(
          tickers, riskBenchmarkKey,
          startDate || undefined, endDate || undefined,
          weights, riskFreeRateValue, confidenceLevelValue
        )
      );
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error in handleAnalyzeComplete:', err);
    }
  };

  if (analysis.loading) {
    return <Loading message="Running comprehensive risk analysis..." />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-icon">🛡️</div>
        <h1 className="page-title">Risk Management</h1>
        <p className="page-subtitle">
          Measure and monitor the risk profile of your portfolio
        </p>
      </div>

      {analysis.error && (
        <Error message={analysis.error} onRetry={() => analysis.reset()} />
      )}

      <Card className="form-card">
        <div className="analysis-section">
          <h2 className="section-title">Analysis Configuration</h2>
          <p className="section-description">
            Configure parameters to run a comprehensive portfolio risk analysis.
          </p>
          <div className="form-grid">
            <Input
              label="Tickers (comma-separated)"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
              placeholder="Insert tickers..."
              helperText="Example: AAPL, GOOGL, MSFT, AMZN"
              fullWidth
            />
            <Select
              label="Benchmark"
              value={benchmarkName}
              onChange={(e) => setBenchmarkName(e.target.value)}
              options={CAPM_BENCHMARK_SELECT_OPTIONS}
              helperText="Reference index for comparison"
              fullWidth
            />
            <Input
              label="Risk-Free Rate (annualized)"
              type="number"
              step="0.001"
              value={riskFreeRate}
              onChange={(e) => setRiskFreeRate(e.target.value)}
              placeholder="0.03"
              helperText="Example: 0.03 for 3%"
              fullWidth
            />
            <Input
              label="Confidence Level (0-1)"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={confidenceLevel}
              onChange={(e) => setConfidenceLevel(e.target.value)}
              placeholder="0.95"
              helperText="For VaR/ES calculation (example: 0.95 for 95%)"
              fullWidth
            />
            <Input
              label="Weights (optional, comma-separated, must sum to 1.0)"
              value={weightsInput}
              onChange={(e) => setWeightsInput(e.target.value)}
              placeholder="0.33,0.33,0.34 (leave empty for equal weights)"
              helperText="If empty, equal weights will be used automatically"
              fullWidth
            />
            <Input
              label="Start Date (optional)"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              helperText="Leave empty for default values"
              fullWidth
            />
            <Input
              label="End Date (optional)"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              helperText="Leave empty for default values"
              fullWidth
            />
          </div>
          <Button 
            onClick={handleAnalyzeComplete}
            variant="primary"
            size="lg"
            fullWidth
          >
            Run Comprehensive Analysis
          </Button>
        </div>
      </Card>

      {analysis.result && (
        <div>
          <div className="result-header">
            <h2 className="result-title">Results Dashboard</h2>
            <Button 
              onClick={() => analysis.reset()}
              variant="ghost"
              size="sm"
            >
              Clear
            </Button>
          </div>
          <RiskDashboard data={analysis.result} />
        </div>
      )}
    </div>
  );
};

export default Risk;
