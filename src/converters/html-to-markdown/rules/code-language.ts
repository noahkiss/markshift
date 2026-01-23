/**
 * Custom turndown rule to extract programming language from code block class attributes
 *
 * Common patterns: lang-js, language-javascript, highlight-source-python, hljs python
 */
import type TurndownService from 'turndown';

/**
 * Minimal DOM node interface for turndown's domino-based nodes
 * Turndown uses @mixmark-io/domino which provides these properties
 */
interface DomNode {
  nodeName: string;
  firstChild: DomNode | null;
  parentElement: DomNode | null;
  className?: string;
  textContent: string | null;
}

const languagePatterns = [
  /\blang(?:uage)?-([a-z0-9_+-]+)\b/i, // lang-js, language-javascript
  /\bhighlight-source-([a-z0-9_+-]+)\b/i, // GitHub style
  /\bhljs\s+([a-z0-9_+-]+)\b/i, // highlight.js style
  /\bsourceCode\s+([a-z0-9_+-]+)\b/i, // pandoc style
];

function extractLanguage(node: DomNode): string {
  const targets = [node, node.parentElement].filter((n): n is DomNode => n !== null);

  for (const target of targets) {
    const className = target.className || '';
    for (const pattern of languagePatterns) {
      const match = className.match(pattern);
      if (match?.[1]) return match[1].toLowerCase();
    }
  }
  return '';
}

export function addCodeLanguageRule(turndown: TurndownService): void {
  turndown.addRule('fencedCodeBlockWithLanguage', {
    filter: (node, options) => {
      return (
        options.codeBlockStyle === 'fenced' &&
        node.nodeName === 'PRE' &&
        node.firstChild !== null &&
        node.firstChild.nodeName === 'CODE'
      );
    },
    replacement: (_content, node, options) => {
      const codeNode = node.firstChild as DomNode;
      const language = extractLanguage(codeNode);
      const fence = options.fence || '```';
      // CRITICAL: Use textContent to preserve exact whitespace (indentation, newlines)
      const code = codeNode.textContent || '';

      return `\n\n${fence}${language}\n${code}\n${fence}\n\n`;
    },
  });
}
