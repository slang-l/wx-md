import type { AppDoc, InlineTextDelta, NormalizedBlock } from '../types/document';
import { escapeMarkdownText } from '../utils/escape';

export function renderMarkdown(doc: AppDoc) {
  const bodyBlocks = skipDuplicatedTitle(doc);
  const lines = [`# ${escapeMarkdownText(doc.title)}`, ''];

  bodyBlocks.forEach((block) => {
    lines.push(renderMarkdownBlock(block), '');
  });

  return lines.join('\n').trimEnd();
}

function skipDuplicatedTitle(doc: AppDoc) {
  const first = doc.blocks[0];
  if (first?.type === 'heading' && first.level === 1 && first.text?.trim() === doc.title.trim()) {
    return doc.blocks.slice(1);
  }
  return doc.blocks;
}

function renderMarkdownBlock(block: NormalizedBlock) {
  const text = renderMarkdownInline(block.delta, block.text ?? '');

  switch (block.type) {
    case 'heading':
      return `${'#'.repeat(block.level ?? 2)} ${text}`;
    case 'quote':
      return `> ${text}`;
    case 'code':
      return `\`\`\`${escapeMarkdownText(block.language ?? '')}\n${escapeMarkdownText(block.text ?? '')}\n\`\`\``;
    case 'image': {
      const alt = escapeMarkdownText(block.alt ?? block.caption ?? '');
      return `![${alt}](${escapeMarkdownText(block.url ?? '')})`;
    }
    case 'bulleted-list':
      return (block.items ?? [])
        .map((item, index) => `- ${renderMarkdownInline(block.itemDeltas?.[index], item)}`)
        .join('\n');
    case 'numbered-list':
      return (block.items ?? [])
        .map(
          (item, index) => `${index + 1}. ${renderMarkdownInline(block.itemDeltas?.[index], item)}`,
        )
        .join('\n');
    case 'todo-list':
      return (block.items ?? [])
        .map(
          (item, index) =>
            `- [${block.checked?.[index] ? 'x' : ' '}] ${renderMarkdownInline(block.itemDeltas?.[index], item)}`,
        )
        .join('\n');
    case 'divider':
      return '---';
    default:
      return text;
  }
}

function renderMarkdownInline(delta: InlineTextDelta[] | undefined, fallback: string) {
  if (!delta?.length) return escapeMarkdownText(fallback);

  return delta
    .map((part) => {
      const attributes = part.attributes ?? {};
      let value = escapeMarkdownText(part.insert);

      if (attributes.code) value = `\`${value}\``;
      if (attributes.bold) value = `**${value}**`;
      if (attributes.italic) value = `*${value}*`;
      if (attributes.strike) value = `~~${value}~~`;
      if (attributes.underline) value = `<u>${value}</u>`;
      if (attributes.link && isSafeLink(attributes.link)) {
        value = `[${value}](${escapeMarkdownText(attributes.link)})`;
      }

      return value;
    })
    .join('');
}

function isSafeLink(value: string) {
  return /^(https?:\/\/|mailto:)/i.test(value);
}
