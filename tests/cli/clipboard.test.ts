/**
 * Tests for clipboard utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @crosscopy/clipboard before importing
vi.mock('@crosscopy/clipboard', () => ({
  default: {
    hasHtml: vi.fn(),
    hasRtf: vi.fn(),
    hasText: vi.fn(),
    getHtml: vi.fn(),
    getRtf: vi.fn(),
    getText: vi.fn(),
    setText: vi.fn(),
  },
}));

import Clipboard from '@crosscopy/clipboard';
import { readClipboard, writeClipboard } from '../../src/cli/utils/clipboard.js';

describe('readClipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns HTML content when HTML is available (highest preference)', async () => {
    vi.mocked(Clipboard.hasHtml).mockResolvedValue(true);
    vi.mocked(Clipboard.hasRtf).mockResolvedValue(true);
    vi.mocked(Clipboard.hasText).mockResolvedValue(true);
    vi.mocked(Clipboard.getHtml).mockResolvedValue('<p>Hello World</p>');

    const result = await readClipboard();

    expect(result).toEqual({
      content: '<p>Hello World</p>',
      sourceFormat: 'html',
    });
    expect(Clipboard.hasHtml).toHaveBeenCalled();
    expect(Clipboard.getHtml).toHaveBeenCalled();
    // Should not check lower priority formats when HTML is available
    expect(Clipboard.getRtf).not.toHaveBeenCalled();
    expect(Clipboard.getText).not.toHaveBeenCalled();
  });

  it('returns RTF content when only RTF and text are available', async () => {
    vi.mocked(Clipboard.hasHtml).mockResolvedValue(false);
    vi.mocked(Clipboard.hasRtf).mockResolvedValue(true);
    vi.mocked(Clipboard.hasText).mockResolvedValue(true);
    vi.mocked(Clipboard.getRtf).mockResolvedValue('{\\rtf1 Hello}');

    const result = await readClipboard();

    expect(result).toEqual({
      content: '{\\rtf1 Hello}',
      sourceFormat: 'rtf',
    });
    expect(Clipboard.hasHtml).toHaveBeenCalled();
    expect(Clipboard.hasRtf).toHaveBeenCalled();
    expect(Clipboard.getRtf).toHaveBeenCalled();
    expect(Clipboard.getText).not.toHaveBeenCalled();
  });

  it('returns text content as fallback when only text is available', async () => {
    vi.mocked(Clipboard.hasHtml).mockResolvedValue(false);
    vi.mocked(Clipboard.hasRtf).mockResolvedValue(false);
    vi.mocked(Clipboard.hasText).mockResolvedValue(true);
    vi.mocked(Clipboard.getText).mockResolvedValue('Plain text content');

    const result = await readClipboard();

    expect(result).toEqual({
      content: 'Plain text content',
      sourceFormat: 'text',
    });
    expect(Clipboard.hasHtml).toHaveBeenCalled();
    expect(Clipboard.hasRtf).toHaveBeenCalled();
    expect(Clipboard.hasText).toHaveBeenCalled();
    expect(Clipboard.getText).toHaveBeenCalled();
  });

  it('throws error when clipboard is empty', async () => {
    vi.mocked(Clipboard.hasHtml).mockResolvedValue(false);
    vi.mocked(Clipboard.hasRtf).mockResolvedValue(false);
    vi.mocked(Clipboard.hasText).mockResolvedValue(false);

    await expect(readClipboard()).rejects.toThrow(
      'Clipboard is empty or contains only images/files.\n' +
        'Copy some text, HTML, or RTF content first.'
    );
  });
});

describe('writeClipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('calls setText with provided content', async () => {
    vi.mocked(Clipboard.setText).mockResolvedValue(undefined);

    await writeClipboard('Test content');

    expect(Clipboard.setText).toHaveBeenCalledWith('Test content');
    expect(Clipboard.setText).toHaveBeenCalledTimes(1);
  });

  it('handles empty string content', async () => {
    vi.mocked(Clipboard.setText).mockResolvedValue(undefined);

    await writeClipboard('');

    expect(Clipboard.setText).toHaveBeenCalledWith('');
  });

  it('handles large content', async () => {
    vi.mocked(Clipboard.setText).mockResolvedValue(undefined);
    const largeContent = 'A'.repeat(100000);

    await writeClipboard(largeContent);

    expect(Clipboard.setText).toHaveBeenCalledWith(largeContent);
  });
});
