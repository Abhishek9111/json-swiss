import { useState, useCallback } from 'react';

// `parsed` is undefined when there is no valid input; JSON null is a real value.
export function useJsonValidation() {
  const [parsed, setParsed] = useState(undefined);
  const [status, setStatus] = useState('empty');
  const [error, setError] = useState(null);

  const validate = useCallback((raw) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setParsed(undefined);
      setStatus('empty');
      setError(null);
      return { valid: false, parsed: undefined };
    }
    try {
      const obj = JSON.parse(trimmed);
      setParsed(obj);
      setStatus('valid');
      setError(null);
      return { valid: true, parsed: obj };
    } catch (e) {
      setParsed(undefined);
      setStatus('invalid');
      setError(e.message);
      return { valid: false, parsed: undefined };
    }
  }, []);

  return { parsed, status, error, validate };
}
