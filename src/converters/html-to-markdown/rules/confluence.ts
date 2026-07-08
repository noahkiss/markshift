/**
 * Custom turndown rules for Confluence HTML
 *
 * Handles two scenarios:
 * 1. Rendered HTML copied from Confluence web UI (CSS classes, data attributes)
 * 2. Confluence storage format (ac: namespace XML elements)
 *
 * @packageDocumentation
 */
import type TurndownService from 'turndown';

interface DomNode {
  nodeName: string;
  firstChild: DomNode | null;
  parentElement: DomNode | null;
  className?: string;
  textContent: string | null;
  getAttribute?: (name: string) => string | null;
  childNodes?: ArrayLike<DomNode>;
  innerHTML?: string;
  querySelectorAll?: (selector: string) => ArrayLike<DomNode>;
}

const emoticonMap: Record<string, string> = {
  smile: ':)',
  sad: ':(',
  cheeky: ':P',
  laugh: ':D',
  wink: ';)',
  thumbs_up: '(y)',
  thumbs_down: '(n)',
  tick: '[x]',
  cross: '[ ]',
  warning: '(!)',
  information: '(i)',
  question: '(?)',
  'yellow-star': '(*)',
  'red-star': '(*r)',
  'green-star': '(*g)',
  'blue-star': '(*b)',
};

function emoticonReplacement(node: DomNode): string {
  const name = node.getAttribute?.('ac:name') || '';
  return emoticonMap[name] || `(${name})`;
}

function imageReplacement(node: DomNode): string {
  const alt = node.getAttribute?.('ac:alt') || 'image';
  return `![${alt}]`;
}

/**
 * Add all Confluence-specific rules to a Turndown instance
 */
