import { syntaxTree } from '@codemirror/language';
import { Range } from '@codemirror/state';
import { Decoration, EditorView, WidgetType } from '@codemirror/view';

class CodeBlockWidget extends WidgetType {
  constructor(readonly code: string, readonly lang: string) {
    super();
  }
  eq(other: CodeBlockWidget): boolean {
    return other.code === this.code && other.lang === this.lang;
  }
  toDOM(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.style.background = 'var(--terminal-bg)';
    wrap.style.color = '#E8E8E8';
    wrap.style.fontFamily = 'var(--font-mono)';
    wrap.style.fontSize = 'var(--font-size-sm)';
    wrap.style.padding = '12px 14px';
    wrap.style.borderRadius = 'var(--radius-lg)';
    wrap.style.marginBottom = '14px';
    wrap.style.lineHeight = '1.6';
    wrap.style.whiteSpace = 'pre-wrap';
    wrap.style.overflow = 'hidden';

    if (this.lang) {
      const header = document.createElement('div');
      header.style.fontSize = 'var(--font-size-xs)';
      header.style.color = '#888';
      header.style.marginBottom = '6px';
      header.textContent = this.lang;
      wrap.appendChild(header);
    }

    const codeEl = document.createElement('code');
    codeEl.textContent = this.code;
    wrap.appendChild(codeEl);
    return wrap;
  }
}

export function codeBlockDecorations(view: EditorView): Range<Decoration>[] {
  const widgets: Range<Decoration>[] = [];
  const tree = syntaxTree(view.state);
  const cursor = view.state.selection.main.head;

  tree.iterate({
    enter(nodeRef) {
      if (nodeRef.name === 'FencedCode') {
        if (cursor >= nodeRef.from && cursor <= nodeRef.to) return;

        const text = view.state.doc.sliceString(nodeRef.from, nodeRef.to);
        const lines = text.split('\n');
        const info = lines[0].replace(/^```\s*/, '');
        const code = lines.slice(1, -1).join('\n');

        widgets.push(
          Decoration.replace({
            widget: new CodeBlockWidget(code, info),
          }).range(nodeRef.from, nodeRef.to)
        );
      }
    },
  });

  return widgets;
}
