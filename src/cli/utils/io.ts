/**
 * I/O utilities for CLI input/output handling
 *
 * Supports reading from stdin/file and writing to stdout/file.
 *
 * @packageDocumentation
 */
import { readFile, writeFile } from 'node:fs/promises';

/**
 * Read input from a file or stdin
 *
 * @param inputPath - Path to input file (reads from stdin if omitted)
 * @returns The input content as a string
 * @throws Error if no input provided in TTY mode or file read fails
 */
export async function readInput(inputPath?: string): Promise<string> {
  if (inputPath) {
    try {
      return await readFile(inputPath, 'utf-8');
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
        '   or: cat input.html | markshift <command>'
    );
  }

  let data = '';
  process.stdin.setEncoding('utf-8');
  for await (const chunk of process.stdin) {
    data += chunk;
  }
  return data;
}

/**
 * Write output to a file or stdout
 *
 * @param outputPath - Path to output file (writes to stdout if omitted)
 * @param content - Content to write
 * @throws Error if file write fails
 */
export async function writeOutput(
  outputPath: string | undefined,
  content: string
): Promise<void> {
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
