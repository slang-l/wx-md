import { useEffect, useRef } from 'react';
import '@blocksuite/presets/themes/affine.css';
import { AffineEditorContainer } from '@blocksuite/presets';
import {
  createBlockSuiteDocument,
  getBlockSuiteTitle,
  normalizedBlocksFromBlockSuiteDoc,
  observeBlockSuiteTitle,
  syncBlockSuiteTitle,
  type BlockSuiteDocumentBridge,
} from '../../adapters/blocksuite-adapter';
import type { NormalizedBlock } from '../../types/document';

const MAX_PERSISTED_IMAGE_SIZE = 1_500_000;

interface BlockSuiteEditorProps {
  docId: string;
  title: string;
  blocks: NormalizedBlock[];
  onBlocksChange: (blocks: NormalizedBlock[]) => void;
  onTitleChange: (title: string) => void;
}

export function BlockSuiteEditor({
  docId,
  title,
  blocks,
  onBlocksChange,
  onTitleChange,
}: BlockSuiteEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const bridgeRef = useRef<BlockSuiteDocumentBridge | null>(null);
  const blocksChangeRef = useRef(onBlocksChange);
  const titleChangeRef = useRef(onTitleChange);

  blocksChangeRef.current = onBlocksChange;
  titleChangeRef.current = onTitleChange;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let disposed = false;
    let blocksRevision = 0;
    let blocksTimer: number | undefined;
    let titleTimer: number | undefined;
    const commitBlocks = blocksChangeRef.current;
    const commitTitle = titleChangeRef.current;

    const bridge = createBlockSuiteDocument(title, blocks);
    bridgeRef.current = bridge;

    // This is the same native container used by the in-repo BlockSuite
    // playground. It owns the title, slash menu and floating format toolbar.
    const editor = new AffineEditorContainer();
    editor.doc = bridge.doc;
    editor.mode = 'page';
    editor.autofocus = false;
    editor.className = 'affine-editor-container';
    editor.setAttribute('aria-label', 'BlockSuite 文档编辑器');
    host.replaceChildren(editor);

    const blockDisposable = bridge.doc.slots.blockUpdated.on(() => {
      window.clearTimeout(blocksTimer);
      const revision = ++blocksRevision;
      blocksTimer = window.setTimeout(() => {
        void normalizedBlocksFromBlockSuiteDoc(bridge.doc).then((nextBlocks) => {
          if (!disposed && revision === blocksRevision) {
            commitBlocks(nextBlocks);
          }
        });
      }, 120);
    });

    const disposeTitleObserver = observeBlockSuiteTitle(bridge.doc, (nextTitle) => {
      window.clearTimeout(titleTimer);
      titleTimer = window.setTimeout(() => {
        if (!disposed) commitTitle(nextTitle);
      }, 120);
    });

    void editor.getUpdateComplete().then(() => {
      if (!disposed) configureEditor(editor);
    });

    return () => {
      const shouldFlushBlocks = blocksTimer !== undefined;
      const shouldFlushTitle = titleTimer !== undefined;
      disposed = true;
      window.clearTimeout(blocksTimer);
      window.clearTimeout(titleTimer);

      if (shouldFlushBlocks) {
        void normalizedBlocksFromBlockSuiteDoc(bridge.doc).then(commitBlocks);
      }
      if (shouldFlushTitle) {
        commitTitle(getBlockSuiteTitle(bridge.doc));
      }

      blockDisposable.dispose();
      disposeTitleObserver();
      bridgeRef.current = null;
      host.replaceChildren();
    };
  }, [docId]);

  useEffect(() => {
    if (!bridgeRef.current) return;
    syncBlockSuiteTitle(bridgeRef.current.doc, title);
  }, [title]);

  return <div ref={hostRef} className="blocksuite-editor-host h-full min-h-0 w-full" />;
}

function configureEditor(editor: AffineEditorContainer) {
  const imageService = editor.host.spec.getService('affine:image');
  imageService.maxFileSize = MAX_PERSISTED_IMAGE_SIZE;

  type SlashMenuItem = { groupName: string } | { name: string } | ((...args: unknown[]) => unknown);
  type SlashMenuWidget = HTMLElement & {
    config: {
      items: SlashMenuItem[];
      [key: string]: unknown;
    };
  };

  const slashMenu = editor.querySelector<SlashMenuWidget>('affine-slash-menu-widget');
  if (!slashMenu) return;

  // Keep BlockSuite's native menu, limited to blocks that the app's Markdown
  // and WeChat persistence adapters can round-trip without data loss.
  const allowedGroups = new Set(['Basic', 'List', 'Style', 'Content & Media', 'Actions']);
  const allowedItems = new Set([
    'Text',
    'Heading 1',
    'Heading 2',
    'Heading 3',
    'Code Block',
    'Quote',
    'Divider',
    'Bulleted List',
    'Numbered List',
    'To-do List',
    'Bold',
    'Italic',
    'Underline',
    'Strikethrough',
    'Image',
    'Move Up',
    'Move Down',
    'Copy',
    'Duplicate',
    'Delete',
  ]);

  slashMenu.config = {
    ...slashMenu.config,
    items: slashMenu.config.items.filter((item) => {
      if (typeof item === 'function') return false;
      if ('groupName' in item) return allowedGroups.has(item.groupName);
      return allowedItems.has(item.name);
    }),
  };
}
