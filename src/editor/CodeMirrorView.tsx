import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
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
  const content = useDocumentStore((s) => s.content);
  const setContent = useDocumentStore((s) => s.setContent);
  const setCursor = useDocumentStore((s) => s.setCursor);
  const setComposing = useDocumentStore((s) => s.setComposing);
  const isSourceMode = useDocumentStore((s) => s.isSourceMode);
  const activeTabId = useWorkspaceStore((s) => s.activeTabId);
  const markDirty = useWorkspaceStore((s) => s.markDirty);

  useEffect(() => {
    if (!containerRef.current) return;

    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

    if (!activeTabId) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newContent = update.state.doc.toString();
        setContent(newContent);
        if (activeTabId) markDirty(activeTabId, true);
        const pos = update.state.selection.main.head;
        const line = update.state.doc.lineAt(pos);
        setCursor(line.number, pos - line.from + 1);
      }
    });

    const domEventHandlers = EditorView.domEventHandlers({
      compositionstart: () => setComposing(true),
      compositionend: () => {
        setComposing(false);
        if (viewRef.current) {
          viewRef.current.dispatch({});
        }
      },
    });

    const extensions = [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      syntaxHighlighting(defaultHighlightStyle),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      updateListener,
      domEventHandlers,
      EditorView.theme({
        '&': { height: '100%', flex: 1 },
        '.cm-scroller': { overflow: 'auto', fontFamily: 'var(--font-sans)' },
        '.cm-content': {
          padding: '22px 32px',
          fontSize: 'var(--font-size-base)',
          lineHeight: 'var(--line-height-base)',
        },
        '.cm-gutters': { display: 'none' },
        '.cm-activeLine': { backgroundColor: 'transparent' },
      }),
    ];

    if (!isSourceMode) {
      extensions.push(markdown());
      extensions.push(markdownRenderPlugin);
    } else {
      extensions.push(markdown());
    }

    const view = new EditorView({
      state: EditorState.create({
        doc: content,
        extensions,
      }),
      parent: containerRef.current,
    });

    viewRef.current = view;
    view.focus();

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [activeTabId, isSourceMode]);

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.focus();
    }
  }, [activeTabId]);

  if (!activeTabId) {
    return (
      <div className="editor-empty">
        <div className="editor-empty-content">
          <span className="editor-empty-icon">📝</span>
          <span>打开文件开始编辑</span>
          <span className="editor-empty-hint">Ctrl+O 打开文件夹</span>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="codemirror-container" />;
}

export default CodeMirrorView;
