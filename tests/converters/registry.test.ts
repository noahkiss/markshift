import { describe, it, expect, beforeEach } from 'vitest';
import { ConverterRegistry } from '../../src/converters/index.js';
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
});
