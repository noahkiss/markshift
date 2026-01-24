# Phase 9: Platform & Distribution - Research

**Researched:** 2026-01-24
**Domain:** Cross-platform packaging, Homebrew formula creation, Linux compatibility
**Confidence:** HIGH

## Summary

This research investigates how to distribute markshift as a cross-platform CLI tool installable via Homebrew. The project is a TypeScript ESM application with native Node.js addon dependencies (@crosscopy/clipboard uses napi-rs/Rust bindings).

The recommended approach is to create a Homebrew formula that uses npm to install the package with its prebuilt native binaries. Node.js SEA (Single Executable Applications) was considered but is not suitable due to ESM incompatibility and native addon complexity. The @crosscopy/clipboard library provides prebuilt binaries for Linux x64 and ARM64, which rely on X11 at runtime (not Wayland).

**Primary recommendation:** Create a Homebrew formula using `std_npm_args` that depends on `node`, downloads from npm registry, and symlinks the CLI binary. For Linux support, document X11 as a runtime requirement.

## Standard Stack

The established approach for distributing Node.js CLI tools via Homebrew:

### Core
| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Homebrew Formula | Ruby DSL | Package definition | Official Homebrew method for Node packages |
| npm registry tarball | Latest | Package source | Preferred over GitHub - smaller, pre-transpiled |
| `std_npm_args` | Homebrew helper | npm install wrapper | Handles cache, prefix, edge cases automatically |
| Node.js | >=20 LTS | Runtime | Homebrew's `node` formula, LTS for stability |

### Supporting
| Component | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| Custom tap | N/A | Formula hosting | Required for non-homebrew-core packages |
| `python` build dep | System | Native addon compilation | Only if prebuilds unavailable |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| npm tarball | GitHub tarball | Larger download, may need build step |
| Node.js runtime | SEA (Single Executable) | ESM not supported, native addon complexity |
| Node.js runtime | pkg/nexe bundler | Deprecated/stale, native addon issues |
| Homebrew | Direct npm global install | No version management, no uninstall tracking |

**Installation (for users):**
```bash
brew install noahkiss/tap/markshift
```

## Architecture Patterns

### Homebrew Formula Structure for Node.js CLI

```ruby
# Formula/markshift.rb
class Markshift < Formula
  desc "Suite of tools for converting text to and from Markdown format"
  homepage "https://github.com/noahkiss/markshift"
  url "https://registry.npmjs.org/markshift/-/markshift-X.Y.Z.tgz"
  sha256 "<sha256-of-tarball>"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec.glob("bin/*")
  end

  def caveats
    <<~EOS
      On Linux, clipboard functionality requires X11.
      Install xorg-dev or equivalent for your distribution.

      Wayland users: clipboard features require XWayland.
    EOS
  end

  test do
    assert_match "markshift", shell_output("#{bin}/markshift --help")
    # Test basic conversion
    assert_match "<p>hello</p>", shell_output("echo '# hello' | #{bin}/markshift md-to-html")
  end
end
```

### Custom Tap Structure

The user already has `~/develop/homebrew-tap` with this structure:
```
homebrew-tap/
├── Formula/
│   └── markshift.rb    # New formula goes here
├── README.md
└── CLAUDE.md
```

### Release Workflow Pattern

1. **Version bump:** `npm version patch/minor/major`
2. **Publish to npm:** `npm publish` (or GitHub Actions)
3. **Update formula:**
   - Update `url` with new version
   - Update `sha256` with `curl -sL <tarball-url> | sha256sum`
4. **Commit formula:** Push to homebrew-tap repo
5. **Users update:** `brew update && brew upgrade markshift`

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| npm installation in Homebrew | Custom npm flags | `std_npm_args` | Handles cache dir, prefix, HOME redirect |
| Binary symlinking | Manual bin setup | `bin.install_symlink libexec.glob("bin/*")` | Homebrew convention, handles multiple bins |
| Native addon builds | Manual node-gyp | Prebuilt binaries from @crosscopy/clipboard | Already published for linux-x64-gnu, linux-arm64-gnu |
| Single executable | Build with SEA/pkg | Keep as npm package | ESM incompatible with SEA, native addon complexity |
| Cross-platform clipboard | Custom implementation | @crosscopy/clipboard prebuilts | Rust-backed, published for all major platforms |

**Key insight:** Node.js SEA (Single Executable Applications) does NOT support ESM modules and has significant complexity with native addons. The project uses ESM (`"type": "module"` in package.json), making SEA infeasible without major refactoring to CommonJS.

## Common Pitfalls

