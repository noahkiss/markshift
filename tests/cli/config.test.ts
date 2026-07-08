/**
 * Tests for the user config loader
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadUserConfig } from '../../src/cli/config.js';

// loadUserConfig()'s default import path is deliberately hidden from esbuild's
// CJS transform (via `new Function`) so the standalone bundle can still load an
// ESM config file — but that same trick can't run inside Vitest's VM, which
// has no dynamic-import callback for runtime-constructed code. Inject a plain
// import() here to test the loader's resolution/error-handling logic; the
// protected production path is covered by the bundle smoke test instead.
const realImport = (specifier: string) => import(specifier);

describe('loadUserConfig', () => {
  let dir: string;
  const savedEnv = { ...process.env };

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'markshift-config-test-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
    process.env = { ...savedEnv };
    delete process.env.MARKSHIFT_CONFIG;
    delete process.env.XDG_CONFIG_HOME;
  });

  it('returns undefined when no config exists at the default location', async () => {
    delete process.env.MARKSHIFT_CONFIG;
    process.env.XDG_CONFIG_HOME = dir; // empty dir, no markshift/config.mjs inside

    const config = await loadUserConfig();
    expect(config).toBeUndefined();
  });

  it('loads a config found via $XDG_CONFIG_HOME/markshift/config.mjs', async () => {
    delete process.env.MARKSHIFT_CONFIG;
    process.env.XDG_CONFIG_HOME = dir;
    const configDir = join(dir, 'markshift');
    await mkdir(configDir, { recursive: true });
    await writeFile(
      join(configDir, 'config.mjs'),
      "export default { markdownToHtml: { options: { breaks: true } } };\n",
      'utf-8'
    );

    const config = await loadUserConfig(realImport);
    expect(config?.markdownToHtml?.options).toEqual({ breaks: true });
  });

  it('loads a config from an explicit $MARKSHIFT_CONFIG path', async () => {
    const configPath = join(dir, 'my-config.mjs');
    await writeFile(
      configPath,
      "export default { htmlToMarkdown: { options: { bulletListMarker: '*' } } };\n",
      'utf-8'
    );
    process.env.MARKSHIFT_CONFIG = configPath;

    const config = await loadUserConfig(realImport);
    expect(config?.htmlToMarkdown?.options).toEqual({ bulletListMarker: '*' });
  });

  it('throws when $MARKSHIFT_CONFIG points at a missing file', async () => {
    process.env.MARKSHIFT_CONFIG = join(dir, 'does-not-exist.mjs');

    await expect(loadUserConfig(realImport)).rejects.toThrow(/does-not-exist\.mjs/);
  });

  it('throws a useful error when the config file itself throws', async () => {
    const configPath = join(dir, 'broken-config.mjs');
    await writeFile(
      configPath,
      "export default (() => { throw new Error('intentional test failure'); })();\n",
      'utf-8'
    );
    process.env.MARKSHIFT_CONFIG = configPath;

    await expect(loadUserConfig(realImport)).rejects.toThrow(/broken-config\.mjs/);
    await expect(loadUserConfig(realImport)).rejects.toThrow(/intentional test failure/);
  });
});
