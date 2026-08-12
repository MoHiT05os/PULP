import { unzipSync, strFromU8 } from 'fflate';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

/**
 * Resolves relative paths
 */
function resolvePath(basePath, relativePath) {
  const parts = basePath.split('/');
  parts.pop(); // Remove file name
  const relParts = relativePath.split('/');
  
  for (const part of relParts) {
    if (part === '..') {
      parts.pop();
    } else if (part !== '.' && part !== '') {
      parts.push(part);
    }
  }
  return parts.join('/');
}

/**
 * Cleans the HTML content of a chapter
 */
function cleanChapterHtml(doc) {
  // Remove unwanted elements entirely
  const removeSelectors = ['style', 'script', 'nav', 'link', 'meta', 'head'];
  removeSelectors.forEach(selector => {
    doc.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Replace images with their alt text
  doc.querySelectorAll('img').forEach(img => {
    const alt = img.getAttribute('alt');
    const textNode = doc.createTextNode(alt ? `[Image: ${alt}]` : '');
    img.replaceWith(textNode);
  });

  // Strip all inline styles and classes
  doc.querySelectorAll('*').forEach(el => {
    el.removeAttribute('style');
    el.removeAttribute('class');
  });

  return doc.body ? doc.body.innerHTML : doc.documentElement.innerHTML;
}

/**
 * Parses an EPUB file (ArrayBuffer) into Markdown
 */
export async function parseEpub(arrayBuffer) {
  const u8 = new Uint8Array(arrayBuffer);
  const unzipped = unzipSync(u8);

  const domParser = new DOMParser();

  // 1. Find the rootfile from META-INF/container.xml
  const containerXmlRaw = unzipped['META-INF/container.xml'];
  if (!containerXmlRaw) {
    throw new Error('Invalid EPUB: META-INF/container.xml not found.');
  }
  const containerXmlStr = strFromU8(containerXmlRaw);
  const containerDoc = domParser.parseFromString(containerXmlStr, 'application/xml');
  const rootfileEl = containerDoc.querySelector('rootfile');
  if (!rootfileEl) {
    throw new Error('Invalid EPUB: No rootfile found in container.xml.');
  }
  const opfPath = rootfileEl.getAttribute('full-path');

  // 2. Parse the OPF file
  const opfRaw = unzipped[opfPath];
  if (!opfRaw) {
    throw new Error(`Invalid EPUB: OPF file not found at ${opfPath}.`);
  }
  const opfStr = strFromU8(opfRaw);
  const opfDoc = domParser.parseFromString(opfStr, 'application/xml');

  // Extract Metadata
  const getMeta = (tag) => {
    const el = opfDoc.querySelector(tag);
    return el ? el.textContent : 'Unknown';
  };
  const metadata = {
    title: getMeta('dc\\:title, title'),
    author: getMeta('dc\\:creator, creator'),
    language: getMeta('dc\\:language, language'),
  };

  // Build Manifest (id -> href)
  const manifest = {};
  opfDoc.querySelectorAll('manifest > item').forEach(item => {
    manifest[item.getAttribute('id')] = item.getAttribute('href');
  });

  // Build Spine (reading order)
  const spine = [];
  opfDoc.querySelectorAll('spine > itemref').forEach(itemref => {
    const idref = itemref.getAttribute('idref');
    if (manifest[idref]) {
      spine.push(manifest[idref]);
    }
  });

  metadata.chapterCount = spine.length;

  // 3. Process each chapter in spine
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });
  turndownService.use(gfm);

  let fullMarkdown = '';
  let rawTextLength = 0;

  for (const itemHref of spine) {
    const fullItemPath = resolvePath(opfPath, itemHref);
    const itemRaw = unzipped[fullItemPath];
    
    if (itemRaw) {
      const itemHtmlStr = strFromU8(itemRaw);
      rawTextLength += itemHtmlStr.length; // Track raw HTML size for yield stats
      const itemDoc = domParser.parseFromString(itemHtmlStr, 'text/html');
      
      const cleanedHtml = cleanChapterHtml(itemDoc);
      const markdown = turndownService.turndown(cleanedHtml);
      
      fullMarkdown += markdown + '\n\n---\n\n';
    }
  }

  // Prepend metadata header
  const header = `---
title: ${metadata.title}
author: ${metadata.author}
language: ${metadata.language}
---

`;

  fullMarkdown = header + fullMarkdown.trim();

  return {
    markdown: fullMarkdown,
    metadata,
    rawTextLength
  };
}
