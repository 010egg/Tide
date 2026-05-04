import { ViewPlugin, DecorationSet, EditorView, Decoration } from '@codemirror/view';
import { Range } from '@codemirror/state';
import { headingDecorations } from './decorations/heading';
import { boldItalicDecorations } from './decorations/bold-italic';
import { linkImageDecorations } from './decorations/link-image';
import { codeBlockDecorations } from './decorations/code-block';
import { tableDecorations } from './decorations/table';
import { mathDecorations } from './decorations/math';
import { useDocumentStore } from '../store/document';

function combinedDecorations(view: EditorView): DecorationSet {
  const isComposing = useDocumentStore.getState().isComposing;
  if (isComposing) return Decoration.none;

  const widgets: Range<Decoration>[] = [];

  const addRanges = (ranges: Range<Decoration>[]) => {
    widgets.push(...ranges);
  };

  addRanges(headingDecorations(view));
  addRanges(boldItalicDecorations(view));
  addRanges(linkImageDecorations(view));
  addRanges(codeBlockDecorations(view));
  addRanges(tableDecorations(view));
  addRanges(mathDecorations(view));

  return Decoration.set(widgets, true);
}

export const markdownRenderPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = combinedDecorations(view);
    }
    update(update: any) {
      if (update.docChanged || update.selectionSet) {
        this.decorations = combinedDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations }
);
