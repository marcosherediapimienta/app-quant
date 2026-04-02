import { useState, useCallback } from 'react';
import { dataAPI } from '../api/data';

export const useDataDownload = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const run = useCallback(async (fetcher) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await fetcher();
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'Error downloading data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadTickers = useCallback(
    (tickers, options = {}) =>
      run(() =>
        dataAPI.downloadTickers(tickers, options.startDate, options.endDate, options.type || 'returns'),
      ),
    [run],
  );

  const downloadMacroFactors = useCallback(
    (factors = null, options = {}) =>
      run(() => dataAPI.downloadMacroFactors(factors, options.startDate, options.endDate)),
    [run],
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    downloadTickers,
    downloadMacroFactors,
    reset,
  };
};

