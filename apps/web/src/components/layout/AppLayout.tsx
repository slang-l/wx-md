import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { FileText, LogOut, PanelRight, PenLine, Settings2 } from 'lucide-react';
import { EditorColumn } from '../editor/EditorColumn';
import { SettingsModal } from '../settings';
import { DocumentSidebar } from '../sidebar/DocumentSidebar';
import { useDocsStore } from '../../store/docsStore';
import { WeChatPreview } from '../preview/WeChatPreview';
import type { AuthUser } from '../../services/auth-api';

type ResizeEdge = 'left-editor' | 'editor-preview';
type CompactPane = 'documents' | 'editor' | 'preview';

interface PanelWidths {
  left: number;
  editor: number;
  preview: number;
}

const HANDLE_WIDTH = 8;
const KEYBOARD_RESIZE_STEP = 24;
const MIN_WIDTHS: PanelWidths = {
  left: 232,
  editor: 480,
  preview: 360,
};
const DEFAULT_WIDTHS: PanelWidths = {
  left: 248,
  editor: 720,
  preview: 480,
};
const COMPACT_LAYOUT_QUERY = '(max-width: 1099px)';

interface AppLayoutProps {
  isSigningOut: boolean;
  onSignOut: () => void | Promise<void>;
  user: AuthUser;
}

