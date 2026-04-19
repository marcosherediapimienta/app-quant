import { useEffect, useState } from 'react';
import { portfolioService } from '../../services/portfolioService';
import { useAnalysis } from '../../hooks/useAnalysis';
import Loading from '../../components/Loading/Loading';
import Error from '../../components/Error/Error';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Select from '../../components/Select/Select';
import Card from '../../components/Card/Card';
import PortfolioResults from '../../components/Results/PortfolioResults';
import './Portfolio.css';
import { PORTFOLIO_INDEX_SELECT_OPTIONS } from '../../utils/benchmarkOptions';

const FALLBACK_INDEX_OPTIONS = PORTFOLIO_INDEX_SELECT_OPTIONS;

const Portfolio = () => {
  const [indexName, setIndexName] = useState('');
  const [indexOptions, setIndexOptions] = useState(FALLBACK_INDEX_OPTIONS);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectionMethod, setSelectionMethod] = useState('');
  const [weightMethod, setWeightMethod] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxCompanies, setMaxCompanies] = useState('');
  const [validationError, setValidationError] = useState(null);
  
  const analysis = useAnalysis();

  useEffect(() => {
    const loadIndices = async () => {
      try {
        const response = await portfolioService.getIndices();
        const options = response?.index_options || [];
        if (Array.isArray(options) && options.length > 0) {
          setIndexOptions([
            { value: '', label: 'Select reference index...', disabled: true },
            ...options,
          ]);
        }
      } catch (_e) {
      }
    };
    loadIndices();
  }, []);

  const handleAnalyze = async () => {
    if (!indexName) {
      setValidationError('Please select a reference index');
      return;
    }
    if (!selectionMethod) {
      setValidationError('Please select a selection method');
      return;
    }
    if (!weightMethod) {
      setValidationError('Please select a weighting method');
      return;
    }
    
    setValidationError(null);
    
    const config = {
      selection_method: selectionMethod,
      weight_method: weightMethod,
      min_score: parseFloat(minScore) || 60.0,
      max_companies: parseInt(maxCompanies) || 10,
    };
    await analysis.execute(() =>
      portfolioService.analyzeFromIndex(indexName, startDate || undefined, endDate || undefined, config)
    );
  };

  if (analysis.loading) return <Loading message="Building optimized portfolio..." />;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-icon">💼</div>
        <h1 className="page-title">Portfolio Configuration</h1>
        <p className="page-subtitle">
          Build optimized portfolios
        </p>
      </div>

      {(analysis.error || validationError) && (
        <Error 
          message={validationError || analysis.error} 
          onRetry={() => {
            setValidationError(null);
            analysis.reset();
          }} 
        />
      )}

      <Card className="form-card">
        <div className="analysis-section">
          <h2 className="section-title">Configuration Parameters</h2>
          <p className="section-description">
            Configure how you want your portfolio to be constructed. The system will analyze all constituents of the selected index and choose the best companies according to your criteria.
          </p>
          <div className="form-grid">
            <Select
              label="Reference Index"
              value={indexName}
              onChange={(e) => setIndexName(e.target.value)}
              options={indexOptions}
              fullWidth
            />
            <Select
              label="Selection Method"
              value={selectionMethod}
              onChange={(e) => setSelectionMethod(e.target.value)}
              options={[
                { value: '', label: 'Select selection method...', disabled: true },
                { value: 'balanced', label: 'Balanced - Equilibrium between valuation and growth' },
                { value: 'value', label: 'Value - Prioritizes undervalued companies' },
                { value: 'growth', label: 'Growth - Prioritizes high-growth companies' },
                { value: 'quality', label: 'Quality - Prioritizes profitability and financial health' },
                { value: 'total_score', label: 'Total Score - Best overall score' },
              ]}
              helperText="Criteria for selecting portfolio companies"
              fullWidth
            />
            <Select
              label="Weighting Method"
              value={weightMethod}
              onChange={(e) => setWeightMethod(e.target.value)}
              options={[
                { value: '', label: 'Select weighting method...', disabled: true },
                { value: 'equal', label: 'Equal Weight - Same weight for all companies' },
                { value: 'score', label: 'Score-Based - Weights proportional to score' },
                { value: 'score_risk_adjusted', label: 'Score/Risk - Score adjusted by volatility' },
                { value: 'markowitz', label: 'Markowitz - Sharpe Ratio optimization' },
                { value: 'black_litterman', label: 'Black-Litterman - Market equilibrium + investor views' },
              ]}
              helperText="Capital allocation method across selected companies"
              fullWidth
            />
            <Input
              label="Minimum Required Score"
              type="number"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              placeholder="60.0"
              helperText="Minimum quality score required for inclusion (0-100)"
              fullWidth
            />
            <Input
              label="Maximum Number of Companies"
              type="number"
              value={maxCompanies}
              onChange={(e) => setMaxCompanies(e.target.value)}
              placeholder="10"
              helperText="Maximum number of companies in the final portfolio"
              fullWidth
            />
            <Input
              label="Analysis Start Date (optional)"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              helperText="Start date for historical analysis (leave empty for defaults)"
              fullWidth
            />
            <Input
              label="Analysis End Date (optional)"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              helperText="End date for historical analysis (leave empty for defaults)"
              fullWidth
            />
          </div>
          <Button 
            onClick={handleAnalyze}
            variant="primary"
            size="lg"
            fullWidth
          >
            Build Optimized Portfolio
          </Button>
        </div>
      </Card>

      {analysis.result && (
        <div>
          <div className="result-header">
            <h2 className="result-title">Generated Portfolio</h2>
            <Button 
              onClick={() => analysis.reset()}
              variant="ghost"
              size="sm"
            >
              Clear
            </Button>
          </div>
          <PortfolioResults data={analysis.result} />
        </div>
      )}
    </div>
  );
};

export default Portfolio;
