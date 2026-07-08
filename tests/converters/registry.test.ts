import { describe, it, expect, beforeEach } from 'vitest';
import { ConverterRegistry, createDefaultRegistry } from '../../src/converters/index.js';
import type { Converter } from '../../src/converters/index.js';
import type { ConvertResult } from '../../src/types/index.js';

/**
 * Create a mock converter for testing
 */
function createMockConverter(
  source: 'html' | 'markdown' | 'rtf' | 'jira' | 'text',
  target: 'html' | 'markdown' | 'rtf' | 'jira' | 'text'
): Converter {
  return {
    sourceFormat: source,
    targetFormat: target,
    convert: (input: string): ConvertResult => ({
      content: input,
      metadata: {
        sourceFormat: source,
        targetFormat: target,
      },
    }),
  };
}

describe('ConverterRegistry', () => {
  let registry: ConverterRegistry;

  beforeEach(() => {
    // Create fresh registry for each test to avoid pollution
    registry = new ConverterRegistry();
  });

  it('should start empty', () => {
    expect(registry.list()).toEqual([]);
  });

  it('should register a converter', () => {
    const converter = createMockConverter('html', 'markdown');
    registry.register(converter);

    expect(registry.list()).toHaveLength(1);
    expect(registry.list()[0]).toEqual({
      source: 'html',
      target: 'markdown',
    });
  });

  it('should retrieve registered converter by format pair', () => {
    const converter = createMockConverter('html', 'markdown');
    registry.register(converter);

    const retrieved = registry.get('html', 'markdown');
    expect(retrieved).toBeDefined();
    expect(retrieved?.sourceFormat).toBe('html');
    expect(retrieved?.targetFormat).toBe('markdown');
  });

  it('should return true from has() for registered converter', () => {
    const converter = createMockConverter('html', 'markdown');
    registry.register(converter);

    expect(registry.has('html', 'markdown')).toBe(true);
  });

  it('should return false from has() for unregistered converter', () => {
    expect(registry.has('html', 'markdown')).toBe(false);
  });

  it('should throw error when registering duplicate format pair', () => {
    const converter1 = createMockConverter('html', 'markdown');
    const converter2 = createMockConverter('html', 'markdown');

    registry.register(converter1);

    expect(() => registry.register(converter2)).toThrow(
      'Converter already registered for html->markdown'
    );
  });

  it('should return undefined from get() for unregistered format pair', () => {
    const result = registry.get('rtf', 'jira');
    expect(result).toBeUndefined();
  });

  it('should allow registering multiple different converters', () => {
    const converter1 = createMockConverter('html', 'markdown');
    const converter2 = createMockConverter('markdown', 'html');
    const converter3 = createMockConverter('rtf', 'markdown');

    registry.register(converter1);
    registry.register(converter2);
    registry.register(converter3);

    expect(registry.list()).toHaveLength(3);
    expect(registry.has('html', 'markdown')).toBe(true);
    expect(registry.has('markdown', 'html')).toBe(true);
    expect(registry.has('rtf', 'markdown')).toBe(true);
  });

  describe('register with { override: true }', () => {
    it('replaces an existing registration instead of throwing', () => {
      const original = createMockConverter('markdown', 'html');
      const replacement = createMockConverter('markdown', 'html');
      registry.register(original);

      expect(() => registry.register(replacement, { override: true })).not.toThrow();
      expect(registry.get('markdown', 'html')).toBe(replacement);
    });

    it('marks the pair as a user override, retrievable via getOverride', () => {
      const converter = createMockConverter('markdown', 'html');
      registry.register(converter, { override: true });

      expect(registry.getOverride('markdown', 'html')).toBe(converter);
    });

    it('getOverride returns undefined for a plain (non-override) registration', () => {
      const converter = createMockConverter('markdown', 'html');
      registry.register(converter);

      expect(registry.getOverride('markdown', 'html')).toBeUndefined();
    });
  });
});

describe('createDefaultRegistry', () => {
  it('registers all built-in format pairs with none marked as overrides', () => {
    const reg = createDefaultRegistry();

    for (const [source, target] of [
      ['html', 'markdown'],
      ['markdown', 'html'],
      ['rtf', 'html'],
      ['csv', 'markdown'],
      ['markdown', 'csv'],
      ['json', 'markdown'],
    ] as const) {
      expect(reg.has(source, target)).toBe(true);
      expect(reg.getOverride(source, target)).toBeUndefined();
    }
  });

  it('applies htmlToMarkdown/markdownToHtml user config to the built-in converters', () => {
    const reg = createDefaultRegistry({
      htmlToMarkdown: { options: { bulletListMarker: '*' } },
      markdownToHtml: { options: { breaks: true } },
    });

    const htmlToMd = reg.get('html', 'markdown')!;
    expect(htmlToMd.convert('<ul><li>x</li></ul>').content).toMatch(/^\*\s+x/m);

    const mdToHtml = reg.get('markdown', 'html')!;
    expect((mdToHtml.convert('a\nb') as ConvertResult).content).toContain('<br>');
  });

  it('registers user converters as overrides, replacing a built-in pair', () => {
    const customMarkdownToHtml = createMockConverter('markdown', 'html');
    const reg = createDefaultRegistry({ converters: [customMarkdownToHtml] });

    expect(reg.get('markdown', 'html')).toBe(customMarkdownToHtml);
    expect(reg.getOverride('markdown', 'html')).toBe(customMarkdownToHtml);
  });

  it('registers a wholly custom pair not covered by any built-in', () => {
    const jiraConverter = createMockConverter('jira', 'html');
    const reg = createDefaultRegistry({ converters: [jiraConverter] });

    expect(reg.get('jira', 'html')).toBe(jiraConverter);
    expect(reg.getOverride('jira', 'html')).toBe(jiraConverter);
  });
});
