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
      return (
        <div style={{ padding: 40, fontFamily: 'system-ui', color: '#A32D2D' }}>
          <h2>Error</h2>
          <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{this.state.err.message}{'\n'}{this.state.err.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [showSearch, setShowSearch] = useState(false);
  const openFile = useWorkspaceStore((s) => s.openFile);
  const activeTabId = useWorkspaceStore((s) => s.activeTabId);

  useEffect(() => {
    // Check if launched with a file (macOS "Open With")
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
    // Listen for files opened while app is running
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
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault(); setShowSearch(v => !v);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <ErrorBoundary>
      <div className="app">
        <Titlebar />
        <div className="app-body">
          <div className="sidebar"><FileTree /><Outline /></div>
          <div className="editor-area"><Tabbar /><CodeMirrorView key={activeTabId} /></div>
          <div className="preview-area"><HtmlPreview /></div>
        </div>
        <div className="terminal-area"><XtermView /></div>
        <Statusbar />
        {showSearch && <SearchDialog onClose={() => setShowSearch(false)} />}
      </div>
    </ErrorBoundary>
  );
}
export default App;
