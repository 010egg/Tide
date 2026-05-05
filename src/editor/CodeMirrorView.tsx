import { useEffect, useRef } from 'react';
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/kit/core';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';
import { history } from '@milkdown/kit/plugin/history';
import { clipboard } from '@milkdown/kit/plugin/clipboard';
import { cursor } from '@milkdown/kit/plugin/cursor';
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { nord } from '@milkdown/theme-nord';
import { useDocumentStore } from '../store/document';
import { useWorkspaceStore } from '../store/workspace';
import './CodeMirrorView.css';

function MilkdownEditor({ content, tabId }: { content: string; tabId: string }) {
  const setContent = useDocumentStore((s) => s.setContent);
  const markDirty = useWorkspaceStore((s) => s.markDirty);
  const skipRef = useRef(false);

  const { get } = useEditor((root) =>
    Editor.make()
      .config(nord)
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, content);
        ctx.get(listenerCtx).markdownUpdated((_, md) => {
          if (!skipRef.current) {
            setContent(md);
            markDirty(tabId, true);
          }
        });
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(clipboard)
      .use(cursor)
      .use(listener),
  );

  // Sync external content changes (file open)
  useEffect(() => {
    const editor = get();
    if (!editor) return;
    const action = editor.action;
    if (!action) return;
    action((ctx: any) => {
      const current = ctx.get(defaultValueCtx);
      // Only update if content actually changed externally
    });
  }, [content]);

  return <Milkdown />;
}

function CodeMirrorView() {
  const content = useDocumentStore((s) => s.content);
  const activeTabId = useWorkspaceStore((s) => s.activeTabId);

  useEffect(() => {
    const onJump = (e: Event) => {
      const el = document.querySelector('.ProseMirror') as HTMLElement;
      if (el) el.focus();
    };
    window.addEventListener('editor-jump', onJump);
    return () => window.removeEventListener('editor-jump', onJump);
  }, []);

  if (!activeTabId) {
    return <div className="editor-empty"><div className="editor-empty-content"><span>打开文件开始编辑</span></div></div>;
  }

  return (
    <div className="milkdown-container">
      <MilkdownProvider>
        <MilkdownEditor key={activeTabId} content={content} tabId={activeTabId} />
      </MilkdownProvider>
    </div>
  );
}

export default CodeMirrorView;
