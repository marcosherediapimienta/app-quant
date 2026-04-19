import { useState } from 'react';
import { capmService } from '../../services/capmService';
import { useDataDownload } from '../../hooks/useDataDownload';
import { useAnalysis } from '../../hooks/useAnalysis';
import { parseTickers, formatReturnsForAPI } from '../../utils/formatters';
import { CAPM_BENCHMARK_SELECT_OPTIONS } from '../../utils/options';
import Loading from '../../components/Loading/Loading';
import ErrorDisplay from '../../components/Error/Error';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Select from '../../components/Select/Select';
import Card from '../../components/Card/Card';
import Tabs from '../../components/Tabs/Tabs';
import CAPMResults from '../../components/Results/CAPMResults';
import './CAPM.css';

const CAPM = () => {
  const [activeTab, setActiveTab] = useState('analyze');
  const [assetTicker, setAssetTicker] = useState('');
  const [marketTicker, setMarketTicker] = useState('');
  const [multiAssetTickers, setMultiAssetTickers] = useState('');
  const [riskFreeRate, setRiskFreeRate] = useState('');
  const [nPoints, setNPoints] = useState('50');
  const [allowShort, setAllowShort] = useState(false);
  
  const dataDownload = useDataDownload();
  const analysis = useAnalysis();

  const tabs = [
    { id: 'analyze', label: 'Single Asset' },
    { id: 'multi', label: 'Multi-Asset' },
    { id: 'optimize', label: 'Optimize' },
  ];

  const handleDownloadAssetData = async (ticker) => {
    const returnsData = await dataDownload.downloadTickers(
      [ticker],
      { type: 'returns' }
    );
    return formatReturnsForAPI(returnsData);
  };

  const handleDownloadMarketData = async (ticker) => {
    const returnsData = await dataDownload.downloadTickers(
      [ticker],
      { type: 'returns' }
    );
    const formatted = formatReturnsForAPI(returnsData);
    const marketReturns = {};
    for (const [date, value] of Object.entries(formatted)) {
      if (typeof value === 'object' && value !== null) {
        marketReturns[date] = Object.values(value)[0];
      } else {
        marketReturns[date] = value;
      }
    }
    return marketReturns;
  };

  const convertReturnsToArray = (returns) => {
    const sortedDates = Object.keys(returns).sort();
    return sortedDates.map(date => {
      const dateData = returns[date];
      if (typeof dateData === 'object' && dateData !== null && !Array.isArray(dateData)) {
        return Object.values(dateData)[0];
      }
      return dateData;
    }).filter(val => val !== undefined && val !== null);
  };

  const validateRiskFreeRate = () => {
    if (!riskFreeRate || riskFreeRate.trim() === '') {
      throw new Error('Please enter a risk-free rate');
    }
    const value = parseFloat(riskFreeRate);
    if (isNaN(value)) {
      throw new Error('Risk-free rate must be a valid number');
    }
    return value;
  };

  const requireMarket = () => {
    if (!marketTicker || !marketTicker.trim()) {
      throw new Error('Please select a market ticker (benchmark)');
    }
  };

  const handleAnalyze = async () => {
    if (!assetTicker || !assetTicker.trim()) {
      throw new Error('Please enter an asset ticker');
    }
    requireMarket();
    const riskFreeRateValue = validateRiskFreeRate();

    const assetReturns = await handleDownloadAssetData(assetTicker);
    const marketReturns = await handleDownloadMarketData(marketTicker);

    const assetArray = convertReturnsToArray(assetReturns);
    const marketArray = convertReturnsToArray(marketReturns);

    await analysis.execute(() =>
      capmService.analyze(assetArray, marketArray, riskFreeRateValue, marketTicker)
    );
  };

  const parseAndValidateTickers = () => {
    if (!multiAssetTickers || !multiAssetTickers.trim()) {
      throw new Error('Please enter at least one ticker');
    }
    const tickers = parseTickers(multiAssetTickers);
    if (tickers.length === 0) {
      throw new Error('Please enter at least one ticker');
    }
    return tickers;
  };

  const handleMultiAsset = async () => {
    const tickers = parseAndValidateTickers();
    requireMarket();
    const riskFreeRateValue = validateRiskFreeRate();

    const returns = await dataDownload.downloadTickers(tickers, { type: 'returns' });
    const marketReturns = await handleDownloadMarketData(marketTicker);
    const returnsFormatted = formatReturnsForAPI(returns);

    await analysis.execute(() =>
      capmService.multiAsset(returnsFormatted, marketReturns, riskFreeRateValue, marketTicker)
    );
  };

  const handleOptimize = async () => {
    const tickers = parseAndValidateTickers();
    const riskFreeRateValue = validateRiskFreeRate();

    const nPointsValue = parseInt(nPoints);
    if (isNaN(nPointsValue) || nPointsValue < 10) {
      throw new Error('Number of points must be at least 10');
    }

    const returns = await dataDownload.downloadTickers(tickers, { type: 'returns' });
    const returnsFormatted = formatReturnsForAPI(returns);

    await analysis.execute(() =>
      capmService.optimize(returnsFormatted, riskFreeRateValue, nPointsValue, allowShort)
    );
  };


  if (dataDownload.loading || analysis.loading) {
    return <Loading message="Downloading data and analyzing CAPM..." />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-icon">📈</div>
        <h1 className="page-title">CAPM Analysis</h1>
        <p className="page-subtitle">
          Capital Asset Pricing Model for systematic risk-return analysis
        </p>
      </div>

      {analysis.error && (
        <ErrorDisplay message={analysis.error} onRetry={() => analysis.reset()} />
      )}

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="tab-content">
        {activeTab === 'analyze' && (
          <Card>
            <div className="analysis-section">
              <h2 className="section-title">Single Asset Analysis</h2>
              <p className="section-description">
                Analyze the relationship between an individual asset and the market using CAPM.
              </p>
              <div className="form-grid">
                <Input
                  label="Asset Ticker"
                  value={assetTicker}
                  onChange={(e) => setAssetTicker(e.target.value.toUpperCase())}
                  placeholder="Insert ticker..."
                  fullWidth
                />
                <Select
                  label="Benchmark"
                  value={marketTicker}
                  onChange={(e) => setMarketTicker(e.target.value)}
                  options={CAPM_BENCHMARK_SELECT_OPTIONS}
                  fullWidth
                />
                <Input
                  label="Risk-Free Rate (annualized)"
                  type="number"
                  step="0.001"
                  value={riskFreeRate}
                  onChange={(e) => setRiskFreeRate(e.target.value)}
                  placeholder="0.03"
                  fullWidth
                />
              </div>
              <Button 
                onClick={handleAnalyze}
                variant="primary"
                size="lg"
                fullWidth
              >
                Analyze CAPM
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'multi' && (
          <Card>
            <div className="analysis-section">
              <h2 className="section-title">Multi-Asset Analysis</h2>
              <p className="section-description">
                Analyze CAPM for multiple assets simultaneously.
              </p>
              <div className="form-grid">
                <Input
                  label="Asset Tickers (comma-separated)"
                  value={multiAssetTickers}
                  onChange={(e) => setMultiAssetTickers(e.target.value.toUpperCase())}
                  placeholder="Insert tickers..."
                  helperText="Example: AAPL, GOOGL, MSFT, AMZN"
                  fullWidth
                />
                <Select
                  label="Benchmark"
                  value={marketTicker}
                  onChange={(e) => setMarketTicker(e.target.value)}
                  options={CAPM_BENCHMARK_SELECT_OPTIONS}
                  fullWidth
                />
                <Input
                  label="Risk-Free Rate (annualized)"
                  type="number"
                  step="0.001"
                  value={riskFreeRate}
                  onChange={(e) => setRiskFreeRate(e.target.value)}
                  placeholder="0.03"
                  fullWidth
                />
              </div>
              <Button 
                onClick={handleMultiAsset}
                variant="primary"
                size="lg"
                fullWidth
              >
                Analyze Multiple Assets
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'optimize' && (
          <Card>
            <div className="analysis-section">
              <h2 className="section-title">Portfolio Optimization</h2>
              <p className="section-description">
                Optimize asset allocation using CAPM and the efficient frontier.
              </p>
              <div className="form-grid">
                <Input
                  label="Asset Tickers (comma-separated)"
                  value={multiAssetTickers}
                  onChange={(e) => setMultiAssetTickers(e.target.value.toUpperCase())}
                  placeholder="Insert tickers..."
                  helperText="Example: AAPL, GOOGL, MSFT, AMZN"
                  fullWidth
                />
                <Input
                  label="Risk-Free Rate (annualized)"
                  type="number"
                  step="0.001"
                  value={riskFreeRate}
                  onChange={(e) => setRiskFreeRate(e.target.value)}
                  placeholder="0.03"
                  fullWidth
                />
                <Input
                  label="Number of Points"
                  type="number"
                  min="10"
                  value={nPoints}
                  onChange={(e) => setNPoints(e.target.value)}
                  placeholder="50"
                  helperText="Number of points on the efficient frontier"
                  fullWidth
                />
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={allowShort}
                      onChange={(e) => setAllowShort(e.target.checked)}
                      className="checkbox"
                    />
                    <span>Allow short selling</span>
                  </label>
                </div>
              </div>
              <Button 
                onClick={handleOptimize}
                variant="primary"
                size="lg"
                fullWidth
              >
                Optimize Portfolio
              </Button>
            </div>
          </Card>
        )}

      </div>

      {analysis.result && (
        <div>
          <CAPMResults data={analysis.result} type={activeTab} />
        </div>
      )}
    </div>
  );
};

export default CAPM;
