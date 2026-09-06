import type { AppDoc } from '../../types/document';

export type PageStatus = 'active' | 'review';

export type PageIcon = 'diamond' | 'circle' | 'square';

export interface PageNode {
  id: string;
  title: string;
  icon: PageIcon;
  status?: PageStatus;
  children: PageNode[];
}

export function buildPageTree(docs: AppDoc[]): PageNode[] {
  const nodeById = new Map<string, PageNode>();
  const roots: PageNode[] = [];

  docs.forEach((doc) => {
    nodeById.set(doc.id, {
      id: doc.id,
      title: doc.title.trim() || 'Untitled',
      icon: 'diamond',
      status: doc.status,
      children: [],
    });
  });

  docs.forEach((doc) => {
    const node = nodeById.get(doc.id);
    if (!node) return;

    const parent = doc.parentId && doc.parentId !== doc.id ? nodeById.get(doc.parentId) : undefined;
    if (parent) {
      node.icon = 'square';
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  roots.forEach((node) => {
    node.icon = node.children.length > 0 ? 'circle' : 'diamond';
  });

  return roots;
}

export function filterPageTree(nodes: PageNode[], query: string): PageNode[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return nodes;

  return nodes.flatMap((node) => {
    const children = filterPageTree(node.children, normalizedQuery);
    if (node.title.toLocaleLowerCase().includes(normalizedQuery) || children.length > 0) {
      return [{ ...node, children }];
    }
    return [];
  });
}
