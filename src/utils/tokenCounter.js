let encoder = null;

/**
 * Lazy loads the GPT tokenizer.
 * The BPE dictionary is large, so dynamic import is preferred.
 */
async function getEncoder() {
  if (!encoder) {
    const mod = await import('gpt-tokenizer');
    encoder = mod;
  }
  return encoder;
}

/**
 * Counts the number of tokens in a given text.
 * @param {string} text - The input text.
 * @returns {Promise<number>} The token count.
 */
export async function countTokens(text) {
  if (!text) return 0;
  const enc = await getEncoder();
  const tokens = enc.encode(text);
  return tokens.length;
}

/**
 * Estimates the file size in bytes for a given text string.
 * @param {string} text - The input text.
 * @returns {number} The size in bytes.
 */
export function estimateFileSize(text) {
  if (!text) return 0;
  return new Blob([text]).size;
}

/**
 * Formats a byte count into a human-readable string (KB, MB, GB, etc.).
 * @param {number} bytes - The number of bytes.
 * @returns {string} Formatted size string.
 */
export function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calculates the yield/reduction after cleaning or converting text.
 * @param {number} originalTokens - Token count of original text.
 * @param {number} cleanedTokens - Token count of cleaned text.
 * @returns {Object} Object containing the reduction percentage and original/cleaned counts.
 */
export function calculateYield(originalTokens, cleanedTokens) {
  if (originalTokens === 0) {
    return {
      reduction: 0,
      originalTokens,
      cleanedTokens
    };
  }

  const reduction = ((originalTokens - cleanedTokens) / originalTokens) * 100;
  
  return {
    reduction: parseFloat(reduction.toFixed(2)),
    originalTokens,
    cleanedTokens
  };
}
