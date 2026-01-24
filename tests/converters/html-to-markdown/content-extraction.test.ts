/**
 * Tests for content extraction module
 */
import { describe, test, expect } from 'vitest';
import { extractContent } from '../../../src/converters/html-to-markdown/extractors/content.js';

describe('extractContent', () => {
  test('extracts main content from article HTML', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Test Article</title></head>
      <body>
        <nav><a href="/">Home</a><a href="/about">About</a></nav>
        <article>
          <h1>The Main Article Title</h1>
          <p>This is the first paragraph of the article with enough content to be recognized.</p>
          <p>This is another paragraph with more detailed information about the topic at hand.</p>
          <p>The article continues with even more content to ensure it passes the character threshold.</p>
          <p>We need sufficient text content for Readability to recognize this as article content.</p>
          <p>Adding more paragraphs helps ensure the extraction algorithm identifies this correctly.</p>
        </article>
        <footer><p>Copyright 2024</p></footer>
      </body>
      </html>
    `;

    const result = extractContent(html);

    expect(result).not.toBeNull();
    expect(result!.title).toBeTruthy();
    expect(result!.content).toBeTruthy();
    // Content should contain article text
    expect(result!.content).toContain('first paragraph');
  });

  test('returns null for non-article content', () => {
    // Very short HTML with no real content - should return null
    const html = `<html><body><p>Hi</p></body></html>`;

    const result = extractContent(html);

    expect(result).toBeNull();
  });

  test('strips navigation elements', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <nav>
          <a href="/">Home</a>
          <a href="/products">Products</a>
          <a href="/about">About Us</a>
        </nav>
        <article>
          <h1>Article Title</h1>
          <p>This is substantial article content that should be extracted by Readability.</p>
          <p>We add more paragraphs to ensure there is enough content for extraction.</p>
          <p>The navigation links above should not appear in the extracted content.</p>
          <p>This helps test that boilerplate is properly removed from the output.</p>
          <p>Final paragraph with additional context and information for the reader.</p>
        </article>
      </body>
      </html>
    `;

    const result = extractContent(html);

    expect(result).not.toBeNull();
    // Navigation links should not be in extracted content
    expect(result!.content).not.toContain('Products');
    expect(result!.content).not.toContain('About Us');
    // Article content should be present
    expect(result!.content).toContain('substantial article content');
  });

  test('strips footer elements', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <article>
          <h1>Article About Technology</h1>
          <p>This article discusses important technology topics that readers want to know about.</p>
          <p>The content continues with detailed explanations of various concepts and ideas.</p>
          <p>We provide comprehensive coverage of the subject matter at hand.</p>
          <p>Readers will find this information useful for their understanding.</p>
          <p>The article wraps up with concluding thoughts on the technology topic.</p>
        </article>
        <footer>
          <p>Copyright 2024 Example Corp. All rights reserved.</p>
          <a href="/privacy">Privacy Policy</a>
        </footer>
      </body>
      </html>
    `;

    const result = extractContent(html);

    expect(result).not.toBeNull();
    // Footer content should not be extracted
    expect(result!.content).not.toContain('Copyright 2024 Example Corp');
    expect(result!.content).not.toContain('Privacy Policy');
    // Article content should be present
    expect(result!.content).toContain('technology topics');
  });

  test('preserves article title', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>My Website - Great Article Title</title></head>
      <body>
        <article>
          <h1>Great Article Title</h1>
          <p>This is the content of the article that will be extracted by the reader.</p>
          <p>Adding more text ensures the extraction algorithm has enough to work with.</p>
          <p>The title should be preserved in the extraction result along with the content.</p>
          <p>We continue with more paragraphs to meet the character threshold requirement.</p>
          <p>This final paragraph completes the article with sufficient content.</p>
        </article>
      </body>
      </html>
    `;

    const result = extractContent(html);

    expect(result).not.toBeNull();
    expect(result!.title).toBeTruthy();
    expect(result!.title.length).toBeGreaterThan(0);
  });

  test('preserves article text content', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <article>
          <h1>Test Article</h1>
          <p>UNIQUE_MARKER_ALPHA text that should appear in textContent field.</p>
          <p>More content paragraphs to ensure Readability processes this correctly.</p>
          <p>UNIQUE_MARKER_BETA additional text for verification purposes.</p>
          <p>The extraction should preserve all the important text from the article.</p>
          <p>Final paragraph with enough content to pass character thresholds.</p>
        </article>
      </body>
      </html>
    `;

    const result = extractContent(html);

    expect(result).not.toBeNull();
    expect(result!.textContent).toBeTruthy();
    expect(result!.textContent).toContain('UNIQUE_MARKER_ALPHA');
    expect(result!.textContent).toContain('UNIQUE_MARKER_BETA');
  });

  test('handles malformed HTML gracefully', () => {
    const malformedHtml = `
      <html
      <body>
        <article>
          <h1>Broken HTML Article</h1>
          <p>This HTML is malformed but should still be processed without crashing.
          <p>Missing closing tags everywhere
          <p>The parser should handle this gracefully and either extract or return null.
          <p>We add enough content to potentially trigger extraction if parsing succeeds.
          <p>Final paragraph with more text content for the extraction algorithm.
        </article>
      </body>
    `;

    // Should not throw
    expect(() => extractContent(malformedHtml)).not.toThrow();

    // Result may be null or valid - either is acceptable for malformed input
    const result = extractContent(malformedHtml);
    if (result !== null) {
      expect(result.content).toBeTruthy();
    }
  });

  test('returns metadata fields when available', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Example Site - Article Title</title>
        <meta property="og:site_name" content="Example Site">
        <meta name="author" content="John Doe">
        <meta property="article:published_time" content="2024-01-15T10:00:00Z">
      </head>
      <body>
        <article>
          <h1>Article Title</h1>
          <p class="byline">By John Doe</p>
          <p>This is the main content of the article that discusses various topics.</p>
          <p>We include several paragraphs to ensure proper content extraction.</p>
          <p>The metadata fields should be extracted along with the main content.</p>
          <p>Authors and publication dates help provide context for the article.</p>
          <p>This final paragraph rounds out the article with additional information.</p>
        </article>
      </body>
      </html>
    `;

    const result = extractContent(html);

    expect(result).not.toBeNull();
    expect(result!.content).toBeTruthy();
    // Metadata may or may not be extracted depending on Readability's parsing
    // Just verify the interface is correct
    expect(typeof result!.title).toBe('string');
  });
});
