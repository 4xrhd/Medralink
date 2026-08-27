import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for resilient clipboard operations with automatic status reset.
 * @param {number} resetTimeoutMs Duration before 'copied' state resets (default: 2000ms)
 * @returns {{ copied: boolean, copiedId: string|null, copy: (text: string, id?: string) => Promise<boolean> }}
 */
export function useClipboard(resetTimeoutMs = 2000) {
  const [copiedId, setCopiedId] = useState(null);
  const timerRef = useRef(null);

  const copy = useCallback(
    async (text, id = 'default') => {
      if (!text) return false;
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for non-secure contexts
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }
        setCopiedId(id);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setCopiedId(null);
        }, resetTimeoutMs);
        return true;
      } catch (err) {
        console.warn('Failed to copy to clipboard:', err);
        return false;
      }
    },
    [resetTimeoutMs]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    copied: copiedId !== null,
    copiedId,
    copy,
  };
}

export default useClipboard;
