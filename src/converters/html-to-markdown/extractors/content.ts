/**
 * Content extraction using Mozilla Readability
 *
 * Extracts main article content from HTML, stripping navigation, ads, and boilerplate.
 *
 * @packageDocumentation
 */
import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

/**
 * Extracted content from a web page
 */
export interface ExtractedContent {
  /** Article title */
  title: string;
  /** Main content as HTML string */
  content: string;
  /** Plain text content */
  textContent?: string;
  /** Article excerpt/description */
  excerpt?: string;
  /** Author byline */
  byline?: string;
  /** Site name */
  siteName?: string;
  /** Published time (ISO 8601) */
  publishedTime?: string;
}

/**
 * Minimum content length (in characters) to consider extraction successful
 * Short content is likely not a meaningful article
 */
const MIN_CONTENT_LENGTH = 100;

/**
 * Extract main content from HTML using Mozilla Readability
 *
 * @param html - Raw HTML string to extract content from
 * @returns Extracted content or null if not a readable article
 */
export function extractContent(html: string): ExtractedContent | null {
  try {
    // Parse HTML with linkedom
    const { document } = parseHTML(html);

    // Try to extract content with Readability
    // Note: We skip isProbablyReaderable() as it doesn't work well with linkedom's DOM
    // Instead, we let Readability try and check if the result is meaningful
    const reader = new Readability(document, {
      charThreshold: 500,
      keepClasses: false,
    });

    const result = reader.parse();

    // Return null if parsing failed or content is too short to be meaningful
    if (!result || !result.content || result.content.length < MIN_CONTENT_LENGTH) {
      return null;
    }

    return {
      title: result.title,
      content: result.content,
      textContent: result.textContent || undefined,
      excerpt: result.excerpt || undefined,
      byline: result.byline || undefined,
      siteName: result.siteName || undefined,
      publishedTime: result.publishedTime || undefined,
    };
  } catch {
    // Handle malformed HTML gracefully
    return null;
  }
}
