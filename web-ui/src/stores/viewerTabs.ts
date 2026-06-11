import { create } from 'zustand';
import type { ViewerTab } from '../types';

interface TabSlice {
  tabs: ViewerTab[];
  activeId: string | null;
}

interface ViewerTabsState {
  tabsByConv: Record<string, TabSlice>;
  openTab: (convId: string, path: string) => void;
  closeTab: (convId: string, id: string) => void;
  setActive: (convId: string, id: string) => void;
  clearConv: (convId: string) => void;
}

function tabFromPath(path: string): ViewerTab {
  const name = path.split('/').pop() || path;
  const dot = name.lastIndexOf('.');
  const ext = dot >= 0 ? name.slice(dot).toLowerCase() : '';
  return { id: path, path, name, ext };
}

export const useViewerTabsStore = create<ViewerTabsState>((set, get) => ({
  tabsByConv: {},

  openTab: (convId, path) => {
    const slice = get().tabsByConv[convId] ?? { tabs: [], activeId: null };
    const existing = slice.tabs.find(t => t.id === path);
    if (existing) {
      set({ tabsByConv: { ...get().tabsByConv, [convId]: { ...slice, activeId: path } } });
      return;
    }
    const tab = tabFromPath(path);
    set({
      tabsByConv: {
        ...get().tabsByConv,
        [convId]: { tabs: [...slice.tabs, tab], activeId: tab.id },
      },
    });
  },

  closeTab: (convId, id) => {
    const slice = get().tabsByConv[convId];
    if (!slice) return;
    const idx = slice.tabs.findIndex(t => t.id === id);
    if (idx < 0) return;
    const remaining = slice.tabs.filter(t => t.id !== id);
    let nextActive: string | null = slice.activeId;
    if (slice.activeId === id) {
      if (remaining.length === 0) nextActive = null;
      else nextActive = remaining[Math.min(idx, remaining.length - 1)].id;
    }
    set({
      tabsByConv: {
        ...get().tabsByConv,
        [convId]: { tabs: remaining, activeId: nextActive },
      },
    });
  },

  setActive: (convId, id) => {
    const slice = get().tabsByConv[convId];
    if (!slice || !slice.tabs.some(t => t.id === id)) return;
    set({ tabsByConv: { ...get().tabsByConv, [convId]: { ...slice, activeId: id } } });
  },

  clearConv: (convId) => {
    const rest = { ...get().tabsByConv };
    delete rest[convId];
    set({ tabsByConv: rest });
  },
}));
