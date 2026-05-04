import { syntaxTree } from '@codemirror/language';
import { Range } from '@codemirror/state';
import { Decoration, EditorView, WidgetType } from '@codemirror/view';

class StyledTextWidget extends WidgetType {
  constructor(readonly text: string, readonly style: 'bold' | 'italic') {
    super();
  }
  eq(other: StyledTextWidget): boolean {
    return other.text === this.text && other.style === this.style;
  }
  toDOM(): HTMLElement {
    const el = document.createElement('span');
    el.textContent = this.text;
    if (this.style === 'bold') {
      el.style.fontWeight = '600';
    } else {
      el.style.fontStyle = 'italic';
    }
    return el;
  }
}

export function boldItalicDecorations(view: EditorView): Range<Decoration>[] {
  const widgets: Range<Decoration>[] = [];
  const tree = syntaxTree(view.state);
  const cursor = view.state.selection.main.head;

  tree.iterate({
    enter(nodeRef) {
      if (nodeRef.name === 'StrongEmphasis' || nodeRef.name === 'Emphasis') {
        if (cursor >= nodeRef.from && cursor <= nodeRef.to) return;

        const text = view.state.doc.sliceString(nodeRef.from, nodeRef.to);
        const stripped = text.replace(/^(\*{1,2}|_{1,2})/, '').replace(/(\*{1,2}|_{1,2})$/, '');
        const isBold = nodeRef.name === 'StrongEmphasis';

        widgets.push(
          Decoration.replace({
            widget: new StyledTextWidget(stripped, isBold ? 'bold' : 'italic'),
          }).range(nodeRef.from, nodeRef.to)
        );
      }
    },
  });

  return widgets;
}
