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

function App() {
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'f') {
        e.preventDefault();
        setShowSearch((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app">
      <Titlebar />
      <div className="app-body">
        <div className="sidebar">
          <FileTree />
          <Outline />
        </div>
        <div className="editor-area">
          <Tabbar />
          <CodeMirrorView />
        </div>
        <div className="preview-area">
          <HtmlPreview />
        </div>
      </div>
      <div className="terminal-area">
        <XtermView />
      </div>
      <Statusbar />
      {showSearch && <SearchDialog onClose={() => setShowSearch(false)} />}
    </div>
  );
}

export default App;
