export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeMarkdownText(value: string) {
  return escapeHtml(value).replace(/([\\`*_{}[\]()#+\-.!|>])/g, '\\$1');
}
