/**
 * I/O utilities for CLI input/output handling
 *
 * Supports reading from stdin/file/clipboard and writing to stdout/file/clipboard.
 *
 * @packageDocumentation
 */
import { readFile, writeFile } from 'node:fs/promises';
import { readClipboard, writeClipboard } from './clipboard.js';

/**
 * Options for readInput
 */
export interface ReadInputOptions {
  /** Read from clipboard instead of file/stdin */
  paste?: boolean;
}

/**
 * Result from readInput when using clipboard
 */
export interface ReadInputResult {
  /** The input content */
  content: string;
  /** Source format (only set when reading from clipboard) */
  sourceFormat?: 'html' | 'rtf' | 'text';
}

/**
 * Read input from a file, stdin, or clipboard
 *
 * @param inputPath - Path to input file (reads from stdin if omitted)
 * @param options - Optional settings including paste flag
 * @returns The input content and optional source format
 * @throws Error if no input provided in TTY mode, file read fails, or conflicting options
 */
export async function readInput(
  inputPath?: string,
  options?: ReadInputOptions
): Promise<ReadInputResult> {
  // Mutual exclusivity check
  if (options?.paste && inputPath) {
    throw new Error('Cannot use --paste with file input. Choose one.');
  }

  // Read from clipboard
  if (options?.paste) {
    const result = await readClipboard();
    return { content: result.content, sourceFormat: result.sourceFormat };
  }

  // Read from file
  if (inputPath) {
    try {
      const content = await readFile(inputPath, 'utf-8');
      return { content };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to read file '${inputPath}': ${message}`);
    }
  }

  // Read from stdin
  if (process.stdin.isTTY) {
    throw new Error(
      'No input provided.\n' +
        'Usage: markshift <command> <input-file>\n' +
        '   or: cat input.html | markshift <command>\n' +
        '   or: markshift <command> --paste'
    );
  }

  let data = '';
  process.stdin.setEncoding('utf-8');
  for await (const chunk of process.stdin) {
    data += chunk;
  }
  return { content: data };
}

/**
 * Options for writeOutput
 */
export interface WriteOutputOptions {
  /** Write to clipboard instead of file/stdout */
  copy?: boolean;
}

/**
 * Write output to a file, stdout, or clipboard
 *
 * @param outputPath - Path to output file (writes to stdout if omitted)
 * @param content - Content to write
 * @param options - Optional settings including copy flag
 * @throws Error if file write fails or conflicting options
 */
export async function writeOutput(
  outputPath: string | undefined,
  content: string,
  options?: WriteOutputOptions
): Promise<void> {
  // Mutual exclusivity check
  if (options?.copy && outputPath) {
    throw new Error('Cannot use --copy with file output. Choose one.');
  }

  // Write to clipboard
  if (options?.copy) {
    await writeClipboard(content);
    return;
  }

  // Write to file
  if (outputPath) {
    try {
      await writeFile(outputPath, content, 'utf-8');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to write file '${outputPath}': ${message}`);
    }
  } else {
    process.stdout.write(content);
  }
}
