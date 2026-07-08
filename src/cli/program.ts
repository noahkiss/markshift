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
import { loadUserConfig } from './config.js';
import { setUserConfig } from './config-state.js';

const program = new Command()
  .name('markshift')
  .description('Convert between HTML, Markdown, and rich text formats.\n\nExamples:\n  echo \'<p>hello</p>\' | markshift convert\n  markshift convert --paste --copy\n  markshift html-to-md page.html -o page.md\n  cat README.md | markshift md-to-html --json')
  .version(VERSION, '-v, --version', 'display version number')
  .option('-q, --quiet', 'suppress all non-essential output')
  .option('-V, --verbose', 'show detailed processing information')
  .option('--json', 'output structured JSON with content and metadata')
  .option('--paste', 'read input from system clipboard (HTML > RTF > text)')
  .option('--copy', 'write converted output to system clipboard')
  .option('--no-config', 'skip loading ~/.config/markshift/config.mjs');

// Load the user config (if any) once, before any subcommand action runs
program.hook('preAction', async (thisCommand) => {
  if (thisCommand.opts().config === false) return;
  try {
    setUserConfig(await loadUserConfig());
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
});

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
