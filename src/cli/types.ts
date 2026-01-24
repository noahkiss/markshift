/**
 * CLI type definitions for JSON output and global options
 *
 * @packageDocumentation
 */

/**
 * Global options from parent command
 */
export interface GlobalOptions {
  /** Suppress all non-essential output */
  quiet?: boolean;
  /** Show detailed processing information */
  verbose?: boolean;
  /** Output results as JSON (for machine parsing) */
  json?: boolean;
  /** Read input from system clipboard */
  paste?: boolean;
  /** Write output to system clipboard */
  copy?: boolean;
  /** Extract main content from HTML, stripping nav/ads/boilerplate */
  extractContent?: boolean;
}

/**
 * JSON output structure for machine-readable results
 */
export interface JsonOutput {
  /** The converted content */
  content: string;
  /** Metadata about the conversion */
  metadata: {
    /** Detected or specified source format */
    sourceFormat: string;
    /** Target format of conversion */
    targetFormat: string;
    /** Processing time in milliseconds */
    processingTimeMs: number;
    /** Input character count */
    inputLength: number;
    /** Output character count */
    outputLength: number;
  };
}

/**
 * Create JSON output from conversion result
 *
 * @param content - The converted content
 * @param sourceFormat - The source format (detected or specified)
 * @param targetFormat - The target format
 * @param processingTimeMs - Processing time in milliseconds
 * @param inputLength - Input character count
 * @returns JSON output structure
 */
export function toJsonOutput(
  content: string,
  sourceFormat: string,
  targetFormat: string,
  processingTimeMs: number,
  inputLength: number
): JsonOutput {
  return {
    content,
    metadata: {
      sourceFormat,
      targetFormat,
      processingTimeMs,
      inputLength,
      outputLength: content.length,
    },
  };
}
