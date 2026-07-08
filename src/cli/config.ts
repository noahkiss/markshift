/**
 * User config loader for markshift
 *
 * Lets users drop a JS config file to customize conversion behavior without
 * forking: Turndown options/rules for html->md, Marked options/extensions for
 * md->html, and whole custom format-pair converters.
 *
 * @packageDocumentation
 */
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type TurndownService from 'turndown';
import type { MarkedExtension } from 'marked';
import type { Converter } from '../converters/index.js';

/**
 * Shape of ~/.config/markshift/config.mjs
 */
export interface MarkshiftUserConfig {
  htmlToMarkdown?: {
    /** Merged over TurndownService defaults */
    options?: Partial<TurndownService.Options>;
    /** Full access to the TurndownService instance; called AFTER built-in rules */
    setup?: (turndown: TurndownService) => void;
  };
  markdownToHtml?: {
    /** Merged over Marked defaults (same shape the Marked constructor takes) */
    options?: MarkedExtension;
    /** Passed to marked.use() */
    extensions?: MarkedExtension[];
  };
  /** Whole custom format-pair converters; override built-ins for the same pair */
  converters?: Converter[];
}

/**
 * esbuild's CJS bundle (see build-bundle.mjs) rewrites a literal `import()` into
 * `require()`, which can't load a user's ESM config file. Building the import
 * through `new Function` hides it from that transform so the bundle keeps using
 * a real dynamic import at runtime.
 */
const dynamicImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string
) => Promise<{ default?: MarkshiftUserConfig }>;

function resolveConfigPath(): string {
  if (process.env.MARKSHIFT_CONFIG) {
    return process.env.MARKSHIFT_CONFIG;
  }
  const configDir = process.env.XDG_CONFIG_HOME
    ? join(process.env.XDG_CONFIG_HOME, 'markshift')
    : join(homedir(), '.config', 'markshift');
  return join(configDir, 'config.mjs');
}

/**
 * Load the user config, if any.
 *
 * Resolution order: `$MARKSHIFT_CONFIG` (explicit path — missing file is an
 * error) -> `$XDG_CONFIG_HOME/markshift/config.mjs` -> `~/.config/markshift/config.mjs`
 * (missing file at either default location just means no user config).
 *
 * @param importModule - the dynamic import to use; defaults to the
 *   esbuild-safe `dynamicImport` above. Tests override this with a plain
 *   `(p) => import(p)` because Vitest's VM can't execute a dynamic import
 *   from code built at runtime (the whole reason `dynamicImport` exists) —
 *   the real path is covered by the standalone-bundle smoke test instead.
 * @throws Error if an explicit/found config file fails to load or parse
 */
export async function loadUserConfig(
  importModule: (specifier: string) => Promise<{ default?: MarkshiftUserConfig }> = dynamicImport
): Promise<MarkshiftUserConfig | undefined> {
  const explicit = Boolean(process.env.MARKSHIFT_CONFIG);
  const configPath = resolveConfigPath();

  if (!explicit && !existsSync(configPath)) {
    return undefined;
  }

  try {
    const mod = await importModule(pathToFileURL(configPath).href);
    return mod.default;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to load markshift config from '${configPath}': ${message}`);
  }
}
