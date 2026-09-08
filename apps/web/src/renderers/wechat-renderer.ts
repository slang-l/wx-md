import type { AppDoc, InlineTextDelta, NormalizedBlock } from '../types/document';
import { escapeHtml } from '../utils/escape';
import { formatDateTime } from '../utils/date';
import {
  defaultWechatThemeId,
  getWechatTheme,
  type WechatTheme,
  type WechatThemeId,
} from './wechat-themes';

const BLOCKSUITE_INLINE_COLORS: Readonly<Record<string, string>> = {
  'var(--affine-text-highlight-red)': 'rgba(254, 213, 213, 1)',
  'var(--affine-text-highlight-orange)': 'rgba(254, 223, 187, 1)',
  'var(--affine-text-highlight-yellow)': 'rgba(254, 243, 161, 1)',
  'var(--affine-text-highlight-green)': 'rgba(225, 250, 177, 1)',
  'var(--affine-text-highlight-teal)': 'rgba(173, 248, 233, 1)',
  'var(--affine-text-highlight-blue)': 'rgba(204, 226, 254, 1)',
  'var(--affine-text-highlight-purple)': 'rgba(237, 221, 255, 1)',
  'var(--affine-text-highlight-grey)': 'rgba(234, 236, 239, 1)',
  'var(--affine-text-highlight-foreground-red)': 'rgba(198, 34, 34, 1)',
  'var(--affine-text-highlight-foreground-orange)': 'rgba(211, 79, 11, 1)',
  'var(--affine-text-highlight-foreground-yellow)': 'rgba(182, 124, 4, 1)',
  'var(--affine-text-highlight-foreground-green)': 'rgba(20, 147, 67, 1)',
  'var(--affine-text-highlight-foreground-teal)': 'rgba(7, 130, 160, 1)',
  'var(--affine-text-highlight-foreground-blue)': 'rgba(33, 89, 211, 1)',
  'var(--affine-text-highlight-foreground-purple)': 'rgba(132, 46, 211, 1)',
  'var(--affine-text-highlight-foreground-grey)': 'rgba(68, 77, 89, 1)',
};

interface RenderWechatHtmlOptions {
  includePreviewFooter?: boolean;
}

export function renderWechatHtml(
  doc: AppDoc,
  themeInput: WechatThemeId | WechatTheme = defaultWechatThemeId,
  options: RenderWechatHtmlOptions = {},
) {
  const theme = typeof themeInput === 'string' ? getWechatTheme(themeInput) : themeInput;
  const bodyBlocks = skipDuplicatedTitle(doc);
  const blocksHtml = bodyBlocks.map((block) => renderWechatBlock(block, theme)).join('\n');

  const previewFooter =
    options.includePreviewFooter === false
      ? ''
      : `<footer style="${theme.styles.footer}">
    <span>阅读 1234</span>
    <span>分享</span>
    <span>赞 56</span>
    <span>在看 18</span>
  </footer>`;

  return `
<section id="output" class="wxmd wxmd-${theme.id}" style="${theme.styles.container}">
  <h1 style="${theme.styles.title}">${escapeHtml(doc.title)}</h1>
  ${renderMeta(doc, theme)}
  ${blocksHtml}
  ${previewFooter}
</section>`.trim();
}

function skipDuplicatedTitle(doc: AppDoc) {
  const first = doc.blocks[0];
  if (first?.type === 'heading' && first.level === 1 && first.text?.trim() === doc.title.trim()) {
    return doc.blocks.slice(1);
  }
  return doc.blocks;
}

function renderMeta(doc: AppDoc, theme: WechatTheme) {
  return `<p style="${theme.styles.meta}">
    <span style="${theme.styles.badge}">原创</span>
    <span style="${theme.styles.metaText}">${escapeHtml(doc.author)}</span>
    <span style="${theme.styles.metaText}">${escapeHtml(formatDateTime(doc.createdAt))}</span>
    <span style="${theme.styles.metaText}">${escapeHtml(doc.location)}</span>
  </p>`;
}

