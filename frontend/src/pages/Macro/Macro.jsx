import { useState } from 'react';
import { macroService } from '../../services/macroService';
import { useDataDownload } from '../../hooks/useDataDownload';
import { useAnalysis } from '../../hooks/useAnalysis';
import { parseTickers, formatMacroFactorsForAPI, formatReturnsForAPI } from '../../utils/formatters';
import {
  MACRO_FACTORS_OPTIONS_GROUPED,
  PORTFOLIO_TICKER_OPTIONS,
  SITUATION_AUTO_FACTORS_CORE,
} from '../../utils/options';
import Loading from '../../components/Loading/Loading';
import Error from '../../components/Error/Error';
import Button from '../../components/Button/Button';
import Select from '../../components/Select/Select';
import MultiSelect from '../../components/MultiSelect/MultiSelect';
import Card from '../../components/Card/Card';
import Tabs from '../../components/Tabs/Tabs';
import MacroResults from '../../components/Results/MacroResults';
import MacroCorrelationResults from '../../components/Results/MacroCorrelationResults';
import MacroCorrelationMatrixResults from '../../components/Results/MacroCorrelationMatrixResults';
import MacroSituationResults from '../../components/Results/MacroSituationResults';
import './Macro.css';

const MACRO_FACTOR_MULTI_SECTIONS = MACRO_FACTORS_OPTIONS_GROUPED.map((g) => ({
  groupLabel: g.groupLabel,
  options: g.options.map((o) => ({ value: o.value, label: o.label })),
}));

