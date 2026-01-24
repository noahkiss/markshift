# TODO: Verify Phase 6 Clipboard Integration

**Created:** 2026-01-24
**Phase:** 06-clipboard-integration
**Priority:** Medium

## Context

Phase 6 (Clipboard Integration) automated verification passed. Human testing deferred.

## Verification Checklist

- [ ] **macOS Clipboard Read** — Copy HTML from browser, run `npm run cli -- convert --paste`
- [ ] **macOS Clipboard Write** — Run `echo "<h1>Test</h1>" | npm run cli -- convert --copy`, then paste
- [ ] **Format Preference** — Copy rich content, verify HTML selected over plain text with `--verbose`
- [ ] **RTF Warning** — Copy RTF from Notes/TextEdit, verify warning message appears
- [ ] **Linux Clipboard** — Test clipboard operations on Linux
- [ ] **Mutual Exclusivity** — Test `--paste` with file input, `--copy` with file output (should error)

## Commands

```bash
# Build first
npm run build

# Test read from clipboard
npm run cli -- convert --paste

# Test write to clipboard
echo "<h1>Test</h1>" | npm run cli -- convert --copy

# Test mutual exclusivity (should error)
npm run cli -- convert --paste input.html
npm run cli -- convert --copy -o output.md
```

## Notes

All automated checks passed (169 tests). This is runtime/platform verification only.
