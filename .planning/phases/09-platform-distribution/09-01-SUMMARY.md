# Plan 09-01 Summary: Package Metadata and Homebrew Formula

**Completed:** 2026-01-24
**Duration:** 5 min
**Status:** Complete (verification deferred)

## What Was Built

### package.json npm publish metadata
Updated package.json with all fields required for npm publish:
- `repository`: GitHub repo URL
- `files`: ["dist", "README.md"] - only published files
- `engines`: {"node": ">=20.0.0"} - minimum Node version
- `bugs`: GitHub issues URL
- `homepage`: GitHub readme URL

### Homebrew formula
Created `/home/flight/develop/homebrew-tap/Formula/markshift.rb`:
- Uses npm registry tarball as source
- Depends on `node` formula
- Uses `std_npm_args` for proper npm cache handling
- Includes Linux X11 caveats for clipboard support
- Tests verify CLI runs and basic conversions work
- Placeholder SHA256 (to be updated after npm publish)

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| npm registry tarball over GitHub | Smaller download, pre-transpiled, no dev deps |
| std_npm_args helper | Handles cache, prefix, edge cases automatically |
| Placeholder SHA256 | Can't compute until package is published |
| Linux X11 caveats | @crosscopy/clipboard requires X11, not Wayland native |

## Commits

- `3726354` - feat(09-01): add npm publish metadata to package.json
- `48b12bf` - feat: add markshift formula (in homebrew-tap repo)

## Verification Deferred

Human verification checkpoint deferred to `.planning/todos/pending/verify-platform-distribution.md`:
- npm pack --dry-run
- npm publish (when ready)
- Get SHA256 and update formula
- Commit formula with real SHA
- Test brew install

## Test Results

No new tests added (infrastructure only).
Total tests: 209 passing (unchanged from Phase 8).

## Files Changed

- `package.json` - Added npm publish metadata
- `/home/flight/develop/homebrew-tap/Formula/markshift.rb` - New Homebrew formula