export function AppLayout({ isSigningOut, onSignOut, user }: AppLayoutProps) {
  const docs = useDocsStore((state) => state.docs);
  const currentDocId = useDocsStore((state) => state.currentDocId);
  const currentDoc = docs.find((doc) => doc.id === currentDocId) ?? docs[0];
  const layoutRef = useRef<HTMLElement>(null);
  const resizeRef = useRef<{
    edge: ResizeEdge;
    pointerId: number;
    startX: number;
    startWidths: PanelWidths;
  } | null>(null);
  const [activeResize, setActiveResize] = useState<ResizeEdge | null>(null);
  const [compactPane, setCompactPane] = useState<CompactPane>('editor');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(COMPACT_LAYOUT_QUERY).matches,
  );
  const [panelWidths, setPanelWidths] = useState<PanelWidths>(() =>
    fitPanelWidths(DEFAULT_WIDTHS, getAvailablePanelWidth(null)),
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(COMPACT_LAYOUT_QUERY);
    const syncLayoutMode = () => setIsCompactLayout(mediaQuery.matches);

    syncLayoutMode();
    mediaQuery.addEventListener('change', syncLayoutMode);
    return () => mediaQuery.removeEventListener('change', syncLayoutMode);
  }, []);

  useEffect(() => {
    const syncPanelWidths = () => {
      setPanelWidths((currentWidths) => fitPanelWidths(currentWidths, getAvailablePanelWidth(layoutRef.current)));
    };

    syncPanelWidths();
    window.addEventListener('resize', syncPanelWidths);
    return () => window.removeEventListener('resize', syncPanelWidths);
  }, []);

  useEffect(() => {
    if (!activeResize) return undefined;

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [activeResize]);

  const resizeByDelta = useCallback((edge: ResizeEdge, startWidths: PanelWidths, delta: number): PanelWidths => {
    if (edge === 'left-editor') {
      const combinedWidth = startWidths.left + startWidths.editor;
      const left = clamp(startWidths.left + delta, MIN_WIDTHS.left, combinedWidth - MIN_WIDTHS.editor);

      return {
        ...startWidths,
        left,
        editor: combinedWidth - left,
      };
    }

    const combinedWidth = startWidths.editor + startWidths.preview;
    const editor = clamp(startWidths.editor + delta, MIN_WIDTHS.editor, combinedWidth - MIN_WIDTHS.preview);

    return {
      ...startWidths,
      editor,
      preview: combinedWidth - editor,
    };
  }, []);

  const beginResize = useCallback(
    (edge: ResizeEdge, event: PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      resizeRef.current = {
        edge,
        pointerId: event.pointerId,
        startX: event.clientX,
        startWidths: panelWidths,
      };
      setActiveResize(edge);
    },
    [panelWidths],
  );

  const updateResize = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const resizeState = resizeRef.current;
      if (!resizeState || resizeState.pointerId !== event.pointerId) return;

      event.preventDefault();
      setPanelWidths(resizeByDelta(resizeState.edge, resizeState.startWidths, event.clientX - resizeState.startX));
    },
    [resizeByDelta],
  );

  const endResize = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const resizeState = resizeRef.current;
    if (!resizeState || resizeState.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    resizeRef.current = null;
    setActiveResize(null);
  }, []);

  const resizeWithKeyboard = useCallback(
    (edge: ResizeEdge, event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const multiplier = event.shiftKey ? 4 : 1;
      event.preventDefault();
      setPanelWidths((currentWidths) => resizeByDelta(edge, currentWidths, direction * KEYBOARD_RESIZE_STEP * multiplier));
    },
    [resizeByDelta],
  );

  const gridTemplateColumns = useMemo(
    () =>
      `${panelWidths.left}px ${HANDLE_WIDTH}px ${panelWidths.editor}px ${HANDLE_WIDTH}px ${panelWidths.preview}px`,
    [panelWidths],
  );

  if (!currentDoc) {
    return null;
  }

  if (isCompactLayout) {
    return (
      <>
        <main className="flex h-[100dvh] min-h-0 flex-col bg-[var(--ui-app-bg)] text-[var(--ui-text)]">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--ui-line)] bg-[var(--ui-surface)] px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--ui-accent)] text-white">
              <PenLine size={16} strokeWidth={1.8} />
            </span>
            <div className="hidden min-w-0 sm:block">
              <div className="truncate text-sm font-semibold tracking-[-0.01em]">Block Notes</div>
              <div className="truncate text-xs text-[var(--ui-muted)]">{user.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1 rounded-lg border border-[var(--ui-line)] bg-[var(--ui-subtle)] p-1" aria-label="工作区视图">
              <CompactNavButton
                active={compactPane === 'documents'}
                icon={<FileText size={15} />}
                label="文档"
                onClick={() => setCompactPane('documents')}
              />
              <CompactNavButton
                active={compactPane === 'editor'}
                icon={<PenLine size={15} />}
                label="编辑"
                onClick={() => setCompactPane('editor')}
              />
              <CompactNavButton
                active={compactPane === 'preview'}
                icon={<PanelRight size={15} />}
                label="预览"
                onClick={() => setCompactPane('preview')}
              />
            </nav>
            <button
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--ui-muted)] transition-colors hover:bg-[var(--ui-subtle)] hover:text-[var(--ui-text)]"
              type="button"
              aria-label="打开设置"
              title="设置"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings2 size={16} strokeWidth={1.8} />
            </button>
            <button
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--ui-muted)] transition-colors hover:bg-[var(--ui-subtle)] hover:text-[var(--ui-status-danger)]"
              type="button"
              aria-label={isSigningOut ? '正在退出登录' : '退出登录'}
              title={isSigningOut ? '正在退出登录' : '退出登录'}
              disabled={isSigningOut}
              onClick={onSignOut}
            >
              <LogOut size={16} strokeWidth={1.8} />
            </button>
          </div>
        </header>

        <div className="min-h-0 min-w-0 flex-1 overflow-hidden [&>*]:h-full [&>*]:w-full">
          {compactPane === 'documents' ? (
            <DocumentSidebar
              docs={docs}
              currentDocId={currentDoc.id}
              isSigningOut={isSigningOut}
              onDocumentOpen={() => setCompactPane('editor')}
              onOpenSettings={() => setSettingsOpen(true)}
              onSignOut={onSignOut}
              user={user}
            />
          ) : null}
          {compactPane === 'editor' ? <EditorColumn doc={currentDoc} /> : null}
          {compactPane === 'preview' ? <WeChatPreview doc={currentDoc} /> : null}
        </div>
        </main>
        <SettingsModal
          appName="Block Notes"
          appVersion="0.1.0"
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          onSignOut={onSignOut}
          user={user}
        />
      </>
    );
  }

  return (
    <>
      <main
        ref={layoutRef}
        className={`grid h-[100dvh] bg-[var(--ui-app-bg)] text-[var(--ui-text)] ${activeResize ? 'cursor-col-resize select-none' : ''}`}
        style={{ gridTemplateColumns }}
      >
        <div className="min-h-0 min-w-0 overflow-hidden [&>*]:h-full [&>*]:w-full">
          <DocumentSidebar
            currentDocId={currentDoc.id}
            docs={docs}
            isSigningOut={isSigningOut}
            onOpenSettings={() => setSettingsOpen(true)}
            onSignOut={onSignOut}
            user={user}
          />
        </div>
        <ResizeHandle
          active={activeResize === 'left-editor'}
          edge="left-editor"
          label="Resize sidebar and editor"
          onKeyDown={resizeWithKeyboard}
          onPointerCancel={endResize}
          onPointerDown={beginResize}
          onPointerMove={updateResize}
          onPointerUp={endResize}
        />
        <div className="min-h-0 min-w-0 overflow-hidden [&>*]:h-full [&>*]:w-full">
          <EditorColumn doc={currentDoc} />
        </div>
        <ResizeHandle
          active={activeResize === 'editor-preview'}
          edge="editor-preview"
          label="Resize editor and preview"
          onKeyDown={resizeWithKeyboard}
          onPointerCancel={endResize}
          onPointerDown={beginResize}
          onPointerMove={updateResize}
          onPointerUp={endResize}
        />
        <div className="min-h-0 min-w-0 overflow-hidden [&>*]:h-full [&>*]:w-full">
          <WeChatPreview doc={currentDoc} />
        </div>
      </main>
      <SettingsModal
        appName="Block Notes"
        appVersion="0.1.0"
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSignOut={onSignOut}
        user={user}
      />
    </>
  );
}

