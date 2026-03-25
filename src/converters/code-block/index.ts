/**
 * Code block wrapper
 *
 * Wraps text in a markdown fenced code block with language detection.
 *
 * @packageDocumentation
 */

const LANG_PATTERNS: [RegExp, string][] = [
  // Shebang lines
  [/^#!.*\bpython/, 'python'],
  [/^#!.*\b(bash|sh|zsh)/, 'bash'],
  [/^#!.*\bnode/, 'javascript'],
  [/^#!.*\bruby/, 'ruby'],
  [/^#!.*\bperl/, 'perl'],

  // Language-specific keywords/patterns
  [/\bdef\s+\w+\s*\(|^import\s+\w+|^from\s+\w+\s+import\b/m, 'python'],
  [/\bfn\s+\w+\s*\(|let\s+mut\s+|use\s+std::|impl\s+\w+/m, 'rust'],
  [/\bfunc\s+\w+\s*\(|package\s+\w+|:=\s*|fmt\.\w+/m, 'go'],
  [/\bconst\s+\w+\s*[=:]|=>\s*\{|async\s+(function|=>)|import\s+.*\s+from\s+['"]|export\s+(default\s+)?/m, 'typescript'],
  [/\bfunction\s+\w+\s*\(|var\s+\w+\s*=|===|!==|console\.\w+/m, 'javascript'],
  [/^\s*<[a-z]+[\s>]|<\/[a-z]+>|className=/mi, 'html'],
  [/^\s*\{[\s\n]*"|\[\s*\{/m, 'json'],
  [/^---\n|^\w+:\s+/m, 'yaml'],
  [/^\s*SELECT\s+|^\s*INSERT\s+INTO|^\s*CREATE\s+TABLE/mi, 'sql'],
  [/^\s*#include\s*<|int\s+main\s*\(|std::/m, 'cpp'],
  [/\bpublic\s+(static\s+)?class\s+|System\.out\.|@Override/m, 'java'],
  [/^\s*\$\w+\s*=|<\?php|\becho\s+/m, 'php'],
  [/^\s*class\s+\w+\s*<|\.each\s+do|puts\s+/m, 'ruby'],
  [/^\s*\$\s|^\s*if\s*\[|^\s*echo\s+|^\s*export\s+\w+=/m, 'bash'],
  [/^\s*apiVersion:|^\s*kind:\s+(Deployment|Service|Pod)/m, 'yaml'],
  [/^\s*FROM\s+\w+|^\s*RUN\s+|^\s*COPY\s+|^\s*CMD\s+/m, 'dockerfile'],
  [/^\s*resource\s+"|\bprovider\s+"|\bvariable\s+"/m, 'terraform'],
  [/\b(struct|enum)\s+\w+\s*\{|println!\(|fn\s+main\s*\(/m, 'rust'],
];

/**
 * Detect programming language from content
 */
function detectLanguage(content: string): string {
  for (const [pattern, lang] of LANG_PATTERNS) {
    if (pattern.test(content)) return lang;
  }
  return '';
}

/**
 * Wrap content in a markdown fenced code block with auto-detected language
 */
export function wrapCodeBlock(content: string): string {
  const lang = detectLanguage(content);
  const trimmed = content.trimEnd();
  return '```' + lang + '\n' + trimmed + '\n```\n';
}
