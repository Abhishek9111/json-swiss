import { useState, useCallback } from 'react';

export function useJsonValidation() {
  const [parsed, setParsed] = useState(null);
  const [status, setStatus] = useState('empty');
  const [error, setError] = useState(null);

  const validate = useCallback((raw) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setParsed(null);
      setStatus('empty');
      setError(null);
      return { valid: false, parsed: null };
    }
    try {
      const obj = JSON.parse(trimmed);
      setParsed(obj);
      setStatus('valid');
      setError(null);
      return { valid: true, parsed: obj };
    } catch (e) {
      setParsed(null);
      setStatus('invalid');
      setError(e.message);
      return { valid: false, parsed: null };
    }
  }, []);

  return { parsed, status, error, validate };
}
