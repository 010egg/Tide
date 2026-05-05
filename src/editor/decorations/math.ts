import { syntaxTree } from '@codemirror/language';
import { Range } from '@codemirror/state';
import { Decoration, EditorView, WidgetType } from '@codemirror/view';

class MathWidget extends WidgetType {
  constructor(readonly formula: string, readonly display: boolean) { super(); }
  eq(other: MathWidget): boolean { return other.formula === this.formula && other.display === this.display; }
  toDOM(): HTMLElement {
    const el = document.createElement('span');
    el.textContent = this.formula;
    el.style.fontStyle = 'italic';
    el.style.fontFamily = 'KaTeX_Main, Times New Roman, serif';
    el.style.color = 'var(--text-primary)';
    if (this.display) {
      el.style.display = 'block';
      el.style.textAlign = 'center';
      el.style.padding = '12px 0';
      el.style.fontSize = '18px';
    }
    return el;
  }
}

export function mathDecorations(view: EditorView): Range<Decoration>[] {
  const widgets: Range<Decoration>[] = [];
  const tree = syntaxTree(view.state);
  const cursor = view.state.selection.main.head;

  tree.iterate({
    enter(nodeRef) {
      if (nodeRef.name !== 'FencedCode') return;
      const text = view.state.doc.sliceString(nodeRef.from, nodeRef.to);
      if (!text.startsWith('$$')) return;
      if (cursor >= nodeRef.from && cursor <= nodeRef.to) return;

      const doc = view.state.doc;
      const fromLine = doc.lineAt(nodeRef.from).number;
      const toLine = doc.lineAt(nodeRef.to).number;

      for (let i = fromLine; i < toLine; i++) {
        widgets.push(Decoration.line({ class: 'cm-code-hidden' }).range(doc.line(i).from));
      }

      const formula = text.replace(/^\$\$\n?/, '').replace(/\n?\$\$$/, '');
      widgets.push(
        Decoration.replace({
          widget: new MathWidget(formula, true),
          block: true,
        }).range(doc.line(nodeRef.from).from, doc.line(nodeRef.from).from)
      );
    },
  });

  return widgets;
}
