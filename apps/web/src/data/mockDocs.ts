import type { AppDoc, NormalizedBlock } from '../types/document';

interface MockDocumentOptions {
  id: string;
  title: string;
  summary: string;
  parentId?: string;
  status?: AppDoc['status'];
  blocks?: NormalizedBlock[];
}

const overviewBlocks: NormalizedBlock[] = [
  { id: 'overview-heading', type: 'heading', level: 1, text: 'Workspace Overview' },
  {
    id: 'overview-intro',
    type: 'paragraph',
    text: 'Central hub for product, engineering, and design. All active projects, decisions, and documentation are tracked here.',
  },
  {
    id: 'overview-callout',
    type: 'quote',
    text: 'Q3 closes September 30. Three active projects in progress. Two items awaiting review.',
  },
  { id: 'overview-work-heading', type: 'heading', level: 3, text: 'ACTIVE WORK' },
  {
    id: 'overview-work',
    type: 'todo-list',
    items: [
      'Website redesign — handoff to engineering',
      'Mobile app v2 — complete offline sync',
      'API documentation — review cycle',
      'Q3 OKR check-in with leadership',
      'Onboarding flow shipped',
    ],
    checked: [false, false, false, true, true],
  },
  { id: 'overview-divider', type: 'divider' },
  { id: 'overview-principles-heading', type: 'heading', level: 3, text: 'PRINCIPLES' },
  {
    id: 'overview-principles',
    type: 'paragraph',
    text: 'Ship incrementally. Document decisions. Prioritize ruthlessly. Move fast on reversible choices; slow down on irreversible ones.',
  },
];

export const mockDocs: AppDoc[] = [
  makeMockDocument({
    id: 'overview',
    title: 'Overview',
    summary: 'Workspace overview and current priorities.',
    blocks: overviewBlocks,
  }),
  makeMockDocument({
    id: 'projects',
    title: 'Projects',
    summary: 'Active product and engineering initiatives.',
  }),
  makeMockDocument({
    id: 'website-redesign',
    title: 'Website Redesign',
    parentId: 'projects',
    status: 'active',
    summary: 'Handoff notes, milestones, and open design decisions for the website redesign.',
  }),
  makeMockDocument({
    id: 'mobile-app-v2',
    title: 'Mobile App v2',
    parentId: 'projects',
    status: 'active',
    summary: 'Scope and delivery plan for the next version of the mobile application.',
  }),
  makeMockDocument({
    id: 'api-documentation',
    title: 'API Documentation',
    parentId: 'projects',
    status: 'review',
    summary: 'Reference documentation currently moving through the review cycle.',
  }),
  makeMockDocument({
    id: 'meeting-notes',
    title: 'Meeting Notes',
    summary: 'Shared notes and decisions from recurring team meetings.',
  }),
  makeMockDocument({
    id: 'q3-planning',
    title: 'Q3 Planning',
    parentId: 'meeting-notes',
    summary: 'Quarterly priorities, owners, timelines, and delivery risks.',
  }),
  makeMockDocument({
    id: 'design-review',
    title: 'Design Review',
    parentId: 'meeting-notes',
    summary: 'Design review feedback and the decisions made by the product team.',
  }),
  makeMockDocument({
    id: 'eng-standup',
    title: 'Eng Standup',
    parentId: 'meeting-notes',
    summary: 'Engineering progress, blockers, and follow-up actions.',
  }),
  makeMockDocument({
    id: 'research',
    title: 'Research',
    summary: 'Customer, market, and product research collected by the team.',
  }),
  makeMockDocument({
    id: 'competitive-analysis',
    title: 'Competitive Analysis',
    parentId: 'research',
    summary: 'A comparison of competing products, positioning, and key capabilities.',
  }),
  makeMockDocument({
    id: 'user-interviews',
    title: 'User Interviews',
    parentId: 'research',
    summary: 'Interview notes, repeated themes, and product opportunities.',
  }),
  makeMockDocument({
    id: 'archive',
    title: 'Archive',
    summary: 'Completed and inactive workspace documents.',
  }),
];

function makeMockDocument({
  id,
  title,
  summary,
  parentId,
  status,
  blocks,
}: MockDocumentOptions): AppDoc {
  return {
    id,
    title,
    parentId: parentId ?? null,
    status,
    author: 'Alexandra Chen',
    location: 'Shanghai',
    createdAt: '2026-08-18T09:00:00.000Z',
    updatedAt: '2026-08-26T09:00:00.000Z',
    blocks: blocks ?? [
      { id: `${id}-heading`, type: 'heading', level: 1, text: title },
      { id: `${id}-summary`, type: 'paragraph', text: summary },
      { id: `${id}-notes-heading`, type: 'heading', level: 2, text: 'Notes' },
      {
        id: `${id}-notes`,
        type: 'paragraph',
        text: 'Type here to add context, decisions, and next steps.',
      },
    ],
  };
}

export function createStarterDoc(parentId?: string): AppDoc {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: '',
    parentId: parentId ?? null,
    author: 'Alexandra Chen',
    location: 'Shanghai',
    createdAt: now,
    updatedAt: now,
    blocks: [{ id: crypto.randomUUID(), type: 'paragraph', text: '' }],
  };
}
