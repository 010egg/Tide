import { syntaxTree } from '@codemirror/language';
import { Range } from '@codemirror/state';
import { Decoration, EditorView, WidgetType } from '@codemirror/view';

class LinkWidget extends WidgetType {
  constructor(readonly text: string, readonly url: string) {
    super();
  }
  eq(other: LinkWidget): boolean {
    return other.text === this.text && other.url === this.url;
  }
  toDOM(): HTMLElement {
    const el = document.createElement('a');
    el.textContent = this.text;
    el.href = this.url;
    el.style.color = 'var(--accent)';
    el.style.cursor = 'pointer';
    el.style.textDecoration = 'underline';
    el.title = this.url;
    return el;
  }
}

class ImageWidget extends WidgetType {
  constructor(readonly alt: string, readonly src: string) {
    super();
  }
  eq(other: ImageWidget): boolean {
    return other.alt === this.alt && other.src === this.src;
  }
  toDOM(): HTMLElement {
    const wrap = document.createElement('span');
    wrap.style.display = 'inline-block';
    wrap.style.border = '1px dashed var(--border-color)';
    wrap.style.borderRadius = 'var(--radius-md)';
    wrap.style.padding = '4px 8px';
    wrap.style.fontSize = 'var(--font-size-sm)';
    wrap.style.color = 'var(--text-tertiary)';
    wrap.textContent = `🖼 ${this.alt || this.src}`;
    return wrap;
  }
}

export function linkImageDecorations(view: EditorView): Range<Decoration>[] {
  const widgets: Range<Decoration>[] = [];
  const tree = syntaxTree(view.state);
  const cursor = view.state.selection.main.head;

  tree.iterate({
    enter(nodeRef) {
      if (nodeRef.name === 'Link') {
        if (cursor >= nodeRef.from && cursor <= nodeRef.to) return;

        // Get the actual SyntaxNode to traverse children
        const node = tree.resolve(nodeRef.from, 1);
        if (!node || node.from !== nodeRef.from) return;

        let url = '';
        let text = '';
        const cur = node.cursor();
        if (cur.firstChild()) {
          do {
            if (cur.name === 'LinkText' || cur.name === 'LinkLabel') {
              text = view.state.doc.sliceString(cur.from, cur.to);
            }
            if (cur.name === 'URL') {
              url = view.state.doc.sliceString(cur.from, cur.to);
            }
          } while (cur.nextSibling());
        }

        if (text && url) {
          widgets.push(
            Decoration.replace({
              widget: new LinkWidget(text, url),
            }).range(nodeRef.from, nodeRef.to)
          );
        }
      }

      if (nodeRef.name === 'Image') {
        if (cursor >= nodeRef.from && cursor <= nodeRef.to) return;

        const node = tree.resolve(nodeRef.from, 1);
        if (!node || node.from !== nodeRef.from) return;

        let alt = '';
        let src = '';
        const cur = node.cursor();
        if (cur.firstChild()) {
          do {
            if (cur.name === 'LinkText' || cur.name === 'LinkLabel') {
              alt = view.state.doc.sliceString(cur.from, cur.to);
            }
            if (cur.name === 'URL') {
              src = view.state.doc.sliceString(cur.from, cur.to);
            }
          } while (cur.nextSibling());
        }

        widgets.push(
          Decoration.replace({
            widget: new ImageWidget(alt, src),
          }).range(nodeRef.from, nodeRef.to)
        );
      }
    },
  });

  return widgets;
}
