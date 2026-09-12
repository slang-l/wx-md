import { ChevronDown, FileText, Folder } from 'lucide-react';
import { useEffect, useState } from 'react';
import { filterPageTree, type PageNode } from './page-tree-data';

interface PageTreeProps {
  nodes: PageNode[];
  query: string;
  selectedId: string;
  onAddChild: (node: PageNode) => void;
  onSelect: (node: PageNode) => void;
}

export function PageTree({ nodes, query, selectedId, onAddChild, onSelect }: PageTreeProps) {
  const [expandedIds, setExpandedIds] = useState(
    () => new Set(nodes.filter((node) => node.children.length > 0).map((node) => node.id)),
  );
  const visibleNodes = filterPageTree(nodes, query);
  const forceExpanded = query.trim().length > 0;
  const ancestorKey = JSON.stringify(findAncestors(nodes, selectedId) ?? []);
  useEffect(() => {
    const ancestors = JSON.parse(ancestorKey) as string[];
    if (ancestors.length) setExpandedIds((current) => new Set([...current, ...ancestors]));
  }, [ancestorKey]);

  const toggleNode = (node: PageNode) => {
    if (!node.children?.length) return;
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(node.id)) next.delete(node.id);
      else next.add(node.id);
      return next;
    });
  };

  if (visibleNodes.length === 0) {
    return <p className="sidebar-page-tree-empty">未找到页面</p>;
  }

  return (
    <div className="sidebar-page-tree" role="tree" aria-label="页面列表">
      {visibleNodes.map((node) => (
        <PageTreeNode
          key={node.id}
          depth={0}
          expandedIds={expandedIds}
          forceExpanded={forceExpanded}
          node={node}
          selectedId={selectedId}
          onAddChild={(parent) => {
            setExpandedIds((current) => new Set(current).add(parent.id));
            onAddChild(parent);
          }}
          onSelect={onSelect}
          onToggle={toggleNode}
        />
      ))}
    </div>
  );
}

function findAncestors(nodes: PageNode[], id: string): string[] | null {
  for (const node of nodes) {
    if (node.id === id) return [];
    const childPath = findAncestors(node.children, id);
    if (childPath) return [node.id, ...childPath];
  }
  return null;
}

interface PageTreeNodeProps {
  depth: number;
  expandedIds: Set<string>;
  forceExpanded: boolean;
  node: PageNode;
  selectedId: string;
  onAddChild: (node: PageNode) => void;
  onSelect: (node: PageNode) => void;
  onToggle: (node: PageNode) => void;
}

function PageTreeNode({
  depth,
  expandedIds,
  forceExpanded,
  node,
  selectedId,
  onAddChild,
  onSelect,
  onToggle,
}: PageTreeNodeProps) {
  const hasChildren = Boolean(node.children?.length);
  const expanded = hasChildren && (forceExpanded || expandedIds.has(node.id));
  const selected = node.id === selectedId;

  return (
    <div className="sidebar-page-branch" role="none">
      <div
        className={`sidebar-page-row ${selected ? 'is-selected' : ''}`}
        style={{ '--page-depth': depth } as React.CSSProperties}
        role="treeitem"
        aria-current={selected ? 'page' : undefined}
        aria-expanded={hasChildren ? expanded : undefined}
      >
        {hasChildren && (
          <button
            type="button"
            className="automatic-tree-toggle"
            aria-label={`${expanded ? '折叠' : '展开'}${node.title}`}
            onClick={() => onToggle(node)}
          >
            <ChevronDown size={12} style={{ transform: expanded ? undefined : 'rotate(-90deg)' }} />
          </button>
        )}
        <button
          className="sidebar-page-main"
          type="button"
          onClick={() => {
            onSelect(node);
          }}
        >
          <span className="sidebar-page-leading" aria-hidden="true">
            {hasChildren ? (
              <ChevronDown className={expanded ? '' : 'is-collapsed'} size={10} strokeWidth={1.5} />
            ) : (
              <span className="sidebar-page-dot">·</span>
            )}
          </span>
          {hasChildren ? (
            <Folder size={17} strokeWidth={1.4} />
          ) : (
            <FileText size={15} strokeWidth={1.3} />
          )}
          <span className={`sidebar-page-content ${node.status ? 'has-badge' : ''}`}>
            <span className="sidebar-page-title" title={node.title}>
              {node.title}
            </span>
          </span>
        </button>
        <button
          className="sidebar-page-add"
          type="button"
          aria-label={`在${node.title}中新建子页面`}
          title={`在${node.title}中新建子页面`}
          onClick={() => onAddChild(node)}
        >
          +
        </button>
      </div>

      {expanded ? (
        <div role="group">
          {node.children?.map((child) => (
            <PageTreeNode
              key={child.id}
              depth={depth + 1}
              expandedIds={expandedIds}
              forceExpanded={forceExpanded}
              node={child}
              selectedId={selectedId}
              onAddChild={onAddChild}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