function renderWechatBlock(block: NormalizedBlock, theme: WechatTheme): string {
  const text = renderBlockInline(block, theme);

  switch (block.type) {
    case 'heading':
      return renderHeading(block, theme);
    case 'quote':
      return `<blockquote class="md-blockquote" style="${theme.styles.quote}"><p class="md-blockquote-p" style="${theme.styles.quoteParagraph}">${text}</p></blockquote>`;
    case 'code':
      return renderCode(escapeHtml(block.text ?? ''), theme);
    case 'image':
      return renderImage(block, theme);
    case 'bulleted-list':
      return renderList(block, 'ul', theme);
    case 'numbered-list':
      return renderList(block, 'ol', theme);
    case 'todo-list':
      return renderTodoList(block, theme);
    case 'divider':
      return `<hr class="hr hr-dash" style="${theme.styles.divider}" />`;
    default:
      return block.delta?.length
        ? `<p style="${theme.styles.paragraph}">${renderInlineDelta(block.delta, theme).replace(/\n/g, '<br />')}</p>`
        : renderParagraph(block.text ?? '', theme);
  }
}

function renderParagraph(value: string, theme: WechatTheme): string {
  const normalizedValue = value.replace(/\r\n?/g, '\n');
  const trimmed = normalizedValue.trim();
  const markdownHeading = /^(#{1,3})\s+(.+)$/.exec(trimmed);

  if (markdownHeading) {
    return renderHeading(
      {
        id: 'markdown-heading',
        type: 'heading',
        level: markdownHeading[1].length as 1 | 2 | 3,
        text: markdownHeading[2],
      },
      theme,
    );
  }

  if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
    return `<hr class="hr hr-dash" style="${theme.styles.divider}" />`;
  }

  if (trimmed.startsWith('>')) {
    const quoteText = trimmed.replace(/^>\s?/gm, '');
    return `<blockquote class="md-blockquote" style="${theme.styles.quote}"><p class="md-blockquote-p" style="${theme.styles.quoteParagraph}">${renderInlineParagraphText(quoteText, theme)}</p></blockquote>`;
  }

  if (!trimmed) {
    return '';
  }

  if (normalizedValue.includes('\n\n')) {
    return normalizedValue
      .split(/\n{2,}/)
      .map((part) => renderParagraph(part, theme))
      .join('\n');
  }

  return `<p style="${theme.styles.paragraph}">${renderInlineParagraphText(normalizedValue, theme)}</p>`;
}

function renderInlineParagraphText(value: string, theme: WechatTheme) {
  return renderInlineMarkdown(value, theme).replace(/\n/g, '<br />');
}

function renderCode(text: string, theme: WechatTheme) {
  return `<section class="code-snippet__fix code-snippet__js" style="${theme.styles.codeShell}">
    <section class="code__toolbar" style="${theme.styles.codeToolbar}">
      <span style="${theme.styles.codeDotRed}"></span>
      <span style="${theme.styles.codeDotYellow}"></span>
      <span style="${theme.styles.codeDotGreen}"></span>
    </section>
    <pre class="hljs code__pre" style="${theme.styles.codePre}"><code style="${theme.styles.code}">${text}</code></pre>
  </section>`;
}

function renderHeading(block: NormalizedBlock, theme: WechatTheme) {
  const level = block.level ?? 2;
  const text = renderBlockInline(block, theme);

  if (level === 1) {
    return `<h1 style="${theme.styles.heading1}">${text}</h1>`;
  }

  if (level === 2) {
    return `<h2 style="${theme.styles.heading2}">${text}</h2>`;
  }

  return `<h3 style="${theme.styles.heading3}">${text}</h3>`;
}

function renderList(block: NormalizedBlock, tag: 'ul' | 'ol', theme: WechatTheme) {
  const items = (block.items ?? [])
    .map((item, index) => {
      const marker = tag === 'ol' ? `${index + 1}.` : '•';
      const text = renderInlineValue(block.itemDeltas?.[index], item, theme);
      return `<li class="listitem" style="${theme.styles.listItem}"><span style="${theme.styles.listMarker}">${marker}</span>${text}</li>`;
    })
    .join('');

  return `<${tag} style="${theme.styles.list}">${items}</${tag}>`;
}

