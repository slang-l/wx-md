import { Cloud, FileText, PenLine, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDocsStore } from '../../store/docsStore';
import type { AppDoc } from '../../types/document';

interface DocumentSidebarProps {
  docs: AppDoc[];
  currentDocId: string;
  onDocumentOpen?: () => void;
}

export function DocumentSidebar({ docs, currentDocId, onDocumentOpen }: DocumentSidebarProps) {
  const createDoc = useDocsStore((state) => state.createDoc);
  const [query, setQuery] = useState('');
  const filteredDocs = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return docs;
    return docs.filter((doc) => doc.title.toLocaleLowerCase().includes(normalizedQuery));
  }, [docs, query]);

  const handleCreateDoc = () => {
    createDoc();
    onDocumentOpen?.();
  };

  return (
    <aside className="sidebar-panel flex min-h-0 flex-col bg-[#f5f5f4] px-2.5 pb-2.5 pt-2 text-[var(--ui-text)]">
      <header className="mb-2">
        <div className="flex h-11 items-center gap-2 rounded-lg px-2">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#242424] text-white">
            <PenLine size={14} strokeWidth={1.9} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold leading-4 text-[#252525]">Block Notes</div>
            <div className="truncate text-xs leading-4 text-[#858585]">张磊的空间</div>
          </div>
          <button
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[#737373] transition-colors hover:bg-black/[0.06] hover:text-[#252525]"
            type="button"
            aria-label="新建文档"
            title="新建文档"
            onClick={handleCreateDoc}
          >
            <Plus size={16} />
          </button>
        </div>
      </header>

      <label className="mb-3 flex h-8 items-center gap-2 rounded-md border border-transparent bg-black/[0.035] px-2.5 text-[#858585] transition-colors hover:bg-black/[0.05] focus-within:border-[#d8d8d5] focus-within:bg-white">
        <Search size={15} className="shrink-0" />
        <input
          className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-[#303030] outline-none placeholder:text-[#929292]"
          value={query}
          placeholder="搜索文档"
          onChange={(event) => setQuery(event.target.value)}
          aria-label="搜索文档"
        />
        {query ? (
          <button
            className="grid h-5 w-5 place-items-center rounded text-[#929292] hover:bg-black/[0.06] hover:text-[#4b4b4b]"
            type="button"
            onClick={() => setQuery('')}
            aria-label="清空搜索"
          >
            <X size={13} />
          </button>
        ) : null}
      </label>

      <div className="mb-1 flex h-7 items-center justify-between px-2">
        <span className="text-xs font-medium text-[#777]">页面</span>
        <span className="text-xs tabular-nums text-[#9a9a9a]">{docs.length}</span>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto" aria-label="文档列表">
        {filteredDocs.map((doc) => (
          <DocumentListItem
            key={doc.id}
            doc={doc}
            active={doc.id === currentDocId}
            onOpen={onDocumentOpen}
          />
        ))}
        {filteredDocs.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Search className="mx-auto mb-2 text-[#aaa]" size={17} />
            <p className="m-0 text-xs font-medium text-[#575757]">没有匹配的文档</p>
            <button className="mt-2 text-xs text-[var(--ui-accent)] hover:underline" type="button" onClick={() => setQuery('')}>
              清空搜索
            </button>
          </div>
        ) : null}
      </nav>

      <div className="mt-2 border-t border-black/[0.07] pt-2">
        <div className="flex h-11 items-center gap-2 rounded-lg px-2 transition-colors hover:bg-black/[0.035]">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white text-xs font-semibold text-[#5f6fd8] ring-1 ring-black/[0.06]">
            ZL
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium leading-4 text-[#383838]">张磊</div>
            <div className="flex items-center gap-1 text-xs leading-4 text-[#8a8a8a]">
              <Cloud size={11} />
              本地自动保存
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function DocumentListItem({ doc, active, onOpen }: { doc: AppDoc; active: boolean; onOpen?: () => void }) {
  const setCurrentDocId = useDocsStore((state) => state.setCurrentDocId);
  const renameDoc = useDocsStore((state) => state.renameDoc);
  const deleteDoc = useDocsStore((state) => state.deleteDoc);
  const docsCount = useDocsStore((state) => state.docs.length);
  const [editingTitle, setEditingTitle] = useState(doc.title);

  useEffect(() => {
    setEditingTitle(doc.title);
  }, [doc.title]);

  const displayTitle = doc.title.trim() || '无标题文档';

  return (
    <div
      className={`group/doc relative flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 transition-colors ${
        active
          ? 'bg-black/[0.065] text-[#242424]'
          : 'text-[#555] hover:bg-black/[0.04] hover:text-[#292929]'
      }`}
      onClick={() => {
        setCurrentDocId(doc.id);
        onOpen?.();
      }}
    >
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center ${active ? 'text-[var(--ui-accent)]' : 'text-[#8a8a8a]'}`}
      >
        <FileText size={15} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <input
          className="block h-7 w-full min-w-0 truncate rounded border border-transparent bg-transparent px-0 text-[13px] font-medium text-current outline-none focus:border-[#d7d7d4] focus:bg-white focus:px-1.5"
          value={editingTitle}
          placeholder="无标题文档"
          title={displayTitle}
          onChange={(event) => setEditingTitle(event.target.value)}
          onClick={(event) => event.stopPropagation()}
          onFocus={() => setCurrentDocId(doc.id)}
          onBlur={() => renameDoc(doc.id, editingTitle)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') {
              setEditingTitle(doc.title);
              event.currentTarget.blur();
            }
          }}
          aria-label={`重命名 ${displayTitle}`}
        />
      </div>
      <button
        className="absolute right-1 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md bg-[#e8e8e6] text-[#888] opacity-0 transition-colors hover:bg-[#dededb] hover:text-[#bb4040] focus-visible:opacity-100 group-hover/doc:opacity-100 disabled:pointer-events-none disabled:opacity-0"
        type="button"
        disabled={docsCount <= 1}
        onClick={(event) => {
          event.stopPropagation();
          if (window.confirm(`删除《${displayTitle}》？`)) deleteDoc(doc.id);
        }}
        aria-label={`删除 ${displayTitle}`}
        title="删除文档"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
