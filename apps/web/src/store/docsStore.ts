import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createStarterDoc, mockDocs } from '../data/mockDocs';
import type { AppDoc, NormalizedBlock } from '../types/document';
import { nowIso } from '../utils/date';

const LEGACY_DOCS_STORAGE_KEY = 'block-notes-docs';
const DOCS_STORAGE_PREFIX = 'block-notes-docs-user';
const EMPTY_DOCS_STORAGE_KEY = 'block-notes-docs-no-session';

let activeDocsOwnerId: string | null = null;
let activeDocsOwnerLoaded = false;
let docsHydrationPromise: Promise<void> | null = null;

export function getDocsOwnerId() {
  return activeDocsOwnerId;
}

interface DocsState {
  publishRecords: PublishRecord[];
  savePublishRecord: (record: PublishRecord, ownerId?: string | null) => void;
  restoreDoc: (id: string) => void;
  permanentlyDeleteDoc: (id: string) => void;
  moveDoc: (id: string, parentId: string | null) => void;
  docs: AppDoc[];
  currentDocId: string;
  createDoc: (parentId?: string) => string;
  deleteDoc: (id: string) => void;
  setCurrentDocId: (id: string) => void;
  renameDoc: (id: string, title: string) => void;
  updateDocBlocks: (id: string, blocks: NormalizedBlock[]) => void;
}

export interface PublishRecord {
  publishId: string;
  docId: string;
  title: string;
  submittedAt: string;
  state: 'publishing' | 'published' | 'failed';
  articleUrl?: string | null;
  message?: string;
}

export function descendantIds(docs: AppDoc[], id: string): Set<string> {
  const ids = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const doc of docs) {
      if (doc.parentId && ids.has(doc.parentId) && !ids.has(doc.id)) {
        ids.add(doc.id);
        changed = true;
      }
    }
  }
  return ids;
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
      publishRecords: [],
      savePublishRecord: (record, ownerId) => {
        if (ownerId !== undefined && ownerId !== activeDocsOwnerId) return;
        set((state) => ({
          publishRecords: [
            record,
            ...state.publishRecords.filter((item) => item.publishId !== record.publishId),
          ],
        }));
      },
      moveDoc: (id, parentId) => {
        const docs = get().docs;
        if (
          parentId &&
          (!docs.some((doc) => doc.id === parentId && !doc.deletedAt) ||
            descendantIds(docs, id).has(parentId))
        )
          return;
        set({ docs: docs.map((doc) => (doc.id === id ? touchDoc(doc, { parentId }) : doc)) });
      },
      restoreDoc: (id) => {
        const docs = get().docs;
        const ids = descendantIds(docs, id);
        set({
          docs: docs.map((doc) =>
            ids.has(doc.id)
              ? {
                  ...doc,
                  deletedAt: undefined,
                  parentId:
                    doc.parentId &&
                    !ids.has(doc.parentId) &&
                    !docs.some((parent) => parent.id === doc.parentId && !parent.deletedAt)
                      ? null
                      : doc.parentId,
                }
              : doc,
          ),
        });
      },
      permanentlyDeleteDoc: (id) => {
        const docs = get().docs;
        if (!docs.find((doc) => doc.id === id)?.deletedAt) return;
        const ids = descendantIds(docs, id);
        set({ docs: docs.filter((doc) => !ids.has(doc.id) || !doc.deletedAt) });
      },
      docs: mockDocs,
      currentDocId: mockDocs[0].id,
      createDoc: (parentId) => {
        const doc = createStarterDoc(parentId);
        set((state) => ({
          docs: [doc, ...state.docs],
          currentDocId: doc.id,
        }));
        return doc.id;
      },
      deleteDoc: (id) => {
        const state = get();
        if (!state.docs.some((doc) => doc.id === id && !doc.deletedAt)) return;
        const ids = descendantIds(state.docs, id);
        const nextDocs = state.docs.map((doc) =>
          ids.has(doc.id) ? { ...doc, deletedAt: nowIso() } : doc,
        );
        let nextActive = nextDocs.find((doc) => !doc.deletedAt);
        if (!nextActive) {
          nextActive = createStarterDoc();
          nextDocs.unshift(nextActive);
        }
        const deletedCurrent = ids.has(state.currentDocId);
        set({
          docs: nextDocs,
          currentDocId: deletedCurrent ? nextActive.id : state.currentDocId,
        });
      },
      setCurrentDocId: (id) => {
        if (get().docs.some((doc) => doc.id === id && !doc.deletedAt)) {
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
              firstBlock?.type === 'heading' &&
              firstBlock.level === 1 &&
              firstBlock.text?.trim() === doc.title.trim();

            return touchDoc(doc, {
              title,
              blocks: shouldSyncLegacyTitle
                ? [{ ...firstBlock, text: title }, ...doc.blocks.slice(1)]
                : doc.blocks,
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
      name: LEGACY_DOCS_STORAGE_KEY,
      version: 1,
      skipHydration: true,
      merge: (persisted, current) => ({
        ...current,
        publishRecords: [],
        ...(persisted as Partial<DocsState>),
      }),
      partialize: (state) => ({
        publishRecords: state.publishRecords,
        docs: state.docs,
        currentDocId: state.currentDocId,
      }),
    },
  ),
);

/**
 * Loads a separate local document workspace for each authenticated user.
 * The one pre-authentication storage entry is migrated to the first account
 * that signs in on this browser, so existing local drafts are not lost.
 */
export function loadDocsForUser(userId: string): Promise<void> {
  if (activeDocsOwnerId === userId && activeDocsOwnerLoaded) {
    return Promise.resolve();
  }

  if (docsHydrationPromise) {
    return activeDocsOwnerId === userId
      ? docsHydrationPromise
      : docsHydrationPromise.then(() => loadDocsForUser(userId));
  }

  activeDocsOwnerId = userId;
  activeDocsOwnerLoaded = false;
  const storageKey = `${DOCS_STORAGE_PREFIX}:${userId}`;
  useDocsStore.persist.setOptions({ name: storageKey });

  if (window.localStorage.getItem(storageKey) === null) {
    const legacyState = window.localStorage.getItem(LEGACY_DOCS_STORAGE_KEY);
    if (legacyState !== null) {
      window.localStorage.setItem(storageKey, legacyState);
      window.localStorage.removeItem(LEGACY_DOCS_STORAGE_KEY);
    }
  }

  if (window.localStorage.getItem(storageKey) === null) {
    useDocsStore.setState({
      publishRecords: [],
      docs: mockDocs,
      currentDocId: mockDocs[0].id,
    });
    activeDocsOwnerLoaded = true;
    return Promise.resolve();
  }

  const hydration = Promise.resolve(useDocsStore.persist.rehydrate())
    .then(() => {
      activeDocsOwnerLoaded = true;
    })
    .finally(() => {
      docsHydrationPromise = null;
    });
  docsHydrationPromise = hydration;

  return hydration;
}

/**
 * Removes the signed-in user's documents from live application memory without
 * deleting that user's persisted drafts. Switching the persistence key first is
 * important: resetting Zustand must never overwrite the owner's saved workspace.
 */
export function clearDocsFromMemory(): void {
  activeDocsOwnerId = null;
  activeDocsOwnerLoaded = false;
  useDocsStore.persist.setOptions({ name: EMPTY_DOCS_STORAGE_KEY });
  useDocsStore.setState({ docs: [], currentDocId: '', publishRecords: [] });
}
