import { create } from 'zustand';

export interface Tab {
  id: string;
  title: string;
  path: string;
  isDirty: boolean;
}

export interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileNode[];
}

interface WorkspaceState {
  rootPath: string | null;
  tabs: Tab[];
  activeTabId: string | null;
  fileTree: FileNode[];

  setRootPath: (path: string) => void;
  openFile: (path: string) => void;
  setActiveTab: (id: string) => void;
  closeTab: (id: string) => void;
  markDirty: (id: string, dirty: boolean) => void;
  setFileTree: (tree: FileNode[]) => void;
}

function buildFileTree(entries: { name: string; path: string; isDir: boolean }[]): FileNode[] {
  const root: FileNode[] = [];
  const map = new Map<string, FileNode>();

  for (const entry of entries) {
    const node: FileNode = {
      name: entry.name,
      path: entry.path,
      isDir: entry.isDir,
      children: entry.isDir ? [] : undefined,
    };
    map.set(entry.path, node);

    const parentPath = entry.path.substring(0, entry.path.lastIndexOf('/'));
    const parent = map.get(parentPath);
    if (parent && parent.children) {
      parent.children.push(node);
    } else if (!parentPath || entry.path === entry.name) {
      root.push(node);
    } else {
      root.push(node);
    }
  }
  return root;
}

const defaultTab: Tab = {
  id: crypto.randomUUID(),
  title: '未命名',
  path: '',
  isDirty: false,
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  rootPath: null,
  tabs: [defaultTab],
  activeTabId: defaultTab.id,
  fileTree: [],

  setRootPath: (path) => set({ rootPath: path }),

  openFile: (path) => {
    const existing = get().tabs.find((t) => t.path === path);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }
    const id = crypto.randomUUID();
    const name = path.split('/').pop() || path;
    set((s) => ({
      tabs: [...s.tabs, { id, title: name, path, isDirty: false }],
      activeTabId: id,
    }));
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  closeTab: (id) => {
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.id === id);
      const newTabs = s.tabs.filter((t) => t.id !== id);
      let newActive = s.activeTabId;
      if (s.activeTabId === id) {
        if (newTabs.length > 0) {
          const newIdx = Math.min(idx, newTabs.length - 1);
          newActive = newTabs[newIdx].id;
        } else {
          newActive = null;
        }
      }
      return { tabs: newTabs, activeTabId: newActive };
    });
  },

  markDirty: (id, dirty) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, isDirty: dirty } : t)),
    })),

  setFileTree: (tree) => set({ fileTree: tree }),
}));
