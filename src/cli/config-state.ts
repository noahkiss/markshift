/**
 * Holds the user config loaded at CLI startup so commands can read it without
 * a circular import on program.ts (which owns the --no-config preAction hook).
 *
 * @packageDocumentation
 */
import type { MarkshiftUserConfig } from './config.js';

let current: MarkshiftUserConfig | undefined;

/** Set by program.ts's preAction hook once config has been loaded (or skipped). */
export function setUserConfig(config: MarkshiftUserConfig | undefined): void {
  current = config;
}

/** Read the config loaded for this CLI invocation, if any. */
export function getUserConfig(): MarkshiftUserConfig | undefined {
  return current;
}
