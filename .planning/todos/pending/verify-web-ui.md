# TODO: Verify Web UI (Phase 10)

**Created:** 2026-01-24
**Phase:** 10-github-pages-web-ui
**Priority:** Medium

## Verification Checklist

- [ ] **Start server** — `cd ~/develop/markshift && npx serve docs -l 6275`
- [ ] **HTML to Markdown** — Paste `<h1>Test</h1><p>Hello <strong>world</strong></p>`, verify output
- [ ] **Markdown to HTML** — Select mode, paste `# Test`, verify `<h1>Test</h1>` in output
- [ ] **Content extraction** — Check "Extract main content", paste full web page HTML, verify article extraction
- [ ] **Copy button** — Click "Copy to Clipboard", verify it copies and shows "Copied!"
- [ ] **Dark mode** — Toggle system theme, verify colors adjust

## Deployment Checklist

After verification passes:
- [ ] **Push to GitHub** — `git push origin main`
- [ ] **Enable GitHub Pages** — Settings > Pages > Source: GitHub Actions
- [ ] **Verify deployment** — Check https://noahkiss.github.io/markshift/

## Context

Phase 10 built a browser-based web UI for markshift conversions:
- Vite bundler with GitHub Pages base path
- Browser-specific converters using native DOMParser
- HTML/CSS/JS interface with dark mode
- GitHub Actions workflow for automated deployment

Standard port: **6275** (T9 for "mark")

## Related

- `.planning/todos/pending/verify-platform-distribution.md` - Phase 9 npm publish
- `.planning/todos/pending/verify-clipboard-integration.md` - Phase 6 clipboard testing
