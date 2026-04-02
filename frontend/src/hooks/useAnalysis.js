import { useState, useCallback } from 'react';

export const useAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const execute = useCallback(async (analysisFunction) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const result = await analysisFunction();
      setResult(result);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Analysis error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return {
    loading,
    error,
    result,
    execute,
    reset,
  };
};

