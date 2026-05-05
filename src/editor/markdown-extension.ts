import { StateField, StateEffect, RangeSet, Range } from '@codemirror/state';
import { Decoration, EditorView, WidgetType } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { useDocumentStore } from '../store/document';

// ---- Widgets ----

class HeadingWidget extends WidgetType {
  constructor(readonly level: number, readonly text: string) { super(); }
  eq(other: HeadingWidget) { return other.level === this.level && other.text === this.text; }
  toDOM() {
    const tag = `h${this.level}` as keyof HTMLElementTagNameMap;
    const el = document.createElement(tag);
    Object.assign(el.style, {
      fontSize: ['', '28px', '22px', '18px', '16px', '15px', '14px'][this.level],
      fontWeight: '600', display: 'block', lineHeight: '1.3',
      margin: ['', '16px 0 8px', '14px 0 6px', '10px 0 4px', '8px 0 2px', '6px 0 2px', '4px 0 2px'][this.level],
      color: 'var(--text-primary)',
      borderBottom: this.level <= 2 ? '0.5px solid var(--border-light)' : 'none',
      paddingBottom: this.level <= 2 ? '6px' : '0',
    });
    el.textContent = this.text;
    return el;
  }
}

class StyledTextWidget extends WidgetType {
  constructor(readonly text: string, readonly tag: 'strong' | 'em') { super(); }
  eq(other: StyledTextWidget) { return other.text === this.text && other.tag === this.tag; }
  toDOM() {
    const el = document.createElement(this.tag);
    el.textContent = this.text;
    return el;
  }
}

// ---- Decoration Computer ----

function computeDecorations(view: EditorView): Range<Decoration>[] {
  if (useDocumentStore.getState().isComposing) return [];

  const widgets: Range<Decoration>[] = [];
  const tree = syntaxTree(view.state);
  const cursor = view.state.selection.main.head;
  const doc = view.state.doc;

  tree.iterate({
    enter(nodeRef) {
      const name = nodeRef.name;
      const { from, to } = nodeRef;
      if (cursor >= from && cursor <= to) return;

      // Headings
      if (name.startsWith('ATXHeading') || name.startsWith('SetextHeading')) {
        const line = doc.lineAt(from);
        const raw = line.text;
        let level = 1, text = raw;
        if (name.startsWith('ATXHeading')) {
          level = parseInt(name.replace('ATXHeading', ''), 10) || 1;
          text = raw.replace(/^#{1,6}\s*/, '');
        } else if (name === 'SetextHeading1') {
          text = raw.replace(/\s*=+\s*$/, '');
        } else if (name === 'SetextHeading2') {
          level = 2;
          text = raw.replace(/\s*-+\s*$/, '');
        }
        // Hide source, show rendered
        for (let l = line.number; l <= doc.lineAt(to > from ? to - 1 : from).number; l++) {
          widgets.push(Decoration.line({ class: 'cm-line-hidden' }).range(doc.line(l).from));
        }
        widgets.push(Decoration.widget({
          widget: new HeadingWidget(level, text || ' '),
          block: true,
        }).range(line.from));
      }

      // Bold
      if (name === 'StrongEmphasis') {
        const raw = doc.sliceString(from, to);
        let text = raw;
        for (const m of ['**', '__']) {
          if (text.startsWith(m) && text.endsWith(m)) {
            text = text.slice(m.length, -m.length); break;
          }
        }
        widgets.push(Decoration.replace({
          widget: new StyledTextWidget(text, 'strong'),
        }).range(from, to));
      }

      // Italic
      if (name === 'Emphasis') {
        const raw = doc.sliceString(from, to);
        let text = raw;
        for (const m of ['*', '_']) {
          if (text.startsWith(m) && text.endsWith(m)) {
            text = text.slice(m.length, -m.length); break;
          }
        }
        widgets.push(Decoration.replace({
          widget: new StyledTextWidget(text, 'em'),
        }).range(from, to));
      }
    },
  });

  return widgets;
}

// ---- StateField (required for block decorations) ----

const decorationEffect = StateEffect.define<Range<Decoration>[]>();

export const markdownDecoField = StateField.define<DecorationSet>({
  create() { return Decoration.none; },
  update(decos, tr) {
    for (const e of tr.effects) {
      if (e.is(decorationEffect)) return Decoration.set(e.value, true);
    }
    return decos.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

// Update StateField via ViewPlugin
import { ViewPlugin, DecorationSet } from '@codemirror/view';

export const markdownRenderPlugin = ViewPlugin.fromClass(class {
  constructor(view: EditorView) {
    this.updateDecorations(view);
  }
  update(update: any) {
    if (update.docChanged || update.selectionSet) {
      this.updateDecorations(update.view);
    }
  }
  updateDecorations(view: EditorView) {
    const decos = computeDecorations(view);
    // Defer dispatch to avoid "update in progress" error
    queueMicrotask(() => {
      if (!view.viewport) return; // view destroyed
      view.dispatch({ effects: decorationEffect.of(decos) });
    });
  }
});
