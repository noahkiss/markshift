# Phase 1: Foundation - Research

**Researched:** 2026-01-22
**Domain:** TypeScript project setup, converter interface design, registry pattern
**Confidence:** HIGH

## Summary

Phase 1 establishes the TypeScript project structure and core abstractions that all subsequent phases depend on. The research confirms that modern TypeScript 5.9+ with strict mode, Vitest 4.x for testing, and tsx for development execution represents the current standard stack for Node.js CLI tools in 2026.

The converter interface design draws from established patterns in turndown (HTML-to-Markdown) and marked (Markdown-to-HTML) libraries, which both use a simple function-based approach with options objects. The registry pattern should use a simple Map-based lookup by format pair (e.g., "html-to-markdown") rather than dependency injection frameworks, keeping the system lightweight and easy to understand.

**Primary recommendation:** Use TypeScript 5.9+ with strict mode, Vitest 4.x for testing, and a simple Map-based converter registry keyed by format pairs like "html->markdown".

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| typescript | 5.9.3 | Type-safe JavaScript | Industry standard, strict mode catches bugs at compile time |
| vitest | 4.0.18 | Unit testing framework | Vite-native, fast, Jest-compatible, TypeScript-first |
| tsx | 4.21.0 | TypeScript execution | Fastest way to run TS during development, built on esbuild |
| @types/node | 25.0.10 | Node.js type definitions | Required for Node.js APIs in TypeScript |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitest/coverage-v8 | 4.x | Code coverage | Enable when coverage reporting needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vitest | jest | Jest is slower, less TypeScript-native; Vitest is the modern choice |
| tsx | ts-node | ts-node is slower (500ms+ vs 20ms compile); tsx is built on esbuild |
| tsx | native node | Node.js 22.18+ has native TS support but lacks full TypeScript features like enums |

**Installation:**
```bash
npm install -D typescript vitest tsx @types/node
```

## Architecture Patterns

### Recommended Project Structure
```
markshift/
├── src/
│   ├── converters/           # Converter implementations (one per format pair)
│   │   └── index.ts          # Registry and base interfaces
│   ├── cli/                  # CLI implementation (Phase 4)
│   │   └── index.ts
│   ├── types/                # Shared type definitions
│   │   └── index.ts
│   └── index.ts              # Main entry point, exports public API
├── tests/
│   ├── converters/           # Converter tests mirror src structure
│   └── setup.ts              # Test setup file
├── dist/                     # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Pattern 1: Converter Interface
**What:** A simple function-based interface for all converters, following turndown/marked patterns
**When to use:** Every converter implementation must implement this interface
**Example:**
```typescript
// Source: Pattern derived from turndown and marked APIs

/**
 * Options that can be passed to any converter
 */
export interface ConvertOptions {
  /** Preserve semantic meaning over visual appearance */
  semantic?: boolean;
  /** Custom rules/extensions for this conversion */
  rules?: Record<string, unknown>;
}

/**
 * Result of a conversion operation
 */
export interface ConvertResult {
  /** The converted content */
  content: string;
  /** Metadata about the conversion */
  metadata?: {
    /** Original format */
    sourceFormat: string;
    /** Target format */
    targetFormat: string;
    /** Processing time in milliseconds */
    processingTimeMs?: number;
  };
}

/**
 * Core converter interface - all converters implement this
 */
export interface Converter {
  /** Source format this converter reads */
  readonly sourceFormat: string;
  /** Target format this converter produces */
  readonly targetFormat: string;
  /** Convert content from source to target format */
  convert(input: string, options?: ConvertOptions): ConvertResult;
}
```

### Pattern 2: Format Pair Registry
**What:** Map-based registry keyed by "source->target" format pairs
**When to use:** Looking up the appropriate converter for a conversion task
**Example:**
```typescript
// Source: Simplified service locator pattern for converters

type FormatPair = `${string}->${string}`;

class ConverterRegistry {
  private converters = new Map<FormatPair, Converter>();

  register(converter: Converter): void {
    const key: FormatPair = `${converter.sourceFormat}->${converter.targetFormat}`;
    if (this.converters.has(key)) {
      throw new Error(`Converter already registered for ${key}`);
    }
    this.converters.set(key, converter);
  }

  get(source: string, target: string): Converter | undefined {
    const key: FormatPair = `${source}->${target}`;
    return this.converters.get(key);
  }