### Pitfall 1: ESM and Single Executables
**What goes wrong:** Attempting to use Node.js SEA with ESM modules fails
**Why it happens:** SEA only supports CommonJS; ESM is explicitly not supported
**How to avoid:** Don't use SEA for this project; use npm-based distribution
**Warning signs:** "import" statements in source, `"type": "module"` in package.json

### Pitfall 2: Native Addon ABI Compatibility
**What goes wrong:** Formula works on initial install but breaks after Node.js major version upgrade
**Why it happens:** Native addons compiled against one Node.js ABI don't work with another
**How to avoid:** @crosscopy/clipboard uses napi-rs with prebuilt binaries, which are ABI-stable across Node versions
**Warning signs:** "was compiled against a different Node.js version" errors

### Pitfall 3: Linux Clipboard X11 Requirement
**What goes wrong:** Clipboard operations fail on headless Linux or pure Wayland
**Why it happens:** @crosscopy/clipboard (via clipboard-rs) only supports X11, not Wayland natively
**How to avoid:** Document X11 requirement; recommend XWayland for Wayland users
**Warning signs:** "Failed to create X server context" errors, empty clipboard reads

### Pitfall 4: npm Cache Issues in Homebrew Builds
**What goes wrong:** Extremely slow builds, disk space issues
**Why it happens:** Homebrew redirects HOME during builds; npm cache gets recreated
**How to avoid:** Always use `std_npm_args` which sets up custom cache in HOMEBREW_CACHE
**Warning signs:** Multi-minute installs, large disk usage during install

### Pitfall 5: Missing Shebang in Compiled Output
**What goes wrong:** Installed binary fails with "cannot execute binary file"
**Why it happens:** TypeScript compilation may not preserve shebang from source
**How to avoid:** Ensure `dist/cli/index.js` has `#!/usr/bin/env node` at top
**Warning signs:** Check current build output - `src/cli/index.ts` has shebang

### Pitfall 6: Homebrew on Linux Installation Path
**What goes wrong:** Formula assumes macOS paths
**Why it happens:** Linux Homebrew uses `/home/linuxbrew/.linuxbrew` not `/usr/local`
**How to avoid:** Use Homebrew DSL (libexec, bin) which abstracts paths
**Warning signs:** Hardcoded paths in formula

## Code Examples

Verified patterns from official sources:

### Complete Homebrew Formula for Node.js CLI with Native Addons
```ruby
# Source: https://docs.brew.sh/Node-for-Formula-Authors
class Markshift < Formula
  desc "Suite of tools for converting text to and from Markdown format"
  homepage "https://github.com/noahkiss/markshift"
  url "https://registry.npmjs.org/markshift/-/markshift-0.0.1.tgz"
  sha256 "PLACEHOLDER_SHA256"
  license "MIT"
  head "https://github.com/noahkiss/markshift.git", branch: "main"

  depends_on "node"

  def install
    # std_npm_args handles:
    # - Custom npm cache to avoid HOME redirect issues
    # - Correct prefix for libexec installation
    # - Package-lock handling
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec.glob("bin/*")
  end

  def caveats
    <<~EOS
      Clipboard support on Linux requires X11.

      For Debian/Ubuntu:
        sudo apt install xorg-dev libxcb-composite0-dev

      For Fedora:
        sudo dnf install libX11-devel libxcb-devel

      Wayland users should enable XWayland for clipboard functionality.
    EOS
  end

  test do
    # Test CLI runs
    assert_match version.to_s, shell_output("#{bin}/markshift --version")

    # Test basic markdown to HTML conversion
    output = shell_output("echo '**bold**' | #{bin}/markshift md-to-html")
    assert_match "<strong>bold</strong>", output

    # Test HTML to markdown conversion
    output = shell_output("echo '<p>hello</p>' | #{bin}/markshift html-to-md")
    assert_match "hello", output
  end
end
```

### Getting npm Tarball SHA256
```bash
# Source: https://github.com/Homebrew/brew/blob/master/docs/Node-for-Formula-Authors.md
curl -sL https://registry.npmjs.org/markshift/-/markshift-0.0.1.tgz | sha256sum
```

### Updating Formula Version
```bash
# After npm publish
VERSION="1.0.0"
URL="https://registry.npmjs.org/markshift/-/markshift-${VERSION}.tgz"
SHA=$(curl -sL "$URL" | sha256sum | cut -d' ' -f1)
echo "url \"$URL\""
echo "sha256 \"$SHA\""
```

## Linux Compatibility Details

### @crosscopy/clipboard Platform Support
The native clipboard library provides prebuilt binaries for:

