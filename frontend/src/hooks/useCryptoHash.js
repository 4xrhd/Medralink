import { useState, useEffect } from 'react';

/**
 * Standard utility to compute SHA-256 hex string using Web Crypto API.
 * @param {string} input String to hash
 * @returns {Promise<string>} 64-char lowercase hex SHA-256 hash
 */
export async function computeSha256(input) {
  if (!input) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Reactive hook that calculates SHA-256 hash asynchronously whenever input changes.
 * @param {string} input String or template to hash
 * @param {string} [fallback=''] Initial fallback hash
 * @returns {string} The computed 64-char SHA-256 hex hash
 */
export function useCryptoHash(input, fallback = '') {
  const [hash, setHash] = useState(fallback);

  useEffect(() => {
    let isMounted = true;
    if (!input) {
      setHash('');
      return;
    }

    computeSha256(input)
      .then((h) => {
        if (isMounted) setHash(h);
      })
      .catch(() => {
        if (isMounted) setHash(fallback);
      });

    return () => {
      isMounted = false;
    };
  }, [input, fallback]);

  return hash;
}

export default useCryptoHash;
