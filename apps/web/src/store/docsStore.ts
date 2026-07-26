import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createStarterDoc, mockDocs } from '../data/mockDocs';
import type { AppDoc, NormalizedBlock } from '../types/document';
import { nowIso } from '../utils/date';

interface DocsState {
  docs: AppDoc[];
  currentDocId: string;
  createDoc: () => string;
  deleteDoc: (id: string) => void;
  setCurrentDocId: (id: string) => void;
  renameDoc: (id: string, title: string) => void;
  updateDocBlocks: (id: string, blocks: NormalizedBlock[]) => void;
}

function touchDoc(doc: AppDoc, patch: Partial<AppDoc>): AppDoc {
  return {
    ...doc,
    ...patch,
    updatedAt: nowIso(),
  };
}

export const useDocsStore = create<DocsState>()(
  persist(
    (set, get) => ({
      docs: mockDocs,
      currentDocId: mockDocs[2]?.id ?? mockDocs[0].id,
      createDoc: () => {
        const doc = createStarterDoc();
        set((state) => ({
          docs: [doc, ...state.docs],
          currentDocId: doc.id,
        }));
        return doc.id;
      },
      deleteDoc: (id) => {
        const state = get();
        if (state.docs.length <= 1) return;

        const nextDocs = state.docs.filter((doc) => doc.id !== id);
        const deletedCurrent = state.currentDocId === id;
        set({
          docs: nextDocs,
          currentDocId: deletedCurrent ? nextDocs[0].id : state.currentDocId,
        });
      },
      setCurrentDocId: (id) => {
        if (get().docs.some((doc) => doc.id === id)) {
          set({ currentDocId: id });
        }
      },
      renameDoc: (id, title) => {
        set((state) => ({
          docs: state.docs.map((doc) => {
            if (doc.id !== id || doc.title === title) {
              return doc;
            }

            const firstBlock = doc.blocks[0];
            const shouldSyncLegacyTitle =
              firstBlock?.type === 'heading' && firstBlock.level === 1 && firstBlock.text?.trim() === doc.title.trim();

            return touchDoc(doc, {
              title,
              blocks: shouldSyncLegacyTitle ? [{ ...firstBlock, text: title }, ...doc.blocks.slice(1)] : doc.blocks,
            });
          }),
        }));
      },
      updateDocBlocks: (id, blocks) => {
        set((state) => ({
          docs: state.docs.map((doc) => (doc.id === id ? touchDoc(doc, { blocks }) : doc)),
        }));
      },
    }),
    {
      name: 'block-notes-docs',
      version: 1,
      partialize: (state) => ({
        docs: state.docs,
        currentDocId: state.currentDocId,
      }),
    },
  ),
);
