/**
 * markshift - A suite of tools for converting text to and from Markdown format
 *
 * @packageDocumentation
 */

// Core types
export type { Format, FormatPair, ConvertOptions, ConvertResult } from './types/index.js';
export { isValidFormat } from './types/index.js';

// Converter interface and registry
export type { Converter } from './converters/index.js';
export { ConverterRegistry, registry } from './converters/index.js';

// Converters
export { HtmlToMarkdownConverter } from './converters/html-to-markdown/index.js';
export { MarkdownToHtmlConverter } from './converters/markdown-to-html/index.js';

// Version
export const VERSION = '1.0.1';
