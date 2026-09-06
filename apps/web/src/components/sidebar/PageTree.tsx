import { ChevronDown, Circle, Diamond, Square } from 'lucide-react';
import { useState } from 'react';
import {
  filterPageTree,
  type PageIcon,
  type PageNode,
} from './page-tree-data';

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
    return <p className="sidebar-page-tree-empty">No pages found</p>;
  }

  return (
    <div className="sidebar-page-tree" role="tree" aria-label="Pages">
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
        <button
          className="sidebar-page-main"
          type="button"
          onClick={() => {
            onSelect(node);
            onToggle(node);
          }}
        >
          <span className="sidebar-page-leading" aria-hidden="true">
            {hasChildren ? (
              <ChevronDown className={expanded ? '' : 'is-collapsed'} size={10} strokeWidth={1.5} />
            ) : (
              <span className="sidebar-page-chevron-spacer" />
            )}
            <PageGlyph icon={node.icon} />
          </span>
          <span className={`sidebar-page-content ${node.status ? 'has-badge' : ''}`}>
            <span className="sidebar-page-title" title={node.title}>{node.title}</span>
            {node.status ? <span className={`sidebar-page-badge is-${node.status}`}>{node.status}</span> : null}
          </span>
        </button>
        {depth === 0 ? (
          <button
            className="sidebar-page-add"
            type="button"
            aria-label={`Add a page inside ${node.title}`}
            title={`Add inside ${node.title}`}
            onClick={() => onAddChild(node)}
          >
            +
          </button>
        ) : null}
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

function PageGlyph({ icon }: { icon: PageIcon }) {
  const commonProps = { size: 9, strokeWidth: 1.35 };

  if (icon === 'circle') return <Circle {...commonProps} />;
  if (icon === 'square') return <Square {...commonProps} />;
  return <Diamond {...commonProps} />;
}
