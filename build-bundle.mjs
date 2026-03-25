#!/usr/bin/env node
/**
 * Build a standalone single-file CLI bundle via esbuild.
 * Output: dist/markshift (executable, no dependencies needed beyond Node.js)
 */
import * as esbuild from 'esbuild';
import { writeFileSync, readFileSync, chmodSync } from 'node:fs';

const outfile = process.argv[2] || 'dist/markshift';

await esbuild.build({
  entryPoints: ['src/cli/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile,
  // Don't add banner — we'll prepend shebang ourselves to avoid duplication
  // with the shebang already in src/cli/index.ts
});

// Prepend shebang and strip the escaped duplicate
let content = readFileSync(outfile, 'utf-8');
// Remove the escaped shebang that esbuild produces from the source
content = content.replace(/^#\\!\/usr\/bin\/env node\n/m, '');
// Ensure proper shebang is first line
if (!content.startsWith('#!/usr/bin/env node')) {
  content = '#!/usr/bin/env node\n' + content;
}
writeFileSync(outfile, content);
chmodSync(outfile, 0o755);

const sizeKb = Math.round(content.length / 1024);
console.log(`Built ${outfile} (${sizeKb}KB)`);
