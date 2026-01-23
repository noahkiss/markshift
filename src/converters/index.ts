/**
 * Converter interface and registry for markshift
 *
 * @packageDocumentation
 */

import type { Format, FormatPair, ConvertOptions, ConvertResult } from '../types/index.js';

/**
 * Core converter interface - all converters implement this
 */
export interface Converter {
  /** Source format this converter reads */
  readonly sourceFormat: Format;
  /** Target format this converter produces */
  readonly targetFormat: Format;
  /** Convert content from source to target format */
  convert(input: string, options?: ConvertOptions): ConvertResult;
}

/**
 * Registry for managing converters by format pair
 */
export class ConverterRegistry {
  private converters = new Map<FormatPair, Converter>();

  /**
   * Register a converter for a specific format pair
   * @throws Error if a converter is already registered for this format pair
   */
  register(converter: Converter): void {
    const key: FormatPair = `${converter.sourceFormat}->${converter.targetFormat}`;
    if (this.converters.has(key)) {
      throw new Error(`Converter already registered for ${key}`);
    }
    this.converters.set(key, converter);
  }

  /**
   * Get a converter for the specified format pair
   * @returns The converter or undefined if not registered
   */
  get(source: Format, target: Format): Converter | undefined {
    const key: FormatPair = `${source}->${target}`;
    return this.converters.get(key);
  }

  /**
   * Check if a converter exists for the specified format pair
   */
  has(source: Format, target: Format): boolean {
    const key: FormatPair = `${source}->${target}`;
    return this.converters.has(key);
  }

  /**
   * List all registered format pairs
   */
  list(): Array<{ source: Format; target: Format }> {
    return Array.from(this.converters.values()).map((c) => ({
      source: c.sourceFormat,
      target: c.targetFormat,
    }));
  }

  /**
   * Clear all registered converters (useful for testing)
   */
  clear(): void {
    this.converters.clear();
  }
}

/**
 * Singleton registry instance for the application
 */
export const registry = new ConverterRegistry();