export function addConfluenceRules(turndown: TurndownService): void {
  // --- Rendered Confluence HTML (copied from browser) ---

  // Code blocks: Confluence uses <pre> with syntaxhighlighter classes
  turndown.addRule('confluenceCodeBlock', {
    filter: (node) => {
      if (node.nodeName !== 'PRE') return false;
      const cls = (node as DomNode).className || '';
      return cls.includes('syntaxhighlighter') || cls.includes('codeContent');
    },
    replacement: (_content, node) => {
      const el = node as DomNode;
      const cls = el.className || '';
      // Extract language from data attribute or class
      const lang =
        el.getAttribute?.('data-syntaxhighlighter-params')?.match(/brush:\s*([a-z0-9]+)/i)?.[1] ||
        cls.match(/brush-([a-z0-9]+)/i)?.[1] ||
        '';
      const code = el.textContent || '';
      return `\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
    },
  });

  // Info/warning/note panels
  turndown.addRule('confluencePanel', {
    filter: (node) => {
      const cls = (node as DomNode).className || '';
      return (
        cls.includes('confluence-information-macro') ||
        cls.includes('panel') && cls.includes('conf-macro')
      );
    },
    replacement: (content) => {
      // Render as blockquote — the cleanest markdown equivalent
      const lines = content.trim().split('\n');
      return '\n\n' + lines.map((l) => `> ${l}`).join('\n') + '\n\n';
    },
  });

  // Status lozenges
  turndown.addRule('confluenceStatus', {
    filter: (node) => {
      const cls = (node as DomNode).className || '';
      return cls.includes('status-macro') || cls.includes('aui-lozenge');
    },
    replacement: (_content, node) => {
      const text = (node as DomNode).textContent || '';
      return `\`${text.trim()}\``;
    },
  });

  // Expand/collapse sections (just show the content)
  turndown.addRule('confluenceExpand', {
    filter: (node) => {
      const cls = (node as DomNode).className || '';
      return cls.includes('expand-macro') || cls.includes('expand-container');
    },
    replacement: (content) => {
      return '\n\n' + content.trim() + '\n\n';
    },
  });

  // Table of contents (skip entirely)
  turndown.addRule('confluenceToc', {
    filter: (node) => {
      const cls = (node as DomNode).className || '';
      return cls.includes('toc-macro') || cls.includes('client-side-toc');
    },
    replacement: () => '',
  });

  // --- Confluence Storage Format (API/export XML) ---
  // These handle ac: namespace elements that appear in Confluence's XHTML storage format

  // NOTE: Turndown's addRule unshifts each rule onto the front of its internal
  // list, so the LAST rule added is the FIRST one checked (last-added wins).
  // The generic ac:/ri: catch-alls below must therefore be added FIRST, so that
  // all the specific macro rules added afterward take precedence over them.

  // Catch-all for remaining ac: elements — extract text content
  turndown.addRule('confluenceGenericAc', {
    filter: (node) => node.nodeName.toLowerCase().startsWith('ac:'),
    replacement: (content) => content,
  });

  // Catch-all for ri: elements — extract text content
  turndown.addRule('confluenceGenericRi', {
    filter: (node) => node.nodeName.toLowerCase().startsWith('ri:'),
    replacement: (content) => content,
  });

  // ac:parameter carries macro config (language, title, etc.) that the specific
  // macro rules below read directly off the DOM node via querySelectorAll —
  // they're unaffected by this replacement. Drop it here so parameter text
  // doesn't otherwise leak into the rendered content of its parent macro.
  turndown.addRule('confluenceParameter', {
    filter: (node) => node.nodeName.toLowerCase() === 'ac:parameter',
    replacement: () => '',
  });

  turndown.addRule('confluenceMacroCodeBlock', {
    filter: (node) => {
      const name = node.nodeName.toLowerCase();
      return (
        name === 'ac:structured-macro' &&
        (node as DomNode).getAttribute?.('ac:name') === 'code'
      );
    },
    replacement: (_content, node) => {
      const el = node as DomNode;
      // Try to find language parameter
      let lang = '';
      const params = el.querySelectorAll?.('ac\\:parameter, parameter');
      if (params) {
        for (let i = 0; i < params.length; i++) {
          const p = params[i] as DomNode;
          if (p.getAttribute?.('ac:name') === 'language') {
            lang = p.textContent || '';
          }
        }
      }
      // Get code body from ac:plain-text-body if present, else fall back to
      // the macro's full text content
      const bodyEl = el.querySelectorAll?.('ac\\:plain-text-body, plain-text-body');
      const body =
        bodyEl && bodyEl.length > 0 ? (bodyEl[0] as DomNode).textContent || '' : el.textContent || '';
      return `\n\n\`\`\`${lang}\n${body.trim()}\n\`\`\`\n\n`;
    },
  });

  // ac:structured-macro with name="info|note|warning|tip" → blockquote
  turndown.addRule('confluenceMacroPanel', {
    filter: (node) => {
      const name = node.nodeName.toLowerCase();
      if (name !== 'ac:structured-macro') return false;
      const macroName = (node as DomNode).getAttribute?.('ac:name') || '';
      return ['info', 'note', 'warning', 'tip', 'panel'].includes(macroName);
    },
    replacement: (content) => {
      const lines = content.trim().split('\n');
      return '\n\n' + lines.map((l) => `> ${l}`).join('\n') + '\n\n';
    },
  });

  // ac:structured-macro with name="toc" → skip
  turndown.addRule('confluenceMacroToc', {
    filter: (node) => {
      const name = node.nodeName.toLowerCase();
      return (
        name === 'ac:structured-macro' &&
        (node as DomNode).getAttribute?.('ac:name') === 'toc'
      );
    },
    replacement: () => '',
  });

  // ac:structured-macro with name="status" → inline code
  turndown.addRule('confluenceMacroStatus', {
    filter: (node) => {
      const name = node.nodeName.toLowerCase();
      return (
        name === 'ac:structured-macro' &&
        (node as DomNode).getAttribute?.('ac:name') === 'status'
      );
    },
    replacement: (_content, node) => {
      const el = node as DomNode;
      let title = '';
      const params = el.querySelectorAll?.('ac\\:parameter, parameter');
      if (params) {
        for (let i = 0; i < params.length; i++) {
          const p = params[i] as DomNode;
          if (p.getAttribute?.('ac:name') === 'title') {
            title = p.textContent || '';
          }
        }
      }
      return title ? `\`${title}\`` : '';
    },
  });

  // ac:link → extract the link text
  turndown.addRule('confluenceLink', {
    filter: (node) => node.nodeName.toLowerCase() === 'ac:link',
    replacement: (_content, node) => {
      const el = node as DomNode;
      const text = el.textContent || 'link';
      return text.trim();
    },
  });

  // ac:image → extract as image reference
  turndown.addRule('confluenceImage', {
    filter: (node) => node.nodeName.toLowerCase() === 'ac:image',
    replacement: (_content, node) => imageReplacement(node as DomNode),
  });

  // ac:emoticon → convert to text
  turndown.addRule('confluenceEmoticon', {
    filter: (node) => node.nodeName.toLowerCase() === 'ac:emoticon',
    replacement: (_content, node) => emoticonReplacement(node as DomNode),
  });

  // ac:task-list / ac:task → markdown task list
  turndown.addRule('confluenceTask', {
    filter: (node) => node.nodeName.toLowerCase() === 'ac:task',
    replacement: (_content, node) => {
      const el = node as DomNode;
      const statusEl = el.querySelectorAll?.('ac\\:task-status, task-status');
      const status = statusEl && statusEl.length > 0 ? (statusEl[0] as DomNode).textContent : '';
      const checked = status === 'complete';
      const bodyEl = el.querySelectorAll?.('ac\\:task-body, task-body');
      const body = bodyEl && bodyEl.length > 0 ? (bodyEl[0] as DomNode).textContent?.trim() : el.textContent?.trim() || '';
      return `- [${checked ? 'x' : ' '}] ${body}\n`;
    },
  });

  // ac:task-list → just pass through children
  turndown.addRule('confluenceTaskList', {
    filter: (node) => node.nodeName.toLowerCase() === 'ac:task-list',
    replacement: (content) => '\n' + content,
  });

  // Turndown treats any element with whitespace-only textContent as "blank"
  // and renders it via a fixed internal blankRule, which bypasses every rule
  // registered via addRule above — including ours. ac:image and ac:emoticon
  // carry their meaning entirely in attributes (ac:alt, ac:name) and have no
  // text content of their own, so in practice they always hit this shortcut
  // and would otherwise be silently dropped. There's no public option that
  // reaches this path (blankReplacement is copied into rules.blankRule once
  // at construction, not read live), so patch rules.blankRule directly.
  const rules = turndown.rules as unknown as {
    blankRule: { replacement: (content: string, node: DomNode) => string };
  };
  const defaultBlankReplacement = rules.blankRule.replacement;
  rules.blankRule.replacement = (content, node) => {
    switch (node.nodeName.toLowerCase()) {
      case 'ac:image':
        return imageReplacement(node);
      case 'ac:emoticon':
        return emoticonReplacement(node);
      default:
        return defaultBlankReplacement(content, node);
    }
  };
}
