import { useEffect, useState, Component } from 'react';
import './App.css';
import Titlebar from './components/Titlebar';
import Tabbar from './components/Tabbar';
import FileTree from './filetree/FileTree';
import Outline from './outline/Outline';
import CodeMirrorView from './editor/CodeMirrorView';
import HtmlPreview from './preview/HtmlPreview';
import XtermView from './terminal/XtermView';
import Statusbar from './components/Statusbar';
import SearchDialog from './search/SearchDialog';
import { useWorkspaceStore } from './store/workspace';
import { useDocumentStore } from './store/document';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

class ErrorBoundary extends Component<{ children: React.ReactNode }, { err: Error | null }> {
  state: { err: Error | null } = { err: null };
  static getDerivedStateFromError(e: Error) { return { err: e }; }
  render() {
    if (this.state.err) {
      return <div style={{ padding: 40, fontFamily: 'system-ui', color: '#A32D2D' }}>
        <h2>Error</h2>
        <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{this.state.err.message}{'\n'}{this.state.err.stack}</pre>
      </div>;
    }
    return this.props.children;
  }
}

function App() {
  const [showSearch, setShowSearch] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [termHeight, setTermHeight] = useState(200);
  const openFile = useWorkspaceStore((s) => s.openFile);
  const activeTabId = useWorkspaceStore((s) => s.activeTabId);

  useEffect(() => {
    invoke<string | null>('get_opened_file').then((path: string | null) => {
      if (path) {
        invoke<string>('read_file', { path }).then((content: string) => {
          useDocumentStore.getState().setContent(content);
          openFile(path);
        }).catch((e: any) => console.error('read_file failed:', e));
      }
    }).catch((e: any) => console.error('get_opened_file failed:', e));
  }, []);

  useEffect(() => {
    listen<string>('file-opened', (event) => {
      const path = event.payload;
      invoke<string>('read_file', { path }).then((content: string) => {
        useDocumentStore.getState().setContent(content);
        openFile(path);
      }).catch((e: any) => console.error('read_file failed:', e));
    }).catch((e: any) => console.error('listen failed:', e));
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') { e.preventDefault(); setShowSearch(v => !v); }
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') { e.preventDefault(); setShowSidebar(v => !v); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const cols = `${showSidebar ? '220px' : '0px'} 1fr ${showPreview ? '1fr' : '0px'}`;

  return (
    <ErrorBoundary>
      <div className="app">
        <Titlebar />
        <div className="app-body" style={{ gridTemplateColumns: cols }}>
          {showSidebar && <div className="sidebar"><FileTree /><Outline /></div>}
          <div className="editor-area">
            <div className="editor-top-row">
              <button className="toggle-btn" title="侧边栏 (Cmd+\\)" onClick={() => setShowSidebar(v => !v)}>
                {showSidebar ? '◀' : '▶'}
              </button>
              <Tabbar />
              <button className="toggle-btn" title="预览" onClick={() => setShowPreview(v => !v)}>
                {showPreview ? '▶' : '◀'}
              </button>
            </div>
            <CodeMirrorView key={activeTabId} />
          </div>
          {showPreview && <div className="preview-area"><HtmlPreview /></div>}
        </div>
        {showTerminal && (
          <div className="terminal-resize-handle"
            onMouseDown={(e) => {
              e.preventDefault();
              const startY = e.clientY;
              const startH = termHeight;
              const onMove = (ev: MouseEvent) => {
                setTermHeight(Math.max(80, Math.min(500, startH + startY - ev.clientY)));
              };
              const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
              };
              document.addEventListener('mousemove', onMove);
              document.addEventListener('mouseup', onUp);
            }}
          >
            <span className="terminal-handle-label" onClick={() => setShowTerminal(false)}>终端 ▲</span>
          </div>
        )}
        {showTerminal && (
          <div className="terminal-area" style={{ height: termHeight }}>
            <XtermView />
          </div>
        )}
        {!showTerminal && (
          <div className="terminal-toggle" onClick={() => setShowTerminal(true)}>终端</div>
        )}
        <Statusbar />
        {showSearch && <SearchDialog onClose={() => setShowSearch(false)} />}
      </div>
    </ErrorBoundary>
  );
}
export default App;
