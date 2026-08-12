import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure the PDF.js worker for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Parses a PDF file (ArrayBuffer) into Markdown.
 *
 * Pipeline:
 * 1. Extract text content page-by-page via pdfjs-dist
 * 2. Group text items into lines by Y-coordinate
 * 3. Determine body font size (most frequent) as a baseline
 * 4. Detect headings via font-size heuristics (1.3x = h2, 1.6x = h1)
 * 5. Remove repeated running headers/footers (frequency analysis)
 * 6. Remove standalone page numbers
 * 7. Join hyphenated words across line breaks
 * 8. Collapse excessive whitespace
 *
 * @param {ArrayBuffer} arrayBuffer - The raw PDF file data
 * @param {Function} [onProgress] - Optional progress callback (currentPage, totalPages)
 * @returns {Promise<{markdown: string, metadata: Object, rawTextLength: number}>}
 */
export async function parsePdf(arrayBuffer, onProgress) {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  // Extract metadata
  let metadata = {
    title: 'Unknown',
    author: 'Unknown',
    pageCount: numPages,
  };

  try {
    const pdfMeta = await pdfDoc.getMetadata();
    if (pdfMeta && pdfMeta.info) {
      metadata.title = pdfMeta.info.Title || metadata.title;
      metadata.author = pdfMeta.info.Author || metadata.author;
    }
  } catch (e) {
    console.warn('Failed to extract PDF metadata', e);
  }

  // ─── Phase 1: Extract text and group into lines per page ───
  const pagesData = []; // Array of pages, each page is an array of lines
  const allFontSizes = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();

    // Sort items: top-to-bottom (descending Y), then left-to-right (ascending X)
    const items = textContent.items
      .filter((item) => 'str' in item && item.str.trim().length > 0)
      .sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5];
        if (Math.abs(yDiff) > 2) return yDiff;
        return a.transform[4] - b.transform[4];
      });

    // Group items into lines by Y-coordinate (~2px tolerance)
    const lines = [];
    let currentY = null;
    let currentLine = [];

    for (const item of items) {
      const y = item.transform[5];
      const fontSize = Math.abs(item.transform[0]);
      allFontSizes.push(fontSize);

      if (currentY === null || Math.abs(currentY - y) > 2) {
        if (currentLine.length > 0) lines.push(currentLine);
        currentLine = [item];
        currentY = y;
      } else {
        currentLine.push(item);
      }
    }
    if (currentLine.length > 0) lines.push(currentLine);

    pagesData.push(lines);

    if (onProgress) onProgress(i, numPages);
  }

  // ─── Phase 2: Determine body font size (most frequent) ───
  const fontSizeCounts = {};
  let maxCount = 0;
  let bodyFontSize = 12; // fallback

  for (const size of allFontSizes) {
    const rounded = Math.round(size * 10) / 10;
    fontSizeCounts[rounded] = (fontSizeCounts[rounded] || 0) + 1;
    if (fontSizeCounts[rounded] > maxCount) {
      maxCount = fontSizeCounts[rounded];
      bodyFontSize = rounded;
    }
  }

  // ─── Phase 3: Detect repeating headers/footers ───
  const headerFooterCandidates = new Map();

  for (const pageLines of pagesData) {
    // Check first 2 and last 2 lines of each page
    const edgeLines = [
      ...pageLines.slice(0, 2),
      ...pageLines.slice(-2),
    ];

    for (const lineItems of edgeLines) {
      const lineStr = lineItems.map((item) => item.str).join(' ').trim();
      if (!lineStr) continue;
      headerFooterCandidates.set(lineStr, (headerFooterCandidates.get(lineStr) || 0) + 1);
    }
  }

  const repeatingLines = new Set();
  for (const [lineStr, count] of headerFooterCandidates) {
    if (count >= 3) repeatingLines.add(lineStr);
  }

  // ─── Phase 4: Build Markdown ───
  const outputParts = [];
  let rawTextLength = 0;

  for (let p = 0; p < pagesData.length; p++) {
    const pageLines = pagesData[p];
    const pageOutput = [];

    for (let l = 0; l < pageLines.length; l++) {
      const lineItems = pageLines[l];
      const lineStr = lineItems.map((item) => item.str).join(' ').trim();

      if (!lineStr) continue;

      // Skip repeating headers/footers
      if (repeatingLines.has(lineStr)) continue;

      // Skip page numbers at top/bottom (only digits or roman numerals)
      if (
        (l < 2 || l > pageLines.length - 3) &&
        /^(\d+|[IVXLCDMivxlcdm]+)$/.test(lineStr)
      ) {
        continue;
      }

      rawTextLength += lineStr.length;

      // Heading heuristics based on font size
      const maxFontSize = Math.max(...lineItems.map((item) => Math.abs(item.transform[0])));
      let formattedLine = lineStr;

      if (maxFontSize >= bodyFontSize * 1.6 && lineStr.length < 80) {
        formattedLine = `# ${lineStr}`;
      } else if (maxFontSize >= bodyFontSize * 1.3 && lineStr.length < 80) {
        formattedLine = `## ${lineStr}`;
      }

      pageOutput.push(formattedLine);
    }

    if (pageOutput.length > 0) {
      outputParts.push(pageOutput.join('\n'));
    }
  }

  let markdown = outputParts.join('\n\n');

  // ─── Phase 5: Post-processing ───

  // Join hyphenated words at line breaks
  markdown = markdown.replace(/-\n([a-z])/g, '$1');

  // Collapse 3+ consecutive blank lines to 2
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  // Prepend metadata header
  const header = [
    '---',
    `title: ${metadata.title}`,
    `author: ${metadata.author}`,
    `pageCount: ${metadata.pageCount}`,
    '---',
    '',
    '',
  ].join('\n');

  markdown = header + markdown.trim();

  return {
    markdown,
    metadata,
    rawTextLength,
  };
}
