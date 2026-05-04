import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { markdown } from '@codemirror/lang-markdown';
import { useDocumentStore } from '../store/document';
import { useWorkspaceStore } from '../store/workspace';
import { markdownRenderPlugin } from './markdown-extension';
import './CodeMirrorView.css';

function CodeMirrorView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isUpdatingRef = useRef(false);

  const content = useDocumentStore((s) => s.content);
  const setContent = useDocumentStore((s) => s.setContent);
  const setCursor = useDocumentStore((s) => s.setCursor);
  const setComposing = useDocumentStore((s) => s.setComposing);
  const isSourceMode = useDocumentStore((s) => s.isSourceMode);
  const activeTabId = useWorkspaceStore((s) => s.activeTabId);
  const markDirty = useWorkspaceStore((s) => s.markDirty);

  // Create editor when tab changes
  useEffect(() => {
    if (!containerRef.current || !activeTabId) return;

    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !isUpdatingRef.current) {
        const newContent = update.state.doc.toString();
        setContent(newContent);
        if (activeTabId) markDirty(activeTabId, true);
        const pos = update.state.selection.main.head;
        const line = update.state.doc.lineAt(pos);
        setCursor(line.number, pos - line.from + 1);
      }
    });

    const extensions = [
      lineNumbers(),
      history(),
      syntaxHighlighting(defaultHighlightStyle),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      updateListener,
      EditorView.domEventHandlers({
        compositionstart: () => setComposing(true),
        compositionend: () => setComposing(false),
      }),
      markdown(),
      ...(isSourceMode ? [] : [markdownRenderPlugin]),
      EditorView.theme({
        '&': { height: '100%', flex: 1 },
        '.cm-scroller': { overflow: 'auto', fontFamily: 'var(--font-sans)' },
        '.cm-content': { padding: '22px 32px', fontSize: 'var(--font-size-base)', lineHeight: 'var(--line-height-base)' },
        '.cm-gutters': { display: 'none' },
      }),
    ];

    const view = new EditorView({
      state: EditorState.create({ doc: content, extensions }),
      parent: containerRef.current,
    });

    viewRef.current = view;
    requestAnimationFrame(() => view.focus());

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [activeTabId, isSourceMode]);

  // Sync external content changes (file open) into editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (content !== currentDoc) {
      isUpdatingRef.current = true;
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: content },
      });
      isUpdatingRef.current = false;
    }
  }, [content]);

  if (!activeTabId) {
    return (
      <div className="editor-empty">
        <div className="editor-empty-content">
          <span>打开文件开始编辑</span>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="codemirror-container" />;
}

export default CodeMirrorView;
