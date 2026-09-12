import {
  Undo2, Redo2, Pilcrow, Heading2, Bold, Italic, Underline, Strikethrough,
  Code2, Quote, List, ListOrdered, ListTodo, Link, Image, LibraryBig,
} from 'lucide-react';
import type { EditorAction, EditorToolbarState } from './BlockSuiteEditor';

const groups: { action: EditorAction; label: string; icon: typeof Bold }[][] = [
  [{ action: 'undo', label: '撤销', icon: Undo2 }, { action: 'redo', label: '重做', icon: Redo2 }],
  [{ action: 'text', label: '正文', icon: Pilcrow }, { action: 'heading', label: '二级标题', icon: Heading2 }],
  [
    { action: 'bold', label: '粗体', icon: Bold },
    { action: 'italic', label: '斜体', icon: Italic },
    { action: 'underline', label: '下划线', icon: Underline },
    { action: 'strike', label: '删除线', icon: Strikethrough },
    { action: 'code', label: '行内代码', icon: Code2 },
  ],
  [
    { action: 'quote', label: '引用', icon: Quote },
    { action: 'bulleted', label: '无序列表', icon: List },
    { action: 'numbered', label: '有序列表', icon: ListOrdered },
    { action: 'todo', label: '任务列表', icon: ListTodo },
    { action: 'link', label: '链接', icon: Link },
  ],
];

interface Props {
  state: EditorToolbarState;
  onAction: (action: EditorAction) => void;
  onOpenAssets: () => void;
  onOpenComponents: () => void;
}

export function EditorToolbar({ state, onAction, onOpenAssets, onOpenComponents }: Props) {
  return (
    <div className="editor-toolbar" role="group" aria-label="编辑工具">
      {groups.map((group, index) => (
        <div className="editor-toolbar-group" key={index}>
          {group.map(({ action, label, icon: Icon }) => (
            <button key={action} type="button" title={label} aria-label={label}
              aria-pressed={action === 'undo' || action === 'redo' ? undefined : Boolean(state[action])}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onAction(action)}>
              <Icon size={17} strokeWidth={1.65} />
            </button>
          ))}
        </div>
      ))}
      <div className="editor-toolbar-group">
        <button type="button" title="插入图片" aria-label="插入图片" onClick={onOpenAssets}>
          <Image size={17} strokeWidth={1.65} />
        </button>
        <button type="button" title="组件库" aria-label="组件库" onClick={onOpenComponents}>
          <LibraryBig size={17} strokeWidth={1.65} />
        </button>
      </div>
    </div>
  );
}
