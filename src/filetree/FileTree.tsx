import { useState } from 'react';
import { useWorkspaceStore, type FileNode } from '../store/workspace';
import './FileTree.css';

function FileTree() {
  const rootPath = useWorkspaceStore((s) => s.rootPath);
  const fileTree = useWorkspaceStore((s) => s.fileTree);
  const openFile = useWorkspaceStore((s) => s.openFile);
  const activeTabId = useWorkspaceStore((s) => s.activeTabId);
  const activeTab = useWorkspaceStore((s) =>
    s.tabs.find((t) => t.id === s.activeTabId)
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  if (!rootPath) {
    return (
      <div className="filetree-section">
        <div className="sidebar-section-label">工作区</div>
        <div className="filetree-empty">
          <span>打开文件夹以开始</span>
        </div>
      </div>
    );
  }

  const renderNode = (node: FileNode, depth: number) => {
    const isExpanded = expanded.has(node.path);
    const isMarkdown = node.name.endsWith('.md');
    const isActive = activeTab?.path === node.path;

    return (
      <div key={node.path}>
        <div
          className={`tree-item indent${Math.min(depth, 3)} ${isActive ? 'active' : ''}`}
          onClick={() => {
            if (node.isDir) {
              toggleExpand(node.path);
            } else if (isMarkdown) {
              openFile(node.path);
            }
          }}
        >
          {node.isDir && (
            <span className="caret">{isExpanded ? '▾' : '▸'}</span>
          )}
          {!node.isDir && <span className="caret-placeholder" />}
          <span className={node.isDir ? 'folder-icon' : 'file-icon'}>
            {node.isDir ? '📁' : '📄'}
          </span>
          <span className="tree-name">{node.name}</span>
        </div>
        {node.isDir && isExpanded && node.children?.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="filetree-section">
      <div className="sidebar-section-label">工作区</div>
      <div className="filetree-list">
        {fileTree.map((node) => renderNode(node, 0))}
      </div>
    </div>
  );
}

export default FileTree;