function renderTodoList(block: NormalizedBlock, theme: WechatTheme) {
  const items = (block.items ?? [])
    .map((item, index) => {
      const checked = block.checked?.[index] ?? false;
      const marker = checked ? '☑' : '☐';
      const decoration = checked ? 'text-decoration:line-through;opacity:.68;' : '';
      return `<li class="listitem" style="${theme.styles.listItem};${decoration}"><span style="${theme.styles.listMarker}">${marker}</span>${renderInlineValue(block.itemDeltas?.[index], item, theme)}</li>`;
    })
    .join('');

  return `<ul style="${theme.styles.list};list-style:none;padding-left:0">${items}</ul>`;
}

function renderImage(block: NormalizedBlock, theme: WechatTheme) {
  const src = escapeHtml(block.url ?? '');
  const alt = escapeHtml(block.alt ?? block.caption ?? '');
  const caption = block.caption
    ? `<figcaption style="${theme.styles.caption}">${escapeHtml(block.caption)}</figcaption>`
    : '';

  if (!src) {
    return '';
  }

  return `<figure style="${theme.styles.figure}"><img src="${src}" alt="${alt}" style="${theme.styles.image}" />${caption}</figure>`;
}

function renderInlineMarkdown(value: string, theme: WechatTheme) {
  const codeSegments = value.split(/(`[^`\n]+`)/g);

  return codeSegments
    .map((segment) => {
      if (segment.startsWith('`') && segment.endsWith('`') && segment.length > 1) {
        return `<code style="${theme.styles.inlineCode}">${escapeHtml(segment.slice(1, -1))}</code>`;
      }

      return renderInlineText(segment, theme);
    })
    .join('');
}

function renderBlockInline(block: NormalizedBlock, theme: WechatTheme) {
  return renderInlineValue(block.delta, block.text ?? '', theme);
}

function renderInlineValue(
  delta: InlineTextDelta[] | undefined,
  fallback: string,
  theme: WechatTheme,
) {
  return delta?.length ? renderInlineDelta(delta, theme) : renderInlineMarkdown(fallback, theme);
}

function renderInlineDelta(delta: InlineTextDelta[], theme: WechatTheme) {
  return delta
    .map((part) => {
      const attributes = part.attributes ?? {};
      let value = escapeHtml(part.insert);

      const inlineColorStyle = renderInlineColorStyle(attributes.color, attributes.background);
      if (inlineColorStyle) value = `<span style="${inlineColorStyle}">${value}</span>`;

      if (attributes.code) value = `<code style="${theme.styles.inlineCode}">${value}</code>`;
      if (attributes.bold) value = `<strong style="${theme.styles.strong}">${value}</strong>`;
      if (attributes.italic) value = `<em style="${theme.styles.em}">${value}</em>`;
      if (attributes.underline) value = `<u style="text-decoration:underline">${value}</u>`;
      if (attributes.strike) value = `<span style="${theme.styles.delete}">${value}</span>`;
      if (attributes.link && isSafeLink(attributes.link)) {
        value = `<a href="${escapeHtml(attributes.link)}" style="${theme.styles.link}">${value}</a>`;
      }

      return value;
    })
    .join('');
}

function renderInlineColorStyle(
  color: string | null | undefined,
  background: string | null | undefined,
) {
  const styles: string[] = [];
  const resolvedColor = resolveBlockSuiteInlineColor(color);
  const resolvedBackground = resolveBlockSuiteInlineColor(background);

  if (resolvedColor) styles.push(`color:${resolvedColor}`);
  if (resolvedBackground) styles.push(`background-color:${resolvedBackground}`);

  return styles.join(';');
}

function resolveBlockSuiteInlineColor(value: string | null | undefined) {
  if (!value) return null;
  return BLOCKSUITE_INLINE_COLORS[value.trim()] ?? null;
}

function isSafeLink(value: string) {
  return /^(https?:\/\/|mailto:)/i.test(value);
}

function renderInlineText(value: string, theme: WechatTheme) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, `<strong style="${theme.styles.strong}">$1</strong>`)
    .replace(/__([^_]+)__/g, `<strong style="${theme.styles.strong}">$1</strong>`)
    .replace(/~~([^~]+)~~/g, `<span style="${theme.styles.delete}">$1</span>`)
    .replace(/\*([^*\n]+)\*/g, `<em style="${theme.styles.em}">$1</em>`)
    .replace(/_([^_\n]+)_/g, `<em style="${theme.styles.em}">$1</em>`)
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      `<a href="$2" style="${theme.styles.link}">$1</a>`,
    );
}
