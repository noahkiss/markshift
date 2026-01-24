/**
 * Custom turndown rule for semantic/ARIA tables using div elements
 *
 * Converts div-based tables with role="table" or data-table attributes
 * to proper Markdown table syntax.
 *
 * @packageDocumentation
 */
import type TurndownService from 'turndown';

/**
 * Minimal DOM node interface for turndown's domino-based nodes
 */
interface DomNode {
  nodeName: string;
  getAttribute(name: string): string | null;
  querySelectorAll(selector: string): DomNode[];
  textContent: string | null;
  children: ArrayLike<DomNode>;
}

/**
 * Check if a node is a semantic table
 */
function isSemanticTable(node: DomNode): boolean {
  if (node.nodeName !== 'DIV') {
    return false;
  }

  // Check for role="table"
  if (node.getAttribute('role') === 'table') {
    return true;
  }

  // Check for data-table attribute
  if (node.getAttribute('data-table') !== null) {
    return true;
  }

  // Check for CSS table display
  const style = node.getAttribute('style');
  if (style && style.includes('display:') && style.includes('table')) {
    return true;
  }

  return false;
}

/**
 * Get rows from a semantic table
 */
function getRows(node: DomNode): DomNode[] {
  // Query for elements with role="row" or data-row
  const roleRows = Array.from(node.querySelectorAll('[role="row"]'));
  if (roleRows.length > 0) {
    return roleRows;
  }

  const dataRows = Array.from(node.querySelectorAll('[data-row]'));
  if (dataRows.length > 0) {
    return dataRows;
  }

  return [];
}

/**
 * Get cells from a row
 */
function getCells(row: DomNode): DomNode[] {
  // Query for cells with various semantic indicators
  const selectors = [
    '[role="cell"]',
    '[role="columnheader"]',
    '[role="rowheader"]',
    '[data-cell]',
  ];

  for (const selector of selectors) {
    const cells = Array.from(row.querySelectorAll(selector));
    if (cells.length > 0) {
      return cells;
    }
  }

  // Fallback: use direct children if they look like cells
  return Array.from(row.children).filter(
    (child) =>
      child.nodeName === 'DIV' ||
      child.nodeName === 'SPAN' ||
      child.getAttribute('role') === 'cell' ||
      child.getAttribute('role') === 'columnheader'
  );
}

/**
 * Get cell text content, trimmed
 */
function getCellText(cell: DomNode): string {
  return (cell.textContent || '').trim().replace(/\|/g, '\\|');
}

/**
 * Add semantic table rule to turndown service
 */
export function addSemanticTableRule(turndown: TurndownService): void {
  turndown.addRule('semanticTable', {
    filter: (node) => isSemanticTable(node as unknown as DomNode),
    replacement: (_content, node) => {
      const domNode = node as unknown as DomNode;
      const rows = getRows(domNode);

      // Need at least 2 rows (header + data) for a valid table
      if (rows.length < 2) {
        return _content;
      }

      const tableRows: string[][] = [];
      for (const row of rows) {
        const cells = getCells(row);
        const cellTexts = cells.map(getCellText);
        if (cellTexts.length > 0) {
          tableRows.push(cellTexts);
        }
      }

      if (tableRows.length < 2) {
        return _content;
      }

      // Determine column count from first row
      const headerRow = tableRows[0]!;
      const columnCount = headerRow.length;

      // Build markdown table
      const lines: string[] = [];

      // Header row
      lines.push('| ' + headerRow.join(' | ') + ' |');

      // Separator
      lines.push('| ' + Array(columnCount).fill('---').join(' | ') + ' |');

      // Data rows
      for (let i = 1; i < tableRows.length; i++) {
        const row = tableRows[i]!;
        // Pad row to column count if needed
        while (row.length < columnCount) {
          row.push('');
        }
        lines.push('| ' + row.join(' | ') + ' |');
      }

      return '\n\n' + lines.join('\n') + '\n\n';
    },
  });
}
