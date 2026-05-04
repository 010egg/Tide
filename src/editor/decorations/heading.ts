import { syntaxTree } from '@codemirror/language';
import { Range } from '@codemirror/state';
import { Decoration, EditorView, WidgetType } from '@codemirror/view';

class HeadingWidget extends WidgetType {
  constructor(readonly level: number, readonly text: string) {
    super();
  }
  eq(other: HeadingWidget): boolean {
    return other.level === this.level && other.text === this.text;
  }
  toDOM(): HTMLElement {
    const el = document.createElement('span');
    const sizes = ['', '24px', '20px', '17px', '15px', '14px', '13px'];
    el.style.fontSize = sizes[this.level] || '14px';
    el.style.fontWeight = '500';
    el.style.letterSpacing = '-0.01em';
    el.style.display = 'block';
    el.style.marginBottom = this.level === 1 ? '4px' : '10px';
    el.style.color = 'var(--text-primary)';
    el.textContent = this.text;
    return el;
  }
}

export function headingDecorations(view: EditorView): Range<Decoration>[] {
  const widgets: Range<Decoration>[] = [];
  const tree = syntaxTree(view.state);
  const cursor = view.state.selection.main.head;

  tree.iterate({
    enter(nodeRef) {
      if (!nodeRef.name.startsWith('ATXHeading') && !nodeRef.name.startsWith('SetextHeading')) return;
      if (cursor >= nodeRef.from && cursor <= nodeRef.to) return;

      const line = view.state.doc.lineAt(nodeRef.from);
      const text = line.text.replace(/^#{1,6}\s*/, '').trim();
      const level = nodeRef.name.includes('1') ? 1
        : nodeRef.name.includes('2') ? 2
        : nodeRef.name.includes('3') ? 3
        : nodeRef.name.includes('4') ? 4
        : nodeRef.name.includes('5') ? 5 : 6;

      widgets.push(
        Decoration.replace({
          widget: new HeadingWidget(level, text),
        }).range(nodeRef.from, nodeRef.to)
      );
    },
  });

  return widgets;
}
