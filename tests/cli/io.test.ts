/**
 * Tests for I/O utilities with clipboard integration
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readInput, writeOutput } from '../../src/cli/utils/io.js';

// Mock clipboard module
vi.mock('../../src/cli/utils/clipboard.js', () => ({
  readClipboard: vi.fn(),
  writeClipboard: vi.fn(),
}));

import { readClipboard, writeClipboard } from '../../src/cli/utils/clipboard.js';

describe('readInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('throws error when --paste is used with file input', async () => {
    await expect(readInput('/some/file.txt', { paste: true })).rejects.toThrow(
      'Cannot use --paste with file input. Choose one.'
    );
  });

  it('calls readClipboard when paste option is true', async () => {
    vi.mocked(readClipboard).mockResolvedValue({
      content: '<p>HTML from clipboard</p>',
      sourceFormat: 'html',
    });

    const result = await readInput(undefined, { paste: true });

    expect(readClipboard).toHaveBeenCalled();
    expect(result).toEqual({
      content: '<p>HTML from clipboard</p>',
      sourceFormat: 'html',
    });
  });

  it('returns sourceFormat from clipboard read', async () => {
    vi.mocked(readClipboard).mockResolvedValue({
      content: '{\\rtf1 RTF content}',
      sourceFormat: 'rtf',
    });

    const result = await readInput(undefined, { paste: true });

    expect(result.sourceFormat).toBe('rtf');
  });
});

describe('writeOutput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('throws error when --copy is used with file output', async () => {
    await expect(
      writeOutput('/some/output.md', 'content', { copy: true })
    ).rejects.toThrow('Cannot use --copy with file output. Choose one.');
  });

  it('calls writeClipboard when copy option is true', async () => {
    vi.mocked(writeClipboard).mockResolvedValue(undefined);

    await writeOutput(undefined, 'Markdown content', { copy: true });

    expect(writeClipboard).toHaveBeenCalledWith('Markdown content');
  });

  it('does not write to stdout when copy option is true', async () => {
    vi.mocked(writeClipboard).mockResolvedValue(undefined);
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await writeOutput(undefined, 'Markdown content', { copy: true });

    expect(stdoutSpy).not.toHaveBeenCalled();
    stdoutSpy.mockRestore();
  });
});
