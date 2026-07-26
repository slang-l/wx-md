import { useCallback } from 'react';
import { useDocsStore } from '../../store/docsStore';
import type { AppDoc, NormalizedBlock } from '../../types/document';
import { BlockSuiteEditor } from './BlockSuiteEditor';

interface EditorColumnProps {
  doc: AppDoc;
}

export function EditorColumn({ doc }: EditorColumnProps) {
  const renameDoc = useDocsStore((state) => state.renameDoc);
  const updateDocBlocks = useDocsStore((state) => state.updateDocBlocks);

  const handleBlocksChange = useCallback(
    (blocks: NormalizedBlock[]) => {
      updateDocBlocks(doc.id, blocks);
    },
    [doc.id, updateDocBlocks],
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      renameDoc(doc.id, title);
    },
    [doc.id, renameDoc],
  );

  return (
    <section className="editor-column min-h-0 bg-[var(--ui-surface)]" aria-label="文档编辑区">
      <BlockSuiteEditor
        docId={doc.id}
        title={doc.title}
        blocks={doc.blocks}
        onBlocksChange={handleBlocksChange}
        onTitleChange={handleTitleChange}
      />
    </section>
  );
}
