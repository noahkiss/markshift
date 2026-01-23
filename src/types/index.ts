/**
 * Core type definitions for markshift converters
 *
 * @packageDocumentation
 */

/**
 * Supported format identifiers
 */
export type Format = 'html' | 'markdown' | 'rtf' | 'jira' | 'text';

/**
 * A format pair identifier like "html->markdown"
 */
export type FormatPair = `${Format}->${Format}`;

/**
 * Valid format values for runtime checking
 */
const VALID_FORMATS: ReadonlyArray<Format> = ['html', 'markdown', 'rtf', 'jira', 'text'];

/**
 * Type guard to validate if a string is a valid Format
 */
export function isValidFormat(value: string): value is Format {
  return VALID_FORMATS.includes(value as Format);
}

/**
 * Options that can be passed to any converter
 */
export interface ConvertOptions {
  /** Preserve semantic meaning over visual appearance */
  semantic?: boolean;
  /** Custom rules/extensions for this conversion */
  rules?: Record<string, unknown>;
}

/**
 * Result of a conversion operation
 */
export interface ConvertResult {
  /** The converted content */
  content: string;
  /** Metadata about the conversion */
  metadata?: {
    /** Original format */
    sourceFormat: string;
    /** Target format */
    targetFormat: string;
    /** Processing time in milliseconds */
    processingTimeMs?: number;
  };
}