  has(source: string, target: string): boolean {
    const key: FormatPair = `${source}->${target}`;
    return this.converters.has(key);
  }

  list(): Array<{ source: string; target: string }> {
    return Array.from(this.converters.values()).map(c => ({
      source: c.sourceFormat,
      target: c.targetFormat,
    }));
  }
}

// Singleton instance for the application
export const registry = new ConverterRegistry();
```

### Pattern 3: Test Structure for Converters
**What:** Describe/it blocks with input/output pairs
**When to use:** All converter tests follow this pattern
**Example:**
```typescript
// Source: Vitest documentation pattern

import { describe, it, expect, beforeEach } from 'vitest';
import { registry } from '../src/converters';

describe('Converter Registry', () => {
  beforeEach(() => {
    // Reset registry state if needed
  });

  it('should register a converter', () => {
    const mockConverter: Converter = {
      sourceFormat: 'html',
      targetFormat: 'markdown',
      convert: (input) => ({ content: input, metadata: { sourceFormat: 'html', targetFormat: 'markdown' } }),
    };

    registry.register(mockConverter);
    expect(registry.has('html', 'markdown')).toBe(true);
  });

  it('should retrieve registered converter', () => {
    const converter = registry.get('html', 'markdown');
    expect(converter).toBeDefined();
  });
});
```

### Anti-Patterns to Avoid
- **Over-engineering with DI frameworks:** tsyringe, InversifyJS add complexity without benefit for this use case. A simple Map registry is sufficient.
- **Async converter interface:** Converters should be synchronous for simplicity. I/O operations (file reading, clipboard access) happen outside the converter.
- **Format detection in converters:** Converters know their exact format pair. Format detection is a separate concern handled by the CLI layer.
- **Stateful converters:** Converters should be stateless - all configuration passed via options.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript compilation | Custom build scripts | tsc + tsx | TypeScript compiler handles all edge cases |
| Test framework | Custom test runner | Vitest | Watch mode, coverage, assertions, mocking |
| Type declarations | Manual .d.ts | TypeScript declaration: true | Compiler generates accurate types |
| Module resolution | Custom resolver | NodeNext in tsconfig | Handles ESM/CJS interop correctly |

**Key insight:** The foundation phase is about configuration, not custom code. The goal is minimal custom code, maximum standard tooling.

## Common Pitfalls

### Pitfall 1: Module System Confusion (ESM vs CommonJS)
**What goes wrong:** Import/export errors at runtime, "Cannot use import statement outside a module"
**Why it happens:** Mixing ESM and CJS syntax, or mismatched tsconfig/package.json settings
**How to avoid:**
- Set `"type": "module"` in package.json for ESM
- Use `"module": "NodeNext"` and `"moduleResolution": "NodeNext"` in tsconfig
- Use `import`/`export` consistently, never `require()`
**Warning signs:** TypeScript compiles but node fails to run the output

### Pitfall 2: Missing Strict Mode
**What goes wrong:** Runtime type errors that TypeScript should have caught
**Why it happens:** Default tsconfig has `strict: false`
**How to avoid:** Always set `"strict": true` in tsconfig.json from day one
**Warning signs:** Implicit `any` types, nullable values not checked

### Pitfall 3: Global vs Local TypeScript
**What goes wrong:** Different behavior on different machines, CI failures
**Why it happens:** Using global `tsc` instead of project-local version
**How to avoid:**
- Install typescript as devDependency
- Run via `npx tsc` or npm scripts
- Never rely on global installation
**Warning signs:** "Works on my machine" syndrome

### Pitfall 4: Test Files in Build Output
**What goes wrong:** Test files compiled to dist/, included in npm package
**Why it happens:** tsconfig.json includes test files in compilation
**How to avoid:**
- Exclude tests in tsconfig.json: `"exclude": ["tests/**/*", "**/*.test.ts"]`
- Keep tests in separate `tests/` directory
- Use separate tsconfig.build.json if needed
**Warning signs:** dist/ folder contains test files

### Pitfall 5: Interface vs Type Confusion
**What goes wrong:** Inconsistent code style, missed declaration merging opportunities
**Why it happens:** Not understanding when to use each
**How to avoid:**
- Use `interface` for object shapes and contracts (Converter, ConvertOptions)
- Use `type` for unions, intersections, primitives, and tuples
- Be consistent across the codebase
**Warning signs:** Mixing interface and type for similar purposes

### Pitfall 6: Overcomplicating the Registry
**What goes wrong:** Unnecessary DI framework, complex service locator, hard to debug
**Why it happens:** Applying enterprise patterns to simple problems
**How to avoid:**
- Start with a simple Map-based registry
- Add complexity only when needed (it won't be needed)
- Keep the registry under 50 lines of code
**Warning signs:** Registry has dependencies, requires decorators, uses reflection

## Code Examples

Verified patterns from official sources:

### tsconfig.json for Node.js CLI
```json
// Source: Total TypeScript tsconfig cheat sheet + TypeScript 5.9 defaults
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### vitest.config.ts
```typescript
// Source: Vitest documentation
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts'],
    },
  },
});
```

