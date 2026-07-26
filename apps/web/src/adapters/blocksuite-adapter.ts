import { createEmptyDoc } from '@blocksuite/presets';
import { Text, type BlockModel, type DeltaOperation, type Doc } from '@blocksuite/store';
import type { InlineTextDelta, NormalizedBlock } from '../types/document';

type ParagraphType = 'text' | 'quote' | 'h1' | 'h2' | 'h3';
type ListType = 'bulleted' | 'numbered' | 'todo';

export interface BlockSuiteDocumentBridge {
  doc: Doc;
}

export function createBlockSuiteDocument(title: string, blocks: NormalizedBlock[]): BlockSuiteDocumentBridge {
  const setup = createEmptyDoc();
  const doc = setup.init();
  const note = getDefaultNote(doc);

  syncBlockSuiteTitle(doc, title);

  if (!note) {
    return { doc };
  }

  note.children.slice().forEach((child) => {
    doc.deleteBlock(child);
  });

  bodyBlocksForTitle(title, blocks).forEach((block) => {
    appendNormalizedBlock(doc, note, block);
  });

  if (note.children.length === 0) {
    appendParagraph(doc, note, 'text', '');
  }

  doc.resetHistory();

  return { doc };
}

export async function normalizedBlocksFromBlockSuiteDoc(doc: Doc): Promise<NormalizedBlock[]> {
  const note = getDefaultNote(doc);
  if (!note) return [];

  const blocks: NormalizedBlock[] = [];
  const children = note.children;

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];

    if (child.flavour === 'affine:list') {
      const listType = getListType(child);
      const items: string[] = [];
      const itemDeltas: InlineTextDelta[][] = [];
      const checked: boolean[] = [];
      const firstId = child.id;

      while (children[index]?.flavour === 'affine:list' && getListType(children[index]) === listType) {
        items.push(getModelText(children[index]));
        itemDeltas.push(getModelDelta(children[index]));
        checked.push(getListChecked(children[index]));
        index += 1;
      }

      index -= 1;
      blocks.push({
        id: firstId,
        type:
          listType === 'numbered' ? 'numbered-list' : listType === 'todo' ? 'todo-list' : 'bulleted-list',
        items,
        itemDeltas,
        ...(listType === 'todo' ? { checked } : {}),
      });
      continue;
    }

    if (child.flavour === 'affine:image') {
      const image = await normalizeImageBlock(child);
      if (image) blocks.push(image);
      continue;
    }

    const normalized = normalizeBlockModel(child);
    if (normalized) {
      blocks.push(normalized);
    }
  }

  return blocks.length > 0 ? blocks : [{ id: crypto.randomUUID(), type: 'paragraph', text: '' }];
}

export function syncBlockSuiteTitle(doc: Doc, title: string) {
  const text = getRootTitle(doc);

  if (!text || text.toString() === title) {
    return;
  }

  text.replace(0, text.length, title);
}

export function getBlockSuiteTitle(doc: Doc) {
  return getRootTitle(doc)?.toString() ?? '';
}

export function observeBlockSuiteTitle(doc: Doc, callback: (title: string) => void) {
  const text = getRootTitle(doc);

  if (!text) {
    return () => undefined;
  }

  const handleTitleChange = () => callback(text.toString());
  text.yText.observe(handleTitleChange);

  return () => {
    text.yText.unobserve(handleTitleChange);
  };
}

function bodyBlocksForTitle(title: string, blocks: NormalizedBlock[]) {
  const first = blocks[0];

  if (first?.type === 'heading' && first.level === 1 && first.text?.trim() === title.trim()) {
    return blocks.slice(1);
  }

  return blocks;
}

function appendNormalizedBlock(doc: Doc, note: BlockModel, block: NormalizedBlock) {
  switch (block.type) {
    case 'heading':
      appendParagraph(doc, note, `h${block.level ?? 2}` as ParagraphType, block.text ?? '', block.delta);
      return;
    case 'quote':
      appendParagraph(doc, note, 'quote', block.text ?? '', block.delta);
      return;
    case 'code':
      doc.addBlock(
        'affine:code',
        {
          text: createYText(block.text ?? ''),
          language: block.language ?? 'Plain Text',
        },
        note.id,
      );
      return;
    case 'bulleted-list':
    case 'numbered-list':
    case 'todo-list':
      (block.items ?? ['']).forEach((item, index) => {
        doc.addBlock(
          'affine:list',
          {
            type:
              block.type === 'numbered-list' ? 'numbered' : block.type === 'todo-list' ? 'todo' : 'bulleted',
            text: createYText(item, block.itemDeltas?.[index]),
            checked: block.checked?.[index] ?? false,
            collapsed: false,
          },
          note.id,
        );
      });
      return;
    case 'divider':
      doc.addBlock('affine:divider', {}, note.id);
      return;
    case 'image':
      appendImage(doc, note, block);
      return;
    default:
      appendParagraph(doc, note, 'text', block.text ?? '', block.delta);
  }
}

