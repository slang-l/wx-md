import type { AppDoc, NormalizedBlock } from '../types/document';

const sampleBlocks: NormalizedBlock[] = [
  {
    id: 'b-title',
    type: 'heading',
    level: 1,
    text: '微信公众号排版示例',
  },
  {
    id: 'b-intro',
    type: 'paragraph',
    text: '这是一篇用于演示 Block Notes 在微信公众号内容创作场景下排版效果的示例文档。',
  },
  {
    id: 'b-structure-title',
    type: 'heading',
    level: 2,
    text: '一、清晰的层级结构',
  },
  {
    id: 'b-structure',
    type: 'paragraph',
    text: '通过合适的标题层级，让读者快速了解内容结构，提升阅读体验。',
  },
  {
    id: 'b-paragraph-title',
    type: 'heading',
    level: 2,
    text: '二、简洁的段落排版',
  },
  {
    id: 'b-paragraph',
    type: 'paragraph',
    text: '段落之间保持适当的间距，行高舒适，帮助读者更轻松地阅读和理解内容。',
  },
  {
    id: 'b-highlight-title',
    type: 'heading',
    level: 2,
    text: '三、重点内容突出',
  },
  {
    id: 'b-highlight',
    type: 'paragraph',
    text: '通过加粗、列表等方式突出关键信息，让重点一目了然。',
  },
  {
    id: 'b-divider',
    type: 'divider',
  },
  {
    id: 'b-ending',
    type: 'paragraph',
    text: '希望这个示例能帮助你更好地使用 Block Notes 进行内容创作，让你的微信公众号文章更加专业、美观。',
  },
];

export const mockDocs: AppDoc[] = [
  {
    id: 'doc-welcome',
    title: '欢迎使用 Block Notes',
    author: 'Block Notes 团队',
    location: '北京',
    createdAt: '2026-06-27T14:32:00.000Z',
    updatedAt: '2026-06-28T14:32:00.000Z',
    blocks: [
      { id: 'welcome-1', type: 'heading', level: 1, text: '欢迎使用 Block Notes' },
      {
        id: 'welcome-2',
        type: 'paragraph',
        text: 'Block Notes 是一个面向微信公众号创作的块编辑器原型，左侧组织文档，中间编辑内容，右侧实时预览发布效果。',
      },
      { id: 'welcome-3', type: 'heading', level: 2, text: '你可以从这里开始' },
      {
        id: 'welcome-4',
        type: 'bulleted-list',
        items: ['新建一篇文档', '重命名标题', '观察右侧预览实时更新'],
      },
      { id: 'welcome-5', type: 'quote', text: 'Phase 1 使用 mock 数据和 localStorage，专注前端创作体验。' },
    ],
  },
  {
    id: 'doc-changelog',
    title: 'Block Notes 更新日志',
    author: 'Block Notes 团队',
    location: '上海',
    createdAt: '2026-06-26T10:15:00.000Z',
    updatedAt: '2026-06-27T10:15:00.000Z',
    blocks: [
      { id: 'log-1', type: 'heading', level: 1, text: 'Block Notes 更新日志' },
      { id: 'log-2', type: 'paragraph', text: '本周原型聚焦文档系统、微信公众号预览和导出链路。' },
      {
        id: 'log-3',
        type: 'numbered-list',
        items: ['完成三栏工作台布局', '接入 Zustand 文档状态', '准备集成 BlockSuite 编辑器'],
      },
      {
        id: 'log-4',
        type: 'code',
        language: 'ts',
        text: "type Phase = 'frontend' | 'preview' | 'publish';",
      },
    ],
  },
  {
    id: 'doc-wechat-sample',
    title: '微信公众号排版示例',
    author: 'Block Notes 团队',
    location: '北京',
    createdAt: '2026-06-25T14:56:00.000Z',
    updatedAt: '2026-06-28T14:56:00.000Z',
    blocks: sampleBlocks,
  },
];

export function createStarterDoc(): AppDoc {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: '',
    author: '张磊',
    location: '北京',
    createdAt: now,
    updatedAt: now,
    blocks: [
      { id: crypto.randomUUID(), type: 'paragraph', text: '' },
    ],
  };
}
