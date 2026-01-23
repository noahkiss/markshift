/**
 * CLI program definition using Commander.js
 *
 * @packageDocumentation
 */
import { Command } from '@commander-js/extra-typings';
import { VERSION } from '../index.js';

const program = new Command()
  .name('markshift')
  .description('Convert between HTML and Markdown formats')
  .version(VERSION, '-v, --version', 'display version number')
  .option('-q, --quiet', 'suppress all non-essential output')
  .option('-V, --verbose', 'show detailed processing information');

/**
 * Run the CLI program
 *
 * @param argv - Command line arguments (defaults to process.argv)
 */
export async function run(argv: string[] = process.argv): Promise<void> {
  await program.parseAsync(argv);
}

// Export program for testing and subcommand registration
export { program };
