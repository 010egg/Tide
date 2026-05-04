import './Tabbar.css';
import { useWorkspaceStore } from '../store/workspace';

function Tabbar() {
  const tabs = useWorkspaceStore((s) => s.tabs);
  const activeTabId = useWorkspaceStore((s) => s.activeTabId);
  const setActiveTab = useWorkspaceStore((s) => s.setActiveTab);
  const closeTab = useWorkspaceStore((s) => s.closeTab);

  if (tabs.length === 0) return null;

  return (
    <div className="tabbar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="tab-dot" />
          {tab.title}
          {tab.isDirty && <span className="tab-dirty" />}
          <span
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
          >
            ×
          </span>
        </div>
      ))}
      <div className="tab-add">+</div>
    </div>
  );
}

export default Tabbar;
