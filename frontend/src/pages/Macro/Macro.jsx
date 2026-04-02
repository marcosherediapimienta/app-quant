import { useState } from 'react';
import { macroAPI } from '../../api/macro';
import { useDataDownload } from '../../hooks/useDataDownload';
import { useAnalysis } from '../../hooks/useAnalysis';
import { parseTickers, formatMacroFactorsForAPI, formatReturnsForAPI } from '../../utils/dataFormatter';
import { MACRO_FACTORS_OPTIONS, PORTFOLIO_TICKER_OPTIONS, SITUATION_AUTO_FACTORS } from '../../utils/defaults';
import Loading from '../../components/Loading/Loading';
import Error from '../../components/Error/Error';
import Button from '../../components/Button/Button';
import Select from '../../components/Select/Select';
import MultiSelect from '../../components/MultiSelect/MultiSelect';
import Card from '../../components/Card/Card';
import Tabs from '../../components/Tabs/Tabs';
import MacroResults from '../../components/Results/MacroResults';
import MacroCorrelationResults from '../../components/Results/MacroCorrelationResults';
import MacroSituationResults from '../../components/Results/MacroSituationResults';
import './Macro.css';

const Macro = () => {
  const [activeTab, setActiveTab] = useState('factors');
  const [tickerInput, setTickerInput] = useState('');
  const [selectedFactors, setSelectedFactors] = useState([]);
  
  const dataDownload = useDataDownload();
  const analysis = useAnalysis();

  const tabs = [
    { id: 'factors', label: 'Factor Analysis' },
    { id: 'correlation', label: 'Correlation' },
    { id: 'situation', label: 'Macro Situation' },
  ];

  const factorIdToTicker = (factorId) => {
    const opt = MACRO_FACTORS_OPTIONS.find(o => o.value === factorId);
    return opt?.ticker || factorId;
  };

  const selectedTickers = () => {
    return Array.from(new Set(selectedFactors.map(factorIdToTicker)));
  };

  const handleDownloadData = async () => {
    const portfolioData = await dataDownload.downloadTickers(
      parseTickers(tickerInput),
      { type: 'returns' }
    );
    const factorsData = await dataDownload.downloadMacroFactors(
      selectedTickers(),
      {}
    );
    return {
      portfolioReturns: formatReturnsForAPI(portfolioData),
      macroFactors: formatMacroFactorsForAPI(factorsData),
    };
  };

  const handleAnalyzeFactors = async () => {
    const { portfolioReturns, macroFactors } = await handleDownloadData();
    
    await analysis.execute(() =>
      macroAPI.analyzeFactors(portfolioReturns, macroFactors, true)
    );
  };

  const handleAnalyzeCorrelation = async () => {
    const { portfolioReturns, macroFactors } = await handleDownloadData();
    
    await analysis.execute(() =>
      macroAPI.analyzeCorrelation(portfolioReturns, macroFactors)
    );
  };

  const handleAnalyzeSituation = async () => {
    const uniqueFactors = [...new Set([...selectedFactors, ...SITUATION_AUTO_FACTORS])];
    const uniqueTickers = [...new Set(uniqueFactors.map(factorIdToTicker))];

    const factorsData = await dataDownload.downloadMacroFactors(uniqueTickers, {});
    const factorsDataFormatted = formatMacroFactorsForAPI(factorsData);
    const dates = Object.keys(factorsDataFormatted);

    const factorsDict = {};
    uniqueFactors.forEach(factor => {
      const ticker = factorIdToTicker(factor);
      const factorData = {};
      dates.forEach(date => {
        if (factorsDataFormatted[date]?.[ticker] !== undefined) {
          factorData[date] = factorsDataFormatted[date][ticker];
        }
      });
      if (Object.keys(factorData).length > 0) {
        factorsDict[factor] = factorData;
      }
    });


    await analysis.execute(() => macroAPI.analyzeSituation(factorsDict));
  };

  if (dataDownload.loading || analysis.loading) {
    return <Loading message="Downloading and analyzing data..." />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-icon">🌍</div>
        <h1 className="page-title">Macro Analysis</h1>
        <p className="page-subtitle">
          Analyze the relationship between macroeconomic factors and your portfolio performance
        </p>
      </div>

      {analysis.error && (
        <Error message={analysis.error} onRetry={() => analysis.reset()} />
      )}

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(tab) => { analysis.reset(); setActiveTab(tab); }} />

      {activeTab !== 'situation' && (
        <Card className="form-card">
          <div className="form-grid">
            <Select
              label="Portfolio Ticker"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              options={[
                { value: '', label: 'Select portfolio...', disabled: true },
                ...PORTFOLIO_TICKER_OPTIONS
              ]}
              fullWidth
            />
            <MultiSelect
              label="Macro Factors"
              value={selectedFactors}
              onChange={setSelectedFactors}
              options={MACRO_FACTORS_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
              placeholder="Select factors..."
              helperText="You can select multiple factors"
              fullWidth
            />
          </div>
        </Card>
      )}

      <div className="tab-content">
        {activeTab === 'factors' && (
          <Card>
            <div className="analysis-section">
              <h2 className="section-title">Macro Factor Analysis</h2>
              <p className="section-description">
                Analyze how macroeconomic factors affect your portfolio.
              </p>
              <Button 
                onClick={handleAnalyzeFactors}
                variant="primary"
                size="lg"
                fullWidth
              >
                Analyze Factors
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'correlation' && (
          <Card>
            <div className="analysis-section">
              <h2 className="section-title">Correlation Analysis</h2>
              <p className="section-description">
                Find optimal correlation between your portfolio and macro factors,
                considering different time lags.
              </p>
              <Button 
                onClick={handleAnalyzeCorrelation}
                variant="primary"
                size="lg"
                fullWidth
              >
                Analyze Correlation
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'situation' && (
          <Card>
            <div className="analysis-section">
              <h2 className="section-title">Macro Situation</h2>
              <p className="section-description">
                Analyze the current macroeconomic situation based on multiple factors.
              </p>
              <Button 
                onClick={handleAnalyzeSituation}
                variant="primary"
                size="lg"
                fullWidth
              >
                Analyze Situation
              </Button>
            </div>
          </Card>
        )}
      </div>

      {analysis.result && (
        <div>
          <div className="result-header">
            <h2 className="result-title">Results</h2>
            <Button 
              onClick={() => analysis.reset()}
              variant="ghost"
              size="sm"
            >
              Clear
            </Button>
          </div>
          {activeTab === 'factors' && <MacroResults data={analysis.result} />}
          {activeTab === 'correlation' && <MacroCorrelationResults data={analysis.result} />}
          {activeTab === 'situation' && <MacroSituationResults data={analysis.result} />}
        </div>
      )}
    </div>
  );
};

export default Macro;