| Platform | Architecture | Package Name | Status |
|----------|--------------|--------------|--------|
| Linux | x64 | @crosscopy/clipboard-linux-x64-gnu | Available |
| Linux | ARM64 | @crosscopy/clipboard-linux-arm64-gnu | Available |
| Linux | RISC-V 64 | @crosscopy/clipboard-linux-riscv64-gnu | Available |
| macOS | x64 | @crosscopy/clipboard-darwin-x64 | Available |
| macOS | ARM64 | @crosscopy/clipboard-darwin-arm64 | Available |
| macOS | Universal | @crosscopy/clipboard-darwin-universal | Available |
| Windows | x64 | @crosscopy/clipboard-win32-x64-msvc | Available |
| Windows | ARM64 | @crosscopy/clipboard-win32-arm64-msvc | Available |

### Linux Native Binary Dependencies
Verified via `ldd` analysis of the prebuilt binary:
```
linux-vdso.so.1
libgcc_s.so.1 => /lib/x86_64-linux-gnu/libgcc_s.so.1
librt.so.1
libpthread.so.0
libm.so.6
libdl.so.2
libc.so.6
/lib64/ld-linux-x86-64.so.2
```

**Key finding:** The native binary statically links X11 libraries (x11rb crate). No X11 shared libraries needed at link time, but X11 server connection required at runtime.

### Runtime Requirements
- **X11 display server:** Required for clipboard operations
- **DISPLAY environment variable:** Must be set for clipboard access
- **Wayland:** Requires XWayland compatibility layer

### Graceful Degradation Strategy
Non-clipboard commands should work without X11. Clipboard commands should fail with clear error message:
```
Error: Clipboard access requires X11.
Ensure DISPLAY is set and X11 server is running.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| node-gyp compilation | napi-rs prebuilt binaries | 2022+ | No build tools needed at install |
| GitHub tarball source | npm registry tarball | Always preferred | Smaller, pre-built, no dev deps |
| pkg/nexe bundling | Native npm + Homebrew | 2024 | SEA is official but limited |
| Linuxbrew fork | Unified Homebrew | 2019 | Single codebase for macOS/Linux |

**Deprecated/outdated:**
- **pkg (vercel/pkg):** Development stopped, doesn't support Node 20+
- **nexe:** Minimal maintenance, native addon issues
- **Node.js SEA for ESM:** Explicitly not supported as of Node 22

## Open Questions

Things that couldn't be fully resolved:

1. **Wayland Native Support**
   - What we know: @crosscopy/clipboard uses clipboard-rs which only supports X11
   - What's unclear: Whether future versions will add Wayland support
   - Recommendation: Document X11 requirement; accept XWayland as workaround; consider alternative clipboard library if Wayland becomes critical

2. **Headless Linux Operation**
   - What we know: Clipboard requires X11 display
   - What's unclear: Exact error handling behavior when no display
   - Recommendation: Test on headless system; ensure non-clipboard commands work; add try-catch around clipboard operations

3. **Formula Submission to homebrew-core**
   - What we know: Custom tap works immediately; homebrew-core has review process
   - What's unclear: Acceptance criteria, timeline, maintenance requirements
   - Recommendation: Start with custom tap; consider homebrew-core submission after project matures

## Sources

### Primary (HIGH confidence)
- [Homebrew Node for Formula Authors](https://docs.brew.sh/Node-for-Formula-Authors) - Official formula creation guide
- [Homebrew/brew GitHub docs](https://github.com/Homebrew/brew/blob/master/docs/Node-for-Formula-Authors.md) - Source documentation
- [Node.js SEA Documentation](https://nodejs.org/api/single-executable-applications.html) - Official SEA limitations
- `ldd` analysis of @crosscopy/clipboard native binary - Runtime dependencies
- @crosscopy/clipboard package.json - Platform support matrix

### Secondary (MEDIUM confidence)
- [Homebrew on Linux Documentation](https://docs.brew.sh/Homebrew-on-Linux) - Linux-specific considerations
- [napi-rs Cross Compilation](https://napi.rs/docs/cross-build) - Native addon build process
- Existing formula at `~/develop/homebrew-tap/Formula/notify-mcp.rb` - Working example in user's tap

### Tertiary (LOW confidence)
- [clipboard-rs GitHub](https://github.com/ChurchTao/clipboard-rs) - X11-only limitation (docs incomplete)
- WebSearch results for Wayland clipboard support - Community discussions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Homebrew documentation is comprehensive
- Architecture: HIGH - Pattern matches existing formula in user's tap
- Linux clipboard: MEDIUM - Verified binary deps but runtime behavior needs testing
- Pitfalls: HIGH - Well-documented in official sources

**Research date:** 2026-01-24
**Valid until:** 2026-03-24 (Homebrew patterns stable; clipboard library may update)