interface ResizeHandleProps {
  active: boolean;
  edge: ResizeEdge;
  label: string;
  onKeyDown: (edge: ResizeEdge, event: KeyboardEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerDown: (edge: ResizeEdge, event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
}

function ResizeHandle({
  active,
  edge,
  label,
  onKeyDown,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: ResizeHandleProps) {
  return (
    <div
      className="group relative z-10 h-full cursor-col-resize bg-[var(--ui-app-bg)] outline-none"
      role="separator"
      aria-label={label}
      aria-orientation="vertical"
      tabIndex={0}
      onKeyDown={(event) => onKeyDown(edge, event)}
      onPointerCancel={onPointerCancel}
      onPointerDown={(event) => onPointerDown(edge, event)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <span
        className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors ${
          active ? 'bg-[var(--ui-accent)]' : 'bg-[var(--ui-line-strong)] group-hover:bg-[var(--ui-muted)]'
        }`}
        aria-hidden="true"
      />
      <span
        className={`absolute left-1/2 top-1/2 h-10 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-sm border border-[var(--ui-surface)] transition-colors ${
          active ? 'bg-[var(--ui-accent)]' : 'bg-transparent group-hover:bg-[var(--ui-muted)]'
        }`}
        aria-hidden="true"
      />
    </div>
  );
}

function CompactNavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
        active
          ? 'bg-[var(--ui-surface)] text-[var(--ui-text)] shadow-[var(--ui-shadow-xs)]'
          : 'text-[var(--ui-muted)] hover:text-[var(--ui-text)]'
      }`}
      type="button"
      aria-pressed={active}
      onClick={onClick}
    >
      {icon}
      <span className="hidden min-[480px]:inline">{label}</span>
    </button>
  );
}

function getAvailablePanelWidth(container: HTMLElement | null) {
  const measuredWidth = container?.getBoundingClientRect().width ?? getFallbackLayoutWidth();
  return Math.max(measuredWidth - HANDLE_WIDTH * 2, getMinimumPanelWidth());
}

function getFallbackLayoutWidth() {
  if (typeof window === 'undefined') {
    return DEFAULT_WIDTHS.left + DEFAULT_WIDTHS.editor + DEFAULT_WIDTHS.preview + HANDLE_WIDTH * 2;
  }

  return window.innerWidth;
}

function getMinimumPanelWidth() {
  return MIN_WIDTHS.left + MIN_WIDTHS.editor + MIN_WIDTHS.preview;
}

function fitPanelWidths(widths: PanelWidths, availableWidth: number): PanelWidths {
  const safeAvailableWidth = Math.max(availableWidth, getMinimumPanelWidth());
  const left = clamp(widths.left, MIN_WIDTHS.left, safeAvailableWidth - MIN_WIDTHS.editor - MIN_WIDTHS.preview);
  const preview = clamp(widths.preview, MIN_WIDTHS.preview, safeAvailableWidth - left - MIN_WIDTHS.editor);

  return {
    left,
    editor: safeAvailableWidth - left - preview,
    preview,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
