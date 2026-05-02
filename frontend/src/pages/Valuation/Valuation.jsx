import { useState, useEffect } from 'react';
import { valuationService } from '../../services/valuationService';
import { useAnalysis } from '../../hooks/useAnalysis';
import { parseTickers } from '../../utils/formatters';
import Loading from '../../components/Loading/Loading';
import ErrorMessage from '../../components/Error/Error';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Card from '../../components/Card/Card';
import Tabs from '../../components/Tabs/Tabs';
import ValuationResults from '../../components/Results/ValuationResults';
import './Valuation.css';

const DEFAULT_LOADING_MSG = 'Analyzing valuation…';

const SIGNALS_LOADING_MSG =
  'Generating signals';

const Valuation = () => {
  const [ticker, setTicker] = useState('');
  const [tickersInput, setTickersInput] = useState('');
  const [activeTab, setActiveTab] = useState('company');
  const [loadingMessage, setLoadingMessage] = useState(DEFAULT_LOADING_MSG);

  const analysis = useAnalysis();

  useEffect(() => {
    if (!analysis.loading) {
      analysis.reset();
      setLoadingMessage(DEFAULT_LOADING_MSG);
    }
  }, [activeTab]);

  const tabs = [
    { id: 'company', label: 'Company' },
    { id: 'compare', label: 'Compare' },
    { id: 'signals', label: 'Signals' },
  ];

  const handleAnalyzeCompany = () => {
    setLoadingMessage(DEFAULT_LOADING_MSG);
    return analysis.execute(() => valuationService.analyzeCompany(ticker));
  };

  const handleCompare = () => {
    const tickers = parseTickers(tickersInput);
    if (tickers.length === 0) return;
    setLoadingMessage(DEFAULT_LOADING_MSG);
    return analysis.execute(() => valuationService.compare(tickers));
  };

  const handleGenerateSignals = () => {
    const tickers = parseTickers(tickersInput);
    if (tickers.length === 0) return;
    setLoadingMessage(SIGNALS_LOADING_MSG);
    return analysis.execute(() => valuationService.generateSignals(tickers));
  };

  if (analysis.loading) {
    return <Loading message={loadingMessage} />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-icon">🏢</div>
        <h1 className="page-title">Valuation Analysis</h1>
        <p className="page-subtitle">
          Company valuation and investment signal generation based on multiple metrics
        </p>
      </div>

      {analysis.error && (
        <ErrorMessage message={analysis.error} onRetry={() => analysis.reset()} />
      )}

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="tab-content">
        {activeTab === 'company' && (
          <Card>
            <div className="analysis-section">
              <h2 className="section-title">Company Analysis</h2>
              <p className="section-description">
                Analyze valuation and fundamental metrics for an individual company.
              </p>
              <div className="form-grid">
                <Input
                  label="Ticker"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="Insert ticker..."
                  fullWidth
                />
              </div>
              <Button 
                onClick={handleAnalyzeCompany}
                variant="primary"
                size="lg"
                fullWidth
              >
                Analyze Company
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'compare' && (
          <Card>
            <div className="analysis-section">
              <h2 className="section-title">Company Comparison</h2>
              <p className="section-description">
                Compare multiple companies side-by-side using valuation and fundamental metrics.
              </p>
              <div className="form-grid">
                <Input
                  label="Tickers (comma-separated)"
                  value={tickersInput}
                  onChange={(e) => setTickersInput(e.target.value.toUpperCase())}
                  placeholder="Insert tickers..."
                  helperText="Example: AAPL, GOOGL, MSFT, AMZN"
                  fullWidth
                />
              </div>
              <Button 
                onClick={handleCompare}
                variant="primary"
                size="lg"
                fullWidth
              >
                Compare Companies
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'signals' && (
          <Card>
            <div className="analysis-section">
              <h2 className="section-title">Generate Recommendations</h2>
              <p className="section-description">
                Buy, hold, or sell recommendations from fundamentals and valuation. Each ticker triggers several Yahoo
                downloads; with many symbols the run can take several minutes.
              </p>
              <div className="form-grid">
                <Input
                  label="Tickers (comma-separated)"
                  value={tickersInput}
                  onChange={(e) => setTickersInput(e.target.value.toUpperCase())}
                  placeholder="Insert tickers..."
                  helperText="Example: AAPL, MSFT."
                  fullWidth
                />
              </div>
              <Button 
                onClick={handleGenerateSignals}
                variant="primary"
                size="lg"
                fullWidth
              >
                Generate Recommendations
              </Button>
            </div>
          </Card>
        )}
      </div>

      {analysis.result && (
        <div>
          <div className="result-header">
            <Button 
              onClick={() => analysis.reset()}
              variant="ghost"
              size="sm"
            >
              Clear
            </Button>
          </div>
          <ValuationResults data={analysis.result} />
        </div>
      )}
    </div>
  );
};

export default Valuation;