const Macro = () => {
  const [activeTab, setActiveTab] = useState('factors');
  const [tickerInput, setTickerInput] = useState('');
  const [selectedFactors, setSelectedFactors] = useState([]);
  const [correlationMode, setCorrelationMode] = useState('portfolio');
  const [matrixCorrMethod, setMatrixCorrMethod] = useState('pearson');
  
  const dataDownload = useDataDownload();
  const analysis = useAnalysis();

  const tabs = [
    { id: 'factors', label: 'Factor Analysis' },
    { id: 'correlation', label: 'Correlation' },
    { id: 'situation', label: 'Macro Situation' },
  ];

  const factorIdToTicker = (factorId) => {
    for (const g of MACRO_FACTORS_OPTIONS_GROUPED) {
      const opt = (g.options || []).find((o) => o.value === factorId);
      if (opt?.ticker) return opt.ticker;
    }
    return factorId;
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
      macroService.analyzeFactors(portfolioReturns, macroFactors, true)
    );
  };

  const handleAnalyzeCorrelation = async () => {
    const { portfolioReturns, macroFactors } = await handleDownloadData();
    
    await analysis.execute(() =>
      macroService.analyzeCorrelation(portfolioReturns, macroFactors)
    );
  };

  const handleAnalyzeCorrelationMatrix = async () => {
    await analysis.execute(async () => {
      const tickers = selectedTickers();
      if (tickers.length < 2) {
        throw new Error('Select at least 2 macro factors for the all-to-all correlation matrix.');
      }
      const factorsData = await dataDownload.downloadMacroFactors(tickers, {});
      const macroFactors = formatMacroFactorsForAPI(factorsData);
      return macroService.analyzeCorrelationMatrix(macroFactors, {
        correlationMethod: matrixCorrMethod,
      });
    });
  };

  const handleAnalyzeSituation = async () => {
    const uniqueFactors = [...new Set([...selectedFactors, ...SITUATION_AUTO_FACTORS_CORE])];
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


    await analysis.execute(() => macroService.analyzeSituation(factorsDict));
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

      {activeTab === 'factors' && (
        <Card className="form-card">
          <div className="form-grid">
            <Select
              label="Portfolio Ticker"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              options={[
                { value: '', label: 'Select portfolio...', disabled: true },
                ...PORTFOLIO_TICKER_OPTIONS,
              ]}
              fullWidth
            />
            <MultiSelect
              label="Macro Factors"
              value={selectedFactors}
              onChange={setSelectedFactors}
              sections={MACRO_FACTOR_MULTI_SECTIONS}
              placeholder="Select factors..."
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
          <Card className="form-card correlation-workspace">
            <div className="analysis-section correlation-flow">
              <header className="correlation-header">
                <h2 className="section-title">Correlation</h2>
              </header>

              <div
                className="correlation-segmented"
                role="tablist"
                aria-label="Correlation analysis type"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={correlationMode === 'portfolio'}
                  className={`correlation-segment ${correlationMode === 'portfolio' ? 'correlation-segment--active' : ''}`}
                  onClick={() => {
                    setCorrelationMode('portfolio');
                    analysis.reset();
                  }}
                >
                  Portfolio vs factors
                  <span className="correlation-segment-hint">Lags and best fit</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={correlationMode === 'matrix'}
                  className={`correlation-segment ${correlationMode === 'matrix' ? 'correlation-segment--active' : ''}`}
                  onClick={() => {
                    setCorrelationMode('matrix');
                    analysis.reset();
                  }}
                >
                  Factor matrix
                </button>
              </div>

              <div
                className={`form-grid correlation-inputs${correlationMode === 'matrix' ? ' correlation-inputs--matrix-only' : ''}`}
              >
                {correlationMode === 'portfolio' && (
                  <Select
                    label="Portfolio"
                    value={tickerInput}
                    onChange={(e) => setTickerInput(e.target.value)}
                    options={[
                      { value: '', label: 'Select portfolio…', disabled: true },
                      ...PORTFOLIO_TICKER_OPTIONS,
                    ]}
                    fullWidth
                  />
                )}
                <div className="correlation-factors-field">
                  <MultiSelect
                    label="Macro factors"
                    value={selectedFactors}
                    onChange={setSelectedFactors}
                    sections={MACRO_FACTOR_MULTI_SECTIONS}
                    placeholder="Select factors…"
                    helperText={
                      correlationMode === 'matrix'
                        ? 'Choose at least two series.'
                        : 'Factors to compare against your portfolio returns.'
                    }
                    fullWidth
                  />
                </div>
              </div>

              {correlationMode === 'matrix' && (
                <div className="correlation-matrix-method" role="group" aria-label="Matrix correlation coefficient">
                  <span className="correlation-matrix-method-label">Coefficient</span>
                  <div className="correlation-segmented correlation-segmented--inline">
                    <button
                      type="button"
                      className={`correlation-segment ${matrixCorrMethod === 'pearson' ? 'correlation-segment--active' : ''}`}
                      aria-pressed={matrixCorrMethod === 'pearson'}
                      onClick={() => {
                        setMatrixCorrMethod('pearson');
                        analysis.reset();
                      }}
                    >
                      Pearson
                    </button>
                    <button
                      type="button"
                      className={`correlation-segment ${matrixCorrMethod === 'spearman' ? 'correlation-segment--active' : ''}`}
                      aria-pressed={matrixCorrMethod === 'spearman'}
                      onClick={() => {
                        setMatrixCorrMethod('spearman');
                        analysis.reset();
                      }}
                    >
                      Spearman
                    </button>
                  </div>
                </div>
              )}

              <p className="correlation-footnote">
                {correlationMode === 'portfolio'
                  ? 'Uses your portfolio return series and macro factor returns, including lag search for the strongest linear association.'
                  : matrixCorrMethod === 'spearman'
                    ? ''
                    : ''}
              </p>

              <Button
                onClick={
                  correlationMode === 'portfolio'
                    ? handleAnalyzeCorrelation
                    : handleAnalyzeCorrelationMatrix
                }
                variant="primary"
                size="lg"
                fullWidth
              >
                {correlationMode === 'portfolio' ? 'Run correlation analysis' : 'Build correlation matrix'}
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
          {activeTab === 'correlation' &&
            (analysis.result?.analysis_mode === 'correlation_matrix_log_returns' ? (
              <MacroCorrelationMatrixResults data={analysis.result} />
            ) : (
              <MacroCorrelationResults data={analysis.result} />
            ))}
          {activeTab === 'situation' && <MacroSituationResults data={analysis.result} />}
        </div>
      )}
    </div>
  );
};

export default Macro;
