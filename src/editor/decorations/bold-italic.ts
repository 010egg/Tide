import { syntaxTree } from '@codemirror/language';
import { Range } from '@codemirror/state';
import { Decoration, EditorView, WidgetType } from '@codemirror/view';

class StyledTextWidget extends WidgetType {
  constructor(readonly text: string, readonly tag: 'strong' | 'em') { super(); }
  eq(other: StyledTextWidget): boolean { return other.text === this.text && other.tag === this.tag; }
  toDOM(): HTMLElement {
    const el = document.createElement(this.tag);
    el.textContent = this.text;
    return el;
  }
}

export function boldItalicDecorations(view: EditorView): Range<Decoration>[] {
  const widgets: Range<Decoration>[] = [];
  const tree = syntaxTree(view.state);
  const cursor = view.state.selection.main.head;

  tree.iterate({
    enter(nodeRef) {
      if (nodeRef.name !== 'StrongEmphasis' && nodeRef.name !== 'Emphasis') return;
      if (cursor >= nodeRef.from && cursor <= nodeRef.to) return;

      const raw = view.state.doc.sliceString(nodeRef.from, nodeRef.to);
      // Strip markdown markers: ** ** or * * or __ __ or _ _
      const markers = ['**', '__', '*', '_'];
      let text = raw;
      for (const m of markers) {
        if (text.startsWith(m) && text.endsWith(m)) {
          text = text.slice(m.length, -m.length);
          break;
        }
      }

      widgets.push(Decoration.replace({
        widget: new StyledTextWidget(text, nodeRef.name === 'StrongEmphasis' ? 'strong' : 'em'),
      }).range(nodeRef.from, nodeRef.to));
    },
  });

  return widgets;
}
