import { useEffect, useMemo, useRef, useState } from 'react';
import { useDocsStore } from '../../store/docsStore';
import type { AppDoc } from '../../types/document';
import { PageTree } from './PageTree';
import { buildPageTree, type PageNode } from './page-tree-data';

interface DocumentSidebarProps {
  docs: AppDoc[];
  currentDocId: string;
  onDocumentOpen?: () => void;
  onOpenSettings: () => void;
}

export function DocumentSidebar({
  docs,
  currentDocId,
  onDocumentOpen,
  onOpenSettings,
}: DocumentSidebarProps) {
  const createDoc = useDocsStore((state) => state.createDoc);
  const setCurrentDocId = useDocsStore((state) => state.setCurrentDocId);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pageTree = useMemo(() => buildPageTree(docs), [docs]);
  const [selectedId, setSelectedId] = useState(currentDocId);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setSelectedId(currentDocId);
  }, [currentDocId]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLocaleLowerCase();

      if (key === 'k') {
        event.preventDefault();
        setSearchOpen(true);
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
      }

      if (key === 'n') {
        event.preventDefault();
        handleCreateTopLevelPage();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  });

  const handleCreateTopLevelPage = () => {
    const documentId = createDoc();
    setSelectedId(documentId);
    setQuery('');
    onDocumentOpen?.();
  };

  const handleAddChild = (parent: PageNode) => {
    const documentId = createDoc(parent.id);
    setSelectedId(documentId);
    setQuery('');
    onDocumentOpen?.();
  };

  const handleSelectPage = (node: PageNode) => {
    setSelectedId(node.id);
    setCurrentDocId(node.id);
    onDocumentOpen?.();
  };

  const openSearch = () => {
    setSearchOpen(true);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const closeSearch = () => {
    setQuery('');
    setSearchOpen(false);
  };

  const openInbox = () => {
    const newestDoc = [...docs].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
    if (!newestDoc) return;

    setCurrentDocId(newestDoc.id);
    setSelectedId(newestDoc.id);
    onDocumentOpen?.();
  };

  return (
    <aside className="notion-sidebar" aria-label="Workspace navigation">
      <header className="notion-sidebar-workspace">
        <span className="notion-sidebar-logo" aria-hidden="true">W</span>
        <strong>workspace</strong>
      </header>

      <section className="notion-sidebar-shortcuts" aria-label="Workspace shortcuts">
        {searchOpen ? (
          <label className="notion-sidebar-search">
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              placeholder="Search pages"
              aria-label="Search pages"
              autoFocus
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') closeSearch();
              }}
            />
            <button type="button" aria-label="Close search" onClick={closeSearch}>×</button>
          </label>
        ) : (
          <ShortcutButton label="Search" shortcut="⌘K" onClick={openSearch} />
        )}
        <ShortcutButton label="New page" shortcut="⌘N" onClick={handleCreateTopLevelPage} />
        <ShortcutButton label="Inbox" onClick={openInbox} />
      </section>

      <section className="notion-sidebar-pages" aria-label="Page navigation">
        <header className="notion-sidebar-pages-header">
          <span>PAGES</span>
          <button type="button" aria-label="Add page" title="Add page" onClick={handleCreateTopLevelPage}>+</button>
        </header>

        <div className="notion-sidebar-tree-scroll">
          <PageTree
            nodes={pageTree}
            query={query}
            selectedId={selectedId}
            onAddChild={handleAddChild}
            onSelect={handleSelectPage}
          />
        </div>
      </section>

      <footer className="notion-sidebar-footer">
        <button type="button" onClick={() => setSelectedId('trash')}>Trash</button>
        <button type="button" onClick={onOpenSettings}>Settings</button>
      </footer>
    </aside>
  );
}

function ShortcutButton({
  label,
  shortcut,
  onClick,
}: {
  label: string;
  shortcut?: string;
  onClick: () => void;
}) {
  return (
    <button className="notion-sidebar-shortcut" type="button" onClick={onClick}>
      <span>{label}</span>
      {shortcut ? <kbd>{shortcut}</kbd> : null}
    </button>
  );
}
