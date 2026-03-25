/**
 * Tests for code block wrapper
 */
import { describe, it, expect } from 'vitest';
import { wrapCodeBlock } from '../../src/converters/code-block/index.js';

describe('wrapCodeBlock', () => {
  it('wraps text in a fenced code block', () => {
    const result = wrapCodeBlock('hello world');
    expect(result).toBe('```\nhello world\n```\n');
  });

  it('detects Python', () => {
    const result = wrapCodeBlock('def greet(name):\n    print(f"Hello {name}")');
    expect(result).toMatch(/^```python\n/);
  });

  it('detects JavaScript', () => {
    const result = wrapCodeBlock('function foo() {\n  console.log("bar");\n}');
    expect(result).toMatch(/^```javascript\n/);
  });

  it('detects TypeScript', () => {
    const result = wrapCodeBlock('const x: string = "hello";\nexport default x;');
    expect(result).toMatch(/^```typescript\n/);
  });

  it('detects Rust', () => {
    const result = wrapCodeBlock('fn main() {\n    println!("hello");\n}');
    expect(result).toMatch(/^```rust\n/);
  });

  it('detects Go', () => {
    const result = wrapCodeBlock('package main\n\nfunc main() {\n\tfmt.Println("hi")\n}');
    expect(result).toMatch(/^```go\n/);
  });

  it('detects SQL', () => {
    const result = wrapCodeBlock('SELECT * FROM users WHERE id = 1;');
    expect(result).toMatch(/^```sql\n/);
  });

  it('detects bash via shebang', () => {
    const result = wrapCodeBlock('#!/bin/bash\necho "hello"');
    expect(result).toMatch(/^```bash\n/);
  });

  it('detects Dockerfile', () => {
    const result = wrapCodeBlock('FROM node:20\nRUN npm install\nCMD ["node", "index.js"]');
    expect(result).toMatch(/^```dockerfile\n/);
  });

  it('returns empty language for unrecognized content', () => {
    const result = wrapCodeBlock('just some random text here');
    expect(result).toBe('```\njust some random text here\n```\n');
  });

  it('trims trailing whitespace', () => {
    const result = wrapCodeBlock('code  \n  \n');
    expect(result).toBe('```\ncode\n```\n');
  });
});