function appendParagraph(
  doc: Doc,
  note: BlockModel,
  type: ParagraphType,
  text: string,
  delta?: InlineTextDelta[],
) {
  doc.addBlock(
    'affine:paragraph',
    {
      type,
      text: createYText(text, delta),
    },
    note.id,
  );
}

function normalizeBlockModel(model: BlockModel): NormalizedBlock | null {
  if (model.flavour === 'affine:paragraph') {
    const paragraphType = getParagraphType(model);
    const text = getModelText(model);
    const delta = getModelDelta(model);

    if (paragraphType === 'quote') {
      return { id: model.id, type: 'quote', text, delta };
    }

    if (paragraphType.startsWith('h')) {
      const level = Number(paragraphType.slice(1));
      return {
        id: model.id,
        type: 'heading',
        level: level === 1 || level === 2 || level === 3 ? level : 2,
        text,
        delta,
      };
    }

    return { id: model.id, type: 'paragraph', text, delta };
  }

  if (model.flavour === 'affine:code') {
    const codeModel = model as BlockModel & { language?: string };
    return {
      id: model.id,
      type: 'code',
      text: getModelText(model),
      language: codeModel.language ?? 'Plain Text',
    };
  }

  if (model.flavour === 'affine:divider') {
    return { id: model.id, type: 'divider' };
  }

  return null;
}

function getDefaultNote(doc: Doc) {
  return doc.root?.children.find((child) => child.flavour === 'affine:note') ?? null;
}

function getRootTitle(doc: Doc) {
  return ((doc.root as (BlockModel & { title?: Text }) | null)?.title ?? null);
}

function getParagraphType(model: BlockModel): ParagraphType {
  const candidate = (model as BlockModel & { type?: string }).type;
  if (candidate === 'quote' || candidate === 'h1' || candidate === 'h2' || candidate === 'h3') {
    return candidate;
  }
  return 'text';
}

function getListType(model: BlockModel): ListType {
  const type = (model as BlockModel & { type?: string }).type;
  return type === 'numbered' ? 'numbered' : type === 'todo' ? 'todo' : 'bulleted';
}

function getListChecked(model: BlockModel) {
  return Boolean((model as BlockModel & { checked?: boolean }).checked);
}

function getModelText(model: BlockModel) {
  return model.text?.toString() ?? '';
}

function getModelDelta(model: BlockModel): InlineTextDelta[] {
  const delta = model.text?.toDelta() ?? [];
  return delta.flatMap((operation) => {
    if (typeof operation.insert !== 'string') return [];
    return [{ insert: operation.insert, ...(operation.attributes ? { attributes: operation.attributes } : {}) }];
  });
}

function createYText(text: string, delta?: InlineTextDelta[]) {
  if (delta?.length) {
    return Text.fromDelta(delta as DeltaOperation[]);
  }
  return new Text(text);
}

function appendImage(doc: Doc, note: BlockModel, block: NormalizedBlock) {
  const id = doc.addBlock(
    'affine:image',
    {
      caption: block.caption ?? block.alt ?? '',
    },
    note.id,
  );

  if (!block.url?.startsWith('data:')) return;

  void dataUrlToBlob(block.url)
    .then(async (blob) => {
      const sourceId = await doc.blobSync.set(blob);
      const model = doc.getBlockById(id);
      if (model) {
        doc.withoutTransact(() => {
          doc.updateBlock(model, { sourceId, size: blob.size });
        });
      }
    })
    .catch(() => undefined);
}

async function normalizeImageBlock(model: BlockModel): Promise<NormalizedBlock | null> {
  const imageModel = model as BlockModel & { sourceId?: string; caption?: string };
  if (!imageModel.sourceId) return null;

  const blob = await model.doc.blobSync.get(imageModel.sourceId);
  if (!blob) return null;

  return {
    id: model.id,
    type: 'image',
    url: await blobToDataUrl(blob),
    alt: imageModel.caption ?? '',
    caption: imageModel.caption ?? '',
  };
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result ?? '')));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(url: string) {
  const response = await fetch(url);
  return response.blob();
}
