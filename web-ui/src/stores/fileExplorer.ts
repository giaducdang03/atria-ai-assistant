import { create } from 'zustand';
import { apiClient } from '../api/client';
import type { FsEntry } from '../types';

interface TreeState {
  rootEntries: FsEntry[];
  childrenByPath: Record<string, FsEntry[]>;
  loadingPaths: Set<string>;
  expanded: Set<string>;
  showHidden: boolean;
  search: string;
  rootLoaded: boolean;
}

interface FileExplorerState {
  treesByConv: Record<string, TreeState>;
  loadDir: (convId: string, path: string) => Promise<void>;
  toggleExpand: (convId: string, path: string) => Promise<void>;
  setShowHidden: (convId: string, v: boolean) => Promise<void>;
  setSearch: (convId: string, q: string) => void;
  refresh: (convId: string) => Promise<void>;
}

function emptyTree(): TreeState {
  const showHidden = localStorage.getItem('artifact-viewer.show-dotfiles') === 'true';
  return {
    rootEntries: [],
    childrenByPath: {},
    loadingPaths: new Set(),
    expanded: new Set(),
    showHidden,
    search: '',
    rootLoaded: false,
  };
}

export const useFileExplorerStore = create<FileExplorerState>((set, get) => ({
  treesByConv: {},

  loadDir: async (convId, path) => {
    const convInt = parseInt(convId, 10);
    if (Number.isNaN(convInt)) return;
    const trees = get().treesByConv;
    const tree = trees[convId] ?? emptyTree();
    if (tree.loadingPaths.has(path)) return;

    const nextLoading = new Set(tree.loadingPaths);
    nextLoading.add(path);
    set({ treesByConv: { ...trees, [convId]: { ...tree, loadingPaths: nextLoading } } });

    try {
      const resp = await apiClient.listFs(convInt, path, tree.showHidden);
      const after = get().treesByConv[convId] ?? tree;
      const doneLoading = new Set(after.loadingPaths);
      doneLoading.delete(path);
      const isRoot = path === '';
      set({
        treesByConv: {
          ...get().treesByConv,
          [convId]: {
            ...after,
            rootEntries: isRoot ? resp.entries : after.rootEntries,
            rootLoaded: isRoot ? true : after.rootLoaded,
            childrenByPath: isRoot
              ? after.childrenByPath
              : { ...after.childrenByPath, [path]: resp.entries },
            loadingPaths: doneLoading,
          },
        },
      });
    } catch {
      const after = get().treesByConv[convId] ?? tree;
      const doneLoading = new Set(after.loadingPaths);
      doneLoading.delete(path);
      set({
        treesByConv: { ...get().treesByConv, [convId]: { ...after, loadingPaths: doneLoading } },
      });
    }
  },

  toggleExpand: async (convId, path) => {
    const tree = get().treesByConv[convId] ?? emptyTree();
    const expanded = new Set(tree.expanded);
    if (expanded.has(path)) {
      expanded.delete(path);
      set({ treesByConv: { ...get().treesByConv, [convId]: { ...tree, expanded } } });
      return;
    }
    expanded.add(path);
    set({ treesByConv: { ...get().treesByConv, [convId]: { ...tree, expanded } } });
    if (!tree.childrenByPath[path]) {
      await get().loadDir(convId, path);
    }
  },

  setShowHidden: async (convId, v) => {
    localStorage.setItem('artifact-viewer.show-dotfiles', String(v));
    const tree = get().treesByConv[convId] ?? emptyTree();
    set({
      treesByConv: {
        ...get().treesByConv,
        [convId]: { ...tree, showHidden: v, rootLoaded: false, childrenByPath: {} },
      },
    });
    await get().loadDir(convId, '');
  },

  setSearch: (convId, q) => {
    const tree = get().treesByConv[convId] ?? emptyTree();
    set({ treesByConv: { ...get().treesByConv, [convId]: { ...tree, search: q } } });
  },

  refresh: async (convId) => {
    const tree = get().treesByConv[convId];
    if (!tree) return;
    set({
      treesByConv: {
        ...get().treesByConv,
        [convId]: { ...tree, rootLoaded: false, childrenByPath: {} },
      },
    });
    await get().loadDir(convId, '');
    for (const p of tree.expanded) {
      await get().loadDir(convId, p);
    }
  },
}));
