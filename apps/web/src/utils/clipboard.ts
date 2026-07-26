export async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  textarea.setAttribute('readonly', 'true');
  document.body.appendChild(textarea);

  try {
    textarea.focus();
    textarea.select();
    const copied = document.execCommand('copy');

    if (!copied) {
      throw new Error('Copy command was rejected.');
    }
  } finally {
    textarea.remove();
  }
}

export async function copyRichHtmlToClipboard(html: string) {
  if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
    const documentFragment = new DOMParser().parseFromString(html, 'text/html');
    const plainText = documentFragment.body.textContent ?? '';
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
      }),
    ]);
    return;
  }

  await copyToClipboard(html);
}
