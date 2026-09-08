import type { InlineTextDelta, NormalizedBlock } from '../../types/document';

export type ContentComponentCategory = 'structure' | 'emphasis' | 'engagement' | 'brand';

export type ContentComponentIcon =
  | 'author'
  | 'chapter'
  | 'follow'
  | 'gift'
  | 'intro'
  | 'notice'
  | 'points'
  | 'question'
  | 'quote'
  | 'read-more'
  | 'steps'
  | 'support'
  | 'summary';

export interface ContentComponentDefinition {
  id: string;
  name: string;
  description: string;
  category: ContentComponentCategory;
  icon: ContentComponentIcon;
  keywords: string[];
  blocks: NormalizedBlock[];
}

export const contentComponentCategories: Array<{
  id: 'all' | ContentComponentCategory;
  label: string;
}> = [
  { id: 'all', label: '全部' },
  { id: 'structure', label: '结构' },
  { id: 'emphasis', label: '重点' },
  { id: 'engagement', label: '互动' },
  { id: 'brand', label: '品牌' },
];

export const contentComponents: ContentComponentDefinition[] = [
  {
    id: 'opening-intro',
    name: '开场白',
    description: '用一句引子和一段背景自然开启文章',
    category: 'structure',
    icon: 'intro',
    keywords: ['开头', '导语', '引言', '背景'],
    blocks: [
      {
        id: 'opening-intro-lead',
        type: 'quote',
        text: '用一句有张力的话，带读者进入这篇文章。',
      },
      {
        id: 'opening-intro-context',
        type: 'paragraph',
        text: '在这里补充事件背景、读者痛点，以及继续阅读能够获得什么。',
      },
    ],
  },
  {
    id: 'chapter-divider',
    name: '章节分隔',
    description: '分隔长文内容并开启一个新章节',
    category: 'structure',
    icon: 'chapter',
    keywords: ['章节', '分隔', '标题', '换节'],
    blocks: [
      { id: 'chapter-divider-line', type: 'divider' },
      { id: 'chapter-divider-title', type: 'heading', level: 2, text: '章节标题' },
      { id: 'chapter-divider-body', type: 'paragraph', text: '从这里开始展开本章节的内容。' },
    ],
  },
  {
    id: 'step-guide',
    name: '步骤指南',
    description: '快速插入清晰的分步操作说明',
    category: 'structure',
    icon: 'steps',
    keywords: ['步骤', '教程', '操作', '流程', '清单'],
    blocks: [
      { id: 'step-guide-title', type: 'heading', level: 2, text: '操作步骤' },
      {
        id: 'step-guide-list',
        type: 'numbered-list',
        items: ['第一步：说明要完成的动作', '第二步：补充关键细节', '第三步：确认最终结果'],
      },
    ],
  },
  {
    id: 'article-summary',
    name: '文章小结',
    description: '归纳主要结论并帮助读者快速回顾',
    category: 'structure',
    icon: 'summary',
    keywords: ['总结', '小结', '结论', '回顾'],
    blocks: [
      { id: 'article-summary-line', type: 'divider' },
      { id: 'article-summary-title', type: 'heading', level: 2, text: '写在最后' },
      {
        id: 'article-summary-points',
        type: 'bulleted-list',
        items: ['核心结论一', '核心结论二', '接下来可以采取的行动'],
      },
    ],
  },
  {
    id: 'key-points',
    name: '核心要点',
    description: '集中呈现最值得读者记住的信息',
    category: 'emphasis',
    icon: 'points',
    keywords: ['重点', '要点', '摘要', '关键'],
    blocks: [
      { id: 'key-points-title', type: 'heading', level: 3, text: '核心要点' },
      {
        id: 'key-points-list',
        type: 'bulleted-list',
        items: ['第一个关键观点', '第二个关键观点', '第三个关键观点'],
      },
    ],
  },
  {
    id: 'golden-quote',
    name: '金句',
    description: '突出一句适合记忆或分享的话',
    category: 'emphasis',
    icon: 'quote',
    keywords: ['金句', '引用', '强调', '分享'],
    blocks: [
      {
        id: 'golden-quote-text',
        type: 'quote',
        text: '在这里写下一句值得被记住的话。',
        delta: [{ insert: '在这里写下一句值得被记住的话。', attributes: { bold: true } }],
      },
    ],
  },
  {
    id: 'important-notice',
    name: '重点提示',
    description: '提醒读者注意限制、风险或关键条件',
    category: 'emphasis',
    icon: 'notice',
    keywords: ['提醒', '注意', '警告', '风险', '提示'],
    blocks: [
      { id: 'important-notice-title', type: 'heading', level: 3, text: '特别提醒' },
      {
        id: 'important-notice-text',
        type: 'quote',
        text: '请在这里补充必须注意的条件、风险或例外情况。',
      },
    ],
  },
  {
    id: 'reader-question',
    name: '互动提问',
    description: '在文末邀请读者分享观点和经历',
    category: 'engagement',
    icon: 'question',
    keywords: ['互动', '提问', '评论', '留言', '讨论'],
    blocks: [
      { id: 'reader-question-line', type: 'divider' },
      { id: 'reader-question-title', type: 'heading', level: 3, text: '聊一聊' },
      {
        id: 'reader-question-text',
        type: 'paragraph',
        text: '你对这个话题有什么看法？欢迎在评论区分享你的经历。',
      },
    ],
  },
  {
    id: 'resource-claim',
    name: '资料领取',
    description: '说明资料内容和领取方式',
    category: 'engagement',
    icon: 'gift',
    keywords: ['资料', '福利', '领取', '关键词', '下载'],
    blocks: [
      { id: 'resource-claim-title', type: 'heading', level: 3, text: '资料领取' },
      {
        id: 'resource-claim-text',
        type: 'paragraph',
        text: '回复关键词「资料」即可获取本文配套内容。',
        delta: [
          { insert: '回复关键词「' },
          { insert: '资料', attributes: { bold: true } },
          { insert: '」即可获取本文配套内容。' },
        ],
      },
    ],
  },
  {
    id: 'read-original',
    name: '阅读原文',
    description: '引导读者通过文末入口继续了解',
    category: 'engagement',
    icon: 'read-more',
    keywords: ['原文', '链接', '跳转', '更多'],
    blocks: [
      { id: 'read-original-line', type: 'divider' },
      {
        id: 'read-original-text',
        type: 'paragraph',
        text: '点击文末「阅读原文」，查看完整内容。',
        delta: [
          { insert: '点击文末「' },
          { insert: '阅读原文', attributes: { bold: true } },
          { insert: '」，查看完整内容。' },
        ],
      },
    ],
  },
  {
    id: 'author-profile',
    name: '作者介绍',
    description: '在文末补充作者身份和专业背景',
    category: 'brand',
    icon: 'author',
    keywords: ['作者', '介绍', '简介', '署名', '个人'],
    blocks: [
      { id: 'author-profile-line', type: 'divider' },
      { id: 'author-profile-title', type: 'heading', level: 3, text: '关于作者' },
      {
        id: 'author-profile-text',
        type: 'paragraph',
        text: '作者姓名｜身份或领域\n用一两句话介绍你的经验、专长和持续关注的话题。',
      },
    ],
  },
  {
    id: 'follow-guide',
    name: '关注引导',
    description: '说明账号定位并邀请读者持续关注',
    category: 'brand',
    icon: 'follow',
    keywords: ['关注', '公众号', '订阅', '品牌'],
    blocks: [
      { id: 'follow-guide-line', type: 'divider' },
      { id: 'follow-guide-title', type: 'heading', level: 3, text: '关注我们' },
      {
        id: 'follow-guide-text',
        type: 'paragraph',
        text: '关注公众号，持续获取更多有价值的内容。',
      },
    ],
  },
  {
    id: 'qr-code-guide',
    name: '二维码引导',
    description: '预留二维码位置并补充扫码说明',
    category: 'brand',
    icon: 'follow',
    keywords: ['二维码', '扫码', '关注', '添加'],
    blocks: [
      { id: 'qr-code-guide-title', type: 'heading', level: 3, text: '扫码关注' },
      {
        id: 'qr-code-guide-placeholder',
        type: 'quote',
        text: '请在这里插入二维码图片。',
      },
      {
        id: 'qr-code-guide-text',
        type: 'paragraph',
        text: '长按识别二维码，获取更多内容。',
      },
    ],
  },
  {
    id: 'support-guide',
    name: '赞赏引导',
    description: '礼貌邀请读者支持持续创作',
    category: 'brand',
    icon: 'support',
    keywords: ['赞赏', '支持', '创作', '感谢'],
    blocks: [
      { id: 'support-guide-line', type: 'divider' },
      { id: 'support-guide-title', type: 'heading', level: 3, text: '感谢支持' },
      {
        id: 'support-guide-text',
        type: 'paragraph',
        text: '如果这篇文章对你有帮助，欢迎赞赏支持持续创作。',
      },
    ],
  },
];

export function createContentComponentBlocks(
  component: ContentComponentDefinition,
): NormalizedBlock[] {
  return component.blocks.map((block) => ({
    ...block,
    id: crypto.randomUUID(),
    ...(block.delta ? { delta: cloneInlineDelta(block.delta) } : {}),
    ...(block.items ? { items: [...block.items] } : {}),
    ...(block.itemDeltas ? { itemDeltas: block.itemDeltas.map(cloneInlineDelta) } : {}),
    ...(block.checked ? { checked: [...block.checked] } : {}),
  }));
}

function cloneInlineDelta(delta: InlineTextDelta[]): InlineTextDelta[] {
  return delta.map((part) => ({
    ...part,
    ...(part.attributes ? { attributes: { ...part.attributes } } : {}),
  }));
}
