import { htmlToMarkdown, markdownToHtml, extractContent } from './browser-converters.js';

// DOM Elements
const htmlPane = document.getElementById('html-pane') as HTMLTextAreaElement;
const mdPane = document.getElementById('md-pane') as HTMLTextAreaElement;
const extractEl = document.getElementById('extract-content') as HTMLInputElement;
const copyBtns = document.querySelectorAll('.copy-btn') as NodeListOf<HTMLButtonElement>;

// Flag to prevent circular updates
let isUpdating = false;

// Debounce helper for typing
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  }) as T;
}

// Convert HTML to Markdown and update MD pane
function updateMarkdownPane(): void {
  if (isUpdating) return;

  const html = htmlPane.value.trim();
  if (!html) {
    isUpdating = true;
    mdPane.value = '';
    isUpdating = false;
    return;
  }

  try {
    isUpdating = true;
    let htmlContent = html;

    // Extract main content if checkbox is checked
    if (extractEl.checked) {
      const extracted = extractContent(html);
      if (extracted && extracted.content) {
        htmlContent = extracted.content;
      }
    }

    const markdown = htmlToMarkdown(htmlContent);
    mdPane.value = markdown;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Conversion error';
    mdPane.value = `Error: ${message}`;
  } finally {
    isUpdating = false;
  }
}

// Convert Markdown to HTML and update HTML pane
function updateHtmlPane(): void {
  if (isUpdating) return;

  const md = mdPane.value.trim();
  if (!md) {
    isUpdating = true;
    htmlPane.value = '';
    isUpdating = false;
    return;
  }

  try {
    isUpdating = true;
    const html = markdownToHtml(md);
    htmlPane.value = html;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Conversion error';
    htmlPane.value = `Error: ${message}`;
  } finally {
    isUpdating = false;
  }
}

// Debounced versions for typing
const debouncedUpdateMarkdown = debounce(updateMarkdownPane, 300);
const debouncedUpdateHtml = debounce(updateHtmlPane, 300);

// Handle paste into HTML pane - detect rich text
function handleHtmlPaste(event: ClipboardEvent): void {
  const clipboardData = event.clipboardData;
  if (!clipboardData) return;

  // Check if HTML is available in clipboard
  const html = clipboardData.getData('text/html');
  if (html && html.trim()) {
    event.preventDefault();
    htmlPane.value = html;
    updateMarkdownPane();
  }
  // If no HTML, let default paste handle plain text, then update
}

// Copy button handler
async function handleCopy(event: Event): Promise<void> {
  const btn = event.currentTarget as HTMLButtonElement;
  const targetId = btn.dataset.target;
  if (!targetId) return;

  const textarea = document.getElementById(targetId) as HTMLTextAreaElement;
  const content = textarea.value;
  if (!content) return;

  try {
    await navigator.clipboard.writeText(content);
    showCopyFeedback(btn);
  } catch {
    // Fallback
    textarea.select();
    document.execCommand('copy');
    showCopyFeedback(btn);
  }
}

function showCopyFeedback(btn: HTMLButtonElement): void {
  const originalText = btn.textContent;
  btn.textContent = 'Copied!';
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = originalText;
    btn.disabled = false;
  }, 1500);
}

// Event listeners
htmlPane.addEventListener('input', debouncedUpdateMarkdown);
htmlPane.addEventListener('paste', handleHtmlPaste);
mdPane.addEventListener('input', debouncedUpdateHtml);

copyBtns.forEach(btn => {
  btn.addEventListener('click', handleCopy);
});

// Re-convert when extract option changes
extractEl.addEventListener('change', () => {
  if (htmlPane.value.trim()) {
    updateMarkdownPane();
  }
});
