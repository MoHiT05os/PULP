/**
 * Cleans and normalizes raw Markdown output.
 * 
 * @param {string} rawMarkdown - The raw markdown to be cleaned.
 * @returns {string} The cleaned markdown.
 */
export function cleanMarkdown(rawMarkdown) {
  let cleaned = rawMarkdown;

  // 1. Strip any residual HTML tags
  cleaned = cleaned.replace(/<[^>]*>?/gm, '');

  // 2. Remove zero-width characters and other Unicode artifacts
  // Matches Zero Width Space, Non-Joiner, Joiner, BOM, etc.
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // 3. Clean up excessive whitespace within lines (multiple spaces -> single space)
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');

  // 4. Remove any trailing whitespace on lines
  cleaned = cleaned.replace(/[ \t]+$/gm, '');

  // 5. Collapse 3+ consecutive blank lines to max 2
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 6. Normalize heading levels
  // A simple pass to ensure we don't have jumps from H1 to H4, etc.
  // This is a basic heuristic.
  let currentLevel = 0;
  cleaned = cleaned.replace(/^(#+)\s+(.*)$/gm, (match, hashes, text) => {
    let level = hashes.length;
    
    if (currentLevel === 0) {
      // First heading
      if (level > 2) level = 2; // Don't start with deeply nested headings
    } else {
      // Prevent jumping more than 1 level down
      if (level > currentLevel + 1) {
        level = currentLevel + 1;
      }
    }
    
    currentLevel = level;
    return `${'#'.repeat(level)} ${text}`;
  });

  // 7. Ensure document ends with a single newline
  cleaned = cleaned.trimEnd() + '\n';

  return cleaned;
}
