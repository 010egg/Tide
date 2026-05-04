import { useSettingsStore } from '../store/settings';
import { useDocumentStore } from '../store/document';
import './Statusbar.css';

function Statusbar() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const cursorLine = useDocumentStore((s) => s.cursorLine);
  const cursorColumn = useDocumentStore((s) => s.cursorColumn);
  const content = useDocumentStore((s) => s.content);
  const lineCount = content ? content.split('\n').length : 1;
  const wordCount = content ? content.replace(/\s/g, '').length : 0;

  return (
    <div className="statusbar">
      <div className="statusbar-left">
        <span>Markdown</span>
        <span>UTF-8</span>
        <span>{wordCount} 字</span>
      </div>
      <div className="statusbar-right">
        <span>分屏预览</span>
        <span
          className="statusbar-clickable"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          主题：{theme === 'light' ? '浅色' : '深色'}
        </span>
        <span>行 {cursorLine}，列 {cursorColumn}</span>
      </div>
    </div>
  );
}

export default Statusbar;
