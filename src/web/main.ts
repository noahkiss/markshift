import { htmlToMarkdown, markdownToHtml, extractContent } from './browser-converters.js';

// DOM Elements
const form = document.getElementById('converter-form') as HTMLFormElement;
const inputEl = document.getElementById('input') as HTMLTextAreaElement;
const outputEl = document.getElementById('output') as HTMLTextAreaElement;
const modeEl = document.getElementById('mode') as HTMLSelectElement;
const extractEl = document.getElementById('extract-content') as HTMLInputElement;
const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;

// Form submit handler - performs conversion
function handleSubmit(event: Event): void {
  event.preventDefault();

  const input = inputEl.value.trim();
  if (!input) {
    outputEl.value = '';
    return;
  }

  const mode = modeEl.value;

  try {
    if (mode === 'html-to-md') {
      let htmlContent = input;

      // Extract main content if checkbox is checked
      if (extractEl.checked) {
        const extracted = extractContent(input);
        if (extracted && extracted.content) {
          htmlContent = extracted.content;
        } else {
          outputEl.value = 'Error: Could not extract content. The input may be too short or not contain enough readable content.';
          return;
        }
      }

      const markdown = htmlToMarkdown(htmlContent);
      outputEl.value = markdown;
    } else if (mode === 'md-to-html') {
      const html = markdownToHtml(input);
      outputEl.value = html;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    outputEl.value = `Error: ${message}`;
  }
}

// Copy button handler - copies output to clipboard
async function handleCopy(): Promise<void> {
  const output = outputEl.value;
  if (!output) {
    return;
  }

  try {
    await navigator.clipboard.writeText(output);

    // Visual feedback
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    copyBtn.disabled = true;

    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.disabled = false;
    }, 1500);
  } catch (error) {
    // Fallback for browsers without clipboard API
    outputEl.select();
    document.execCommand('copy');

    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = 'Copy to Clipboard';
    }, 1500);
  }
}

// Mode change handler - disable extract option for Markdown input
function handleModeChange(): void {
  const mode = modeEl.value;

  if (mode === 'md-to-html') {
    extractEl.checked = false;
    extractEl.disabled = true;
  } else {
    extractEl.disabled = false;
  }
}

// Event listeners
form.addEventListener('submit', handleSubmit);
copyBtn.addEventListener('click', handleCopy);
modeEl.addEventListener('change', handleModeChange);

// Initialize state
handleModeChange();