### package.json scripts
```json
// Source: Best practices for npm CLI packages
{
  "name": "markshift",
  "version": "0.0.1",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^25.0.0",
    "tsx": "^4.21.0",
    "typescript": "^5.9.0",
    "vitest": "^4.0.0"
  }
}
```

### Basic Type Definitions
```typescript
// Source: TypeScript handbook patterns + turndown/marked API style

/**
 * Supported format identifiers
 */
export type Format = 'html' | 'markdown' | 'rtf' | 'jira' | 'text';

/**
 * A format pair identifier like "html->markdown"
 */
export type FormatPair = `${Format}->${Format}`;

/**
 * Validates if a string is a valid format
 */
export function isValidFormat(value: string): value is Format {
  return ['html', 'markdown', 'rtf', 'jira', 'text'].includes(value);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ts-node for execution | tsx (esbuild-based) | 2023-2024 | 25x faster startup |
| Jest for testing | Vitest | 2022-2024 | Native ESM, faster, TypeScript-first |
| CommonJS modules | ESM with NodeNext | 2023-2024 | Better tree-shaking, standard compliance |
| tsc --init defaults | Strict mode + NodeNext | TypeScript 5.9 (2026) | Better defaults out of the box |
| Separate moduleResolution | module: NodeNext implies it | TypeScript 5.x | One less setting to configure |

**Deprecated/outdated:**
- ts-node: Still works but tsx is faster and simpler
- Jest: Still works but Vitest is the modern TypeScript-first choice
- module: "CommonJS": Use NodeNext for new projects
- experimentalDecorators: Not needed without DI frameworks

## Open Questions

Things that couldn't be fully resolved:

1. **Format detection heuristics for Phase 5**
   - What we know: CLI layer will need to detect input format
   - What's unclear: Best heuristics for HTML vs Markdown vs RTF detection
   - Recommendation: Defer to Phase 5 research, foundation doesn't need this

2. **Converter options standardization**
   - What we know: Each converter (turndown, marked) has different options
   - What's unclear: How much to normalize vs pass-through
   - Recommendation: Define minimal common options in ConvertOptions, allow converter-specific options via `rules` property

## Sources

### Primary (HIGH confidence)
- `/websites/typescriptlang` (Context7) - tsconfig.json strict mode, module settings
- `/vitest-dev/vitest` (Context7) - Test configuration, describe/it patterns, hooks
- `/mixmark-io/turndown` (Context7) - Converter interface patterns, addRule API
- `/markedjs/marked` (Context7) - Extension API, renderer patterns
- https://www.totaltypescript.com/tsconfig-cheat-sheet - Complete tsconfig recommendations
- https://tsx.is/getting-started - tsx installation and usage

### Secondary (MEDIUM confidence)
- https://dev.to/hongminhee/building-cli-apps-with-typescript-in-2026-5c9d - CLI patterns 2026
- https://medium.com/@pyyupsk/how-i-build-an-npm-package-in-2026-4bb1a4b88e11 - npm package setup 2026
- npm registry version checks (typescript 5.9.3, vitest 4.0.18, tsx 4.21.0)

### Tertiary (LOW confidence)
- WebSearch results on TypeScript mistakes - General patterns, not verified with official docs
- Service locator pattern discussions - Used for anti-pattern guidance only

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Versions verified via npm, patterns verified via Context7
- Architecture: HIGH - Patterns derived from established libraries (turndown, marked, Vitest)
- Pitfalls: MEDIUM - Aggregated from multiple sources, not all officially verified

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - stable ecosystem)
