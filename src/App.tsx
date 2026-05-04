import { useEffect, useState } from 'react';
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

function App() {
  const [showSearch, setShowSearch] = useState(false);
  const openFile = useWorkspaceStore((s) => s.openFile);
  const activeTabId = useWorkspaceStore((s) => s.activeTabId);

  const handleOpenFile = async (path: string) => {
    if (!path.endsWith('.md') && !path.endsWith('.markdown')) return;
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const content = await invoke<string>('read_file', { path });
      // Set content BEFORE opening tab so editor gets it on creation
      useDocumentStore.getState().setContent(content);
      openFile(path);
    } catch (e) {
      console.error('Failed to read file:', e);
    }
  };

  useEffect(() => {
    // Check if launched with a file (macOS "Open With")
    import('@tauri-apps/api/core').then(({ invoke }) => {
      invoke<string | null>('get_opened_file').then((result: any) => {
        if (result) handleOpenFile(result);
      });
    });

    // Listen for files opened while app is running
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen<string>('file-opened', (event) => {
        handleOpenFile(event.payload);
      });
    });
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
  );
}
export default App;
