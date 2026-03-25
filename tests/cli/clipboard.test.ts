/**
 * Tests for clipboard utilities (platform shell commands)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock child_process and os before imports
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('node:os', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, platform: vi.fn(() => 'linux') };
});

vi.mock('node:fs', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, writeFileSync: vi.fn(), unlinkSync: vi.fn() };
});

import { execSync } from 'node:child_process';
import { platform } from 'node:os';
import { readClipboard, writeClipboard } from '../../src/cli/utils/clipboard.js';

describe('readClipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(platform).mockReturnValue('linux');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns HTML content when xclip has HTML (Linux)', async () => {
    vi.mocked(execSync).mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('text/html')) return '<p>Hello</p>';
      return '';
    });

    const result = await readClipboard();

    expect(result).toEqual({ content: '<p>Hello</p>', sourceFormat: 'html' });
  });

  it('returns RTF when HTML is empty but RTF is available', async () => {
    vi.mocked(execSync).mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('text/html')) return '';
      if (typeof cmd === 'string' && cmd.includes('text/rtf')) return '{\\rtf1 Hello}';
      return '';
    });

    const result = await readClipboard();

    expect(result).toEqual({ content: '{\\rtf1 Hello}', sourceFormat: 'rtf' });
  });

  it('returns text as fallback', async () => {
    vi.mocked(execSync).mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('text/html')) return '';
      if (typeof cmd === 'string' && cmd.includes('text/rtf')) return '';
      if (typeof cmd === 'string' && cmd.includes('-o')) return 'Plain text';
      return '';
    });

    const result = await readClipboard();

    expect(result).toEqual({ content: 'Plain text', sourceFormat: 'text' });
  });

  it('throws error when clipboard is empty', async () => {
    vi.mocked(execSync).mockImplementation(() => '');

    await expect(readClipboard()).rejects.toThrow(
      'Clipboard is empty or contains only images/files.'
    );
  });

  // macOS paths (osascript, pbpaste) are tested via integration on Mac.
  // The isMac flag is evaluated at module init time and can't be mocked per-test.
});

describe('writeClipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(platform).mockReturnValue('linux');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('writes text via xclip on Linux', async () => {
    vi.mocked(execSync).mockReturnValue('');

    await writeClipboard('Test content');

    expect(execSync).toHaveBeenCalledWith('xclip -selection clipboard', {
      input: 'Test content',
      encoding: 'utf-8',
    });
  });

  it('writes HTML via xclip with text/html type', async () => {
    vi.mocked(execSync).mockReturnValue('');

    await writeClipboard('<p>Hello</p>', 'html');

    expect(execSync).toHaveBeenCalledWith('xclip -selection clipboard -t text/html', {
      input: '<p>Hello</p>',
      encoding: 'utf-8',
    });
  });

  it('writes text when format is explicitly text', async () => {
    vi.mocked(execSync).mockReturnValue('');

    await writeClipboard('# Hello', 'text');

    expect(execSync).toHaveBeenCalledWith('xclip -selection clipboard', {
      input: '# Hello',
      encoding: 'utf-8',
    });
  });
});
