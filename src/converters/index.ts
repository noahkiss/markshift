/**
 * Converter interface and registry for markshift
 *
 * @packageDocumentation
 */

import type { Format, FormatPair, ConvertOptions, ConvertResult } from '../types/index.js';
import type { MarkshiftUserConfig } from '../cli/config.js';
import { HtmlToMarkdownConverter } from './html-to-markdown/index.js';
import { MarkdownToHtmlConverter } from './markdown-to-html/index.js';
import { RtfToHtmlConverter } from './rtf-to-html/index.js';
import { CsvToMarkdownConverter } from './csv-to-markdown/index.js';
import { MarkdownToCsvConverter } from './markdown-to-csv/index.js';
import { JsonToMarkdownConverter } from './json-to-markdown/index.js';

/**
 * Core converter interface - all converters implement this
 */
export interface Converter {
  /** Source format this converter reads */
  readonly sourceFormat: Format;
  /** Target format this converter produces */
  readonly targetFormat: Format;
  /** Convert content from source to target format */
  convert(input: string, options?: ConvertOptions): ConvertResult | Promise<ConvertResult>;
}

/**
 * Options for ConverterRegistry#register
 */
export interface RegisterOptions {
  /**
   * Replace an existing registration instead of throwing, and mark this pair
   * as user-overridden (see ConverterRegistry#getOverride).
   */
  override?: boolean;
}

/**
 * Registry for managing converters by format pair
 */
export class ConverterRegistry {
  private converters = new Map<FormatPair, Converter>();
  private overrides = new Set<FormatPair>();

  /**
   * Register a converter for a specific format pair
   * @throws Error if a converter is already registered for this format pair
   *   (unless `options.override` is set)
   */
  register(converter: Converter, options?: RegisterOptions): void {
    const key: FormatPair = `${converter.sourceFormat}->${converter.targetFormat}`;
    if (this.converters.has(key) && !options?.override) {
      throw new Error(`Converter already registered for ${key}`);
    }
    this.converters.set(key, converter);
    if (options?.override) {
      this.overrides.add(key);
    }
  }

  /**
   * Get a converter for the specified pair, but only if it was registered as a
   * user override. Used by the CLI to bypass the markdown pivot for pairs the
   * user has explicitly customized or replaced.
   */
  getOverride(source: Format, target: Format): Converter | undefined {
    const key: FormatPair = `${source}->${target}`;
    return this.overrides.has(key) ? this.converters.get(key) : undefined;
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
    this.overrides.clear();
  }
}

/**
 * Singleton registry instance for the application
 */
export const registry = new ConverterRegistry();

/**
 * Build a registry with the built-in format-pair converters, wiring in the
 * user's Turndown/Marked customizations, then layering any user-registered
 * converters on top (replacing built-ins for the same pair, or adding new
 * pairs entirely).
 */
export function createDefaultRegistry(userConfig?: MarkshiftUserConfig): ConverterRegistry {
  const reg = new ConverterRegistry();

  reg.register(new HtmlToMarkdownConverter(userConfig?.htmlToMarkdown));
  reg.register(new MarkdownToHtmlConverter(userConfig?.markdownToHtml));
  reg.register(new RtfToHtmlConverter());
  reg.register(new CsvToMarkdownConverter());
  reg.register(new MarkdownToCsvConverter());
  reg.register(new JsonToMarkdownConverter());

  for (const converter of userConfig?.converters ?? []) {
    reg.register(converter, { override: true });
  }

  return reg;
}
