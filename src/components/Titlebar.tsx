import './Titlebar.css';

function Titlebar() {
  return (
    <div className="titlebar" data-tauri-drag-region>
      <div className="titlebar-left">
        <span className="titlebar-app-name">Typro</span>
      </div>
      <div className="titlebar-center" data-tauri-drag-region />
      <div className="titlebar-right">
        <span className="titlebar-save-status">已保存</span>
      </div>
    </div>
  );
}

export default Titlebar;
