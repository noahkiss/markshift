/**
 * Tests for Confluence HTML handling in HTML-to-Markdown converter
 */
import { describe, it, expect } from 'vitest';
import { HtmlToMarkdownConverter } from '../../src/converters/html-to-markdown/index.js';

describe('Confluence HTML rules', () => {
  const converter = new HtmlToMarkdownConverter();

  describe('rendered Confluence HTML (copied from browser)', () => {
    it('converts syntaxhighlighter code blocks', () => {
      const html = '<pre class="syntaxhighlighter" data-syntaxhighlighter-params="brush: java">public class Foo {}</pre>';
      const result = converter.convert(html);
      expect(result.content).toContain('```java');
      expect(result.content).toContain('public class Foo {}');
      expect(result.content).toContain('```');
    });

    it('converts codeContent code blocks', () => {
      const html = '<pre class="codeContent">echo hello</pre>';
      const result = converter.convert(html);
      expect(result.content).toContain('```');
      expect(result.content).toContain('echo hello');
    });

    it('converts code blocks with brush class', () => {
      const html = '<pre class="syntaxhighlighter brush-python">print("hi")</pre>';
      const result = converter.convert(html);
      expect(result.content).toContain('```python');
    });

    it('converts info/warning panels to blockquotes', () => {
      const html = '<div class="confluence-information-macro"><p>Important note here</p></div>';
      const result = converter.convert(html);
      expect(result.content).toContain('> ');
      expect(result.content).toContain('Important note here');
    });

    it('converts panel with conf-macro class', () => {
      const html = '<div class="panel conf-macro"><p>Panel content</p></div>';
      const result = converter.convert(html);
      expect(result.content).toContain('> ');
    });

    it('converts status lozenges to inline code', () => {
      const html = '<span class="aui-lozenge">IN PROGRESS</span>';
      const result = converter.convert(html);
      expect(result.content).toContain('`IN PROGRESS`');
    });

    it('converts status-macro lozenges', () => {
      const html = '<span class="status-macro">DONE</span>';
      const result = converter.convert(html);
      expect(result.content).toContain('`DONE`');
    });

    it('expands expand/collapse sections', () => {
      const html = '<div class="expand-container"><p>Hidden content revealed</p></div>';
      const result = converter.convert(html);
      expect(result.content).toContain('Hidden content revealed');
    });

    it('strips table of contents', () => {
      const html = '<div class="toc-macro"><ul><li>Section 1</li></ul></div><p>Real content</p>';
      const result = converter.convert(html);
      expect(result.content).not.toContain('Section 1');
      expect(result.content).toContain('Real content');
    });

    it('strips client-side-toc', () => {
      const html = '<div class="client-side-toc"><ul><li>Heading</li></ul></div><p>Body</p>';
      const result = converter.convert(html);
      expect(result.content).not.toContain('Heading');
      expect(result.content).toContain('Body');
    });
  });

  describe('Confluence storage format (ac: namespace)', () => {
    it('converts code macro with language param to a fenced block without leaking the param text', () => {
      const html =
        '<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">python</ac:parameter><ac:plain-text-body>def foo(): pass</ac:plain-text-body></ac:structured-macro>';
      const result = converter.convert(html);
      expect(result.content).toContain('```python');
      expect(result.content).toContain('def foo(): pass');
      expect(result.content).not.toContain('pythondef');
    });

    it('converts info/warning panel macro to a blockquote', () => {
      const html =
        '<ac:structured-macro ac:name="info"><ac:rich-text-body><p>Heads up</p></ac:rich-text-body></ac:structured-macro>';
      const result = converter.convert(html);
      expect(result.content).toContain('> ');
      expect(result.content).toContain('Heads up');
    });

    it('strips toc macro', () => {
      const html = '<ac:structured-macro ac:name="toc"></ac:structured-macro><p>Real content</p>';
      const result = converter.convert(html);
      expect(result.content).not.toContain('toc');
      expect(result.content).toContain('Real content');
    });

    it('converts status macro with title param to inline code', () => {
      const html = '<ac:structured-macro ac:name="status"><ac:parameter ac:name="title">Done</ac:parameter></ac:structured-macro>';
      const result = converter.convert(html);
      expect(result.content).toContain('`Done`');
    });

    it('converts ac:task-list with complete and incomplete tasks', () => {
      const html =
        '<ac:task-list>' +
        '<ac:task><ac:task-status>complete</ac:task-status><ac:task-body>Buy milk</ac:task-body></ac:task>' +
        '<ac:task><ac:task-status>incomplete</ac:task-status><ac:task-body>Buy eggs</ac:task-body></ac:task>' +
        '</ac:task-list>';
      const result = converter.convert(html);
      expect(result.content).toContain('- [x] Buy milk');
      expect(result.content).toContain('- [ ] Buy eggs');
    });

    it('converts ac:emoticon to mapped text', () => {
      const html = '<p>Great <ac:emoticon ac:name="smile"></ac:emoticon></p>';
      const result = converter.convert(html);
      expect(result.content).toContain(':)');
    });

    it('converts ac:link to its link text', () => {
      const html =
        '<ac:link><ri:page ri:content-title="Some Page"></ri:page><ac:plain-text-link-body>Some Page</ac:plain-text-link-body></ac:link>';
      const result = converter.convert(html);
      expect(result.content).toContain('Some Page');
    });

    it('converts ac:image with ac:alt to an image reference', () => {
      const html = '<ac:image ac:alt="A diagram"><ri:attachment ri:filename="diagram.png"></ri:attachment></ac:image>';
      const result = converter.convert(html);
      expect(result.content).toContain('![A diagram]');
    });

    it('falls through to text content for an unknown ac: element', () => {
      const html = '<ac:some-future-macro>fallback text</ac:some-future-macro>';
      const result = converter.convert(html);
      expect(result.content).toContain('fallback text');
    });
  });

  describe('mixed Confluence + standard HTML', () => {
    it('handles Confluence elements alongside normal HTML', () => {
      const html = `
        <h1>Page Title</h1>
        <div class="confluence-information-macro"><p>Note: read this first</p></div>
        <p>Regular paragraph content.</p>
        <pre class="syntaxhighlighter" data-syntaxhighlighter-params="brush: sql">SELECT * FROM users;</pre>
      `;
      const result = converter.convert(html);
      expect(result.content).toContain('# Page Title');
      expect(result.content).toContain('> ');
      expect(result.content).toContain('Regular paragraph content.');
      expect(result.content).toContain('```sql');
      expect(result.content).toContain('SELECT * FROM users;');
    });
  });
});
