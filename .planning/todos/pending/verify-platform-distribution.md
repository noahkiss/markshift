# TODO: Verify Platform Distribution (Phase 9)

**Created:** 2026-01-24
**Phase:** 09-platform-distribution
**Priority:** Medium

## Verification Checklist

- [ ] **Package contents** — Run `npm pack --dry-run` and verify dist/, README.md, package.json only (no src/)
- [ ] **npm publish** — When ready: `npm publish`
- [ ] **Get SHA256** — `curl -sL https://registry.npmjs.org/markshift/-/markshift-0.0.1.tgz | sha256sum`
- [ ] **Update formula** — Replace PLACEHOLDER_SHA256 in `~/develop/homebrew-tap/Formula/markshift.rb`
- [ ] **Commit formula** — `cd ~/develop/homebrew-tap && git add Formula/markshift.rb && git commit -m "Add markshift formula" && git push`
- [ ] **Test installation** — `brew install noahkiss/tap/markshift && markshift --version`

## Context

Phase 9 prepared the distribution infrastructure:
- package.json has npm publish metadata (repository, files, engines, bugs, homepage)
- Homebrew formula created with placeholder SHA256
- Formula includes Linux X11 caveats for clipboard support

The formula won't work until npm publish and SHA256 update are complete.

## Related

- `.planning/todos/pending/verify-clipboard-integration.md` - Phase 6 clipboard testing
