import { HtmlToMarkdownConverter } from '../converters/html-to-markdown/index.js';
import { MarkdownToHtmlConverter } from '../converters/markdown-to-html/index.js';
import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';

// Re-export converter instances
export const htmlToMarkdownConverter = new HtmlToMarkdownConverter();
export const markdownToHtmlConverter = new MarkdownToHtmlConverter();

// Convenience functions
export function htmlToMarkdown(html: string): string {
  return htmlToMarkdownConverter.convert(html).content;
}

export function markdownToHtml(markdown: string): string {
  return markdownToHtmlConverter.convert(markdown).content;
}

// Browser-native content extraction interface
export interface ExtractedContent {
  title: string;
  content: string;
  textContent?: string;
  excerpt?: string;
  byline?: string;
  siteName?: string;
  publishedTime?: string;
}

const MIN_CONTENT_LENGTH = 100;

// Browser-native content extraction (replaces linkedom-based version)
export function extractContent(html: string): ExtractedContent | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // IMPORTANT: Clone to prevent Readability from modifying original
    const docClone = doc.cloneNode(true) as Document;

    const reader = new Readability(docClone, {
      charThreshold: 500,
      keepClasses: false,
    });

    const result = reader.parse();

    if (!result || !result.content || result.content.length < MIN_CONTENT_LENGTH) {
      return null;
    }

    return {
      title: result.title || '',
      content: DOMPurify.sanitize(result.content),
      textContent: result.textContent || undefined,
      excerpt: result.excerpt || undefined,
      byline: result.byline || undefined,
      siteName: result.siteName || undefined,
      publishedTime: result.publishedTime || undefined,
    };
  } catch {
    return null;
  }
}
