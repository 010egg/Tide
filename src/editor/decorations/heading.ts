import { syntaxTree } from '@codemirror/language';
import { Range } from '@codemirror/state';
import { Decoration, EditorView, WidgetType } from '@codemirror/view';

class HeadingWidget extends WidgetType {
  constructor(readonly level: number, readonly text: string) { super(); }
  eq(other: HeadingWidget): boolean { return other.level === this.level && other.text === this.text; }
  toDOM(): HTMLElement {
    const el = document.createElement('span');
    const sizes = ['', '28px', '22px', '18px', '16px', '15px', '14px'];
    const margins = ['', '16px 0 8px', '14px 0 6px', '10px 0 4px', '8px 0 2px', '6px 0 2px', '4px 0 2px'];
    el.style.fontSize = sizes[this.level] || '14px';
    el.style.fontWeight = '600';
    el.style.display = 'block';
    el.style.margin = margins[this.level] || '4px 0 2px';
    el.style.color = 'var(--text-primary)';
    el.style.lineHeight = '1.3';
    if (this.level <= 2) {
      el.style.borderBottom = '0.5px solid var(--border-light)';
      el.style.paddingBottom = '6px';
    }
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
      const name = nodeRef.name;
      // Lezer markdown uses "ATXHeading1" through "ATXHeading6" and "SetextHeading1/2"
      const isHeading = name.startsWith('ATXHeading') || name.startsWith('SetextHeading');
      if (!isHeading) return;
      if (cursor >= nodeRef.from && cursor <= nodeRef.to) return;

      const doc = view.state.doc;
      const line = doc.lineAt(nodeRef.from);
      const raw = line.text;
      // Strip leading # markers and trailing optional setext underline
      const text = raw.replace(/^#{1,6}\s+/, '').replace(/\s*[=]+\s*$/, '').replace(/\s*[-]+\s*$/, '').trim();

      // Determine level
      let level = 1;
      if (name.includes('ATXHeading')) {
        level = parseInt(name.replace('ATXHeading', '')) || 1;
      } else if (name === 'SetextHeading1') {
        level = 1;
      } else if (name === 'SetextHeading2') {
        level = 2;
      }

      // Hide source line
      widgets.push(Decoration.line({ class: 'cm-line-hidden' }).range(line.from));

      widgets.push(
        Decoration.replace({
          widget: new HeadingWidget(level, text),
          block: true,
        }).range(line.from, line.from)
      );
    },
  });

  return widgets;
}
