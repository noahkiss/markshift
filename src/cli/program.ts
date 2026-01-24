/**
 * CLI program definition using Commander.js
 *
 * @packageDocumentation
 */
import { Command } from '@commander-js/extra-typings';
import { VERSION } from '../index.js';
import { htmlToMdCommand } from './commands/html-to-md.js';
import { mdToHtmlCommand } from './commands/md-to-html.js';
import { convertCommand } from './commands/convert.js';

const program = new Command()
  .name('markshift')
  .description('Convert between HTML and Markdown formats')
  .version(VERSION, '-v, --version', 'display version number')
  .option('-q, --quiet', 'suppress all non-essential output')
  .option('-V, --verbose', 'show detailed processing information')
  .option('--json', 'output results as JSON (for machine parsing)');

// Add subcommands
program.addCommand(convertCommand);
program.addCommand(htmlToMdCommand);
program.addCommand(mdToHtmlCommand);

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
