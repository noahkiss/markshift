/**
 * Verbose/quiet aware logging utility for CLI
 *
 * All non-data output goes to stderr so stdout stays clean for piping.
 *
 * @packageDocumentation
 */

/**
 * Logger interface for CLI output
 */
export interface Logger {
  /** Normal output (suppressed by --quiet) */
  info(message: string): void;
  /** Debug output (only shown with --verbose, suppressed by --quiet) */
  verbose(message: string): void;
  /** Errors (always shown, goes to stderr) */
  error(message: string): void;
}

/**
 * Creates a logger that respects --quiet and --verbose flags
 *
 * @param quiet - Suppress all non-essential output
 * @param verbose - Show detailed processing information
 */
export function createLogger(quiet = false, verbose = false): Logger {
  return {
    info(message: string): void {
      if (!quiet) {
        console.error(message);
      }
    },
    verbose(message: string): void {
      if (verbose && !quiet) {
        console.error(`[verbose] ${message}`);
      }
    },
    error(message: string): void {
      console.error(message);
    },
  };
}
