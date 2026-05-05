import { syntaxTree } from '@codemirror/language';
import { Range } from '@codemirror/state';
import { Decoration, EditorView, WidgetType } from '@codemirror/view';

class HeadingWidget extends WidgetType {
  constructor(readonly level: number, readonly text: string) { super(); }
  eq(other: HeadingWidget): boolean { return other.level === this.level && other.text === this.text; }
  toDOM(): HTMLElement {
    const tag = `h${this.level}` as keyof HTMLElementTagNameMap;
    const el = document.createElement(tag);
    Object.assign(el.style, {
      fontSize: ['', '28px', '22px', '18px', '16px', '15px', '14px'][this.level],
      fontWeight: '600',
      display: 'block',
      margin: ['', '16px 0 8px', '14px 0 6px', '10px 0 4px', '8px 0 2px', '6px 0 2px', '4px 0 2px'][this.level],
      color: 'var(--text-primary)',
      lineHeight: '1.3',
      borderBottom: this.level <= 2 ? '0.5px solid var(--border-light)' : 'none',
      paddingBottom: this.level <= 2 ? '6px' : '0',
    });
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
      if (!name.startsWith('ATXHeading') && !name.startsWith('SetextHeading')) return;
      if (cursor >= nodeRef.from && cursor <= nodeRef.to) return;

      const doc = view.state.doc;
      const line = doc.lineAt(nodeRef.from);
      const raw = line.text;

      // Extract heading level and text
      let level = 1;
      let text = raw;

      if (name.startsWith('ATXHeading')) {
        level = parseInt(name.replace('ATXHeading', ''), 10) || 1;
        text = raw.replace(/^#{1,6}\s*/, '');
      } else if (name === 'SetextHeading1') {
        level = 1;
        text = raw.replace(/\s*=+\s*$/, '');
      } else if (name === 'SetextHeading2') {
        level = 2;
        text = raw.replace(/\s*-+\s*$/, '');
      }

      // Hide source line
      widgets.push(Decoration.line({ class: 'cm-line-hidden' }).range(line.from));

      // Show rendered heading
      widgets.push(
        Decoration.replace({
          widget: new HeadingWidget(level, text || ' '),
          block: true,
        }).range(line.from, line.from)
      );
    },
  });

  return widgets;
}
