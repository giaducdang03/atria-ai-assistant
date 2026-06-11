import { useCallback, useEffect, useRef, useState } from 'react';
import { PanelRightOpen } from 'lucide-react';
import { useChatStore } from '../../stores/chat';
import { useViewerTabsStore } from '../../stores/viewerTabs';
import { TabBar } from './TabBar';
import { FileTree } from './FileTree';
import { ViewerDispatcher } from './viewers';

const KEY_COLLAPSED = 'artifact-viewer.collapsed';
const KEY_WIDTH = 'artifact-viewer.width';
const KEY_TREE_WIDTH = 'artifact-viewer.tree-width';

const MIN_PANEL = 320;
const MAX_PANEL = 1100;
const MIN_TREE = 160;
const MAX_TREE = 480;

function readNum(key: string, fallback: number): number {
  const v = parseInt(localStorage.getItem(key) ?? '', 10);
  return Number.isNaN(v) ? fallback : v;
}

export function ArtifactViewer() {
  const currentSessionId = useChatStore(s => s.currentSessionId);

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(KEY_COLLAPSED) === 'true',
  );
  const [panelWidth, setPanelWidth] = useState(() => readNum(KEY_WIDTH, 560));
  const [treeWidth, setTreeWidth] = useState(() => readNum(KEY_TREE_WIDTH, 240));

  useEffect(() => { localStorage.setItem(KEY_COLLAPSED, String(collapsed)); }, [collapsed]);
  useEffect(() => { localStorage.setItem(KEY_WIDTH, String(panelWidth)); }, [panelWidth]);
  useEffect(() => { localStorage.setItem(KEY_TREE_WIDTH, String(treeWidth)); }, [treeWidth]);

  const activeTab = useViewerTabsStore(s => {
    if (!currentSessionId) return null;
    const slice = s.tabsByConv[currentSessionId];
    if (!slice) return null;
    return slice.tabs.find(t => t.id === slice.activeId) ?? null;
  });

  const dragRef = useRef<{ kind: 'panel' | 'tree'; startX: number; startW: number } | null>(null);

  const onMouseMove = useCallback((e: MouseEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const delta = e.clientX - d.startX;
    if (d.kind === 'panel') {
      const next = Math.max(MIN_PANEL, Math.min(MAX_PANEL, d.startW - delta));
      setPanelWidth(next);
    } else {
      const next = Math.max(MIN_TREE, Math.min(MAX_TREE, d.startW + delta));
      setTreeWidth(next);
    }
  }, []);

  const onMouseUp = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const startDrag = (kind: 'panel' | 'tree', startW: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { kind, startX: e.clientX, startW };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  if (!currentSessionId) return null;
  const convInt = parseInt(currentSessionId, 10);
  if (Number.isNaN(convInt)) return null;

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        aria-label="Open artifact viewer"
        title="Open artifact viewer"
        className="self-start mt-2 mr-1 p-1.5 rounded text-ink/65 hover:text-ink hover:bg-surface-soft cursor-pointer transition-colors"
      >
        <PanelRightOpen className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="flex h-full shadow-lg" style={{ width: panelWidth }}>
      <div
        onMouseDown={startDrag('panel', panelWidth)}
        className="w-1 cursor-col-resize hover:bg-ink/30"
      />
      <div className="flex flex-col flex-1 min-w-0 bg-canvas">
        <TabBar convId={currentSessionId} onCollapse={() => setCollapsed(true)} />
        <div className="flex flex-1 min-h-0">
          <div style={{ width: treeWidth }} className="flex-shrink-0 min-w-0 shadow-lg">
            <FileTree convId={currentSessionId} />
          </div>
          <div
            onMouseDown={startDrag('tree', treeWidth)}
            className="w-1 cursor-col-resize hover:bg-ink/30"
          />
          <div className="flex-1 min-w-0 min-h-0">
            {activeTab ? (
              <ViewerDispatcher
                convId={convInt}
                path={activeTab.path}
                name={activeTab.name}
                ext={activeTab.ext}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-ink/45 gap-2">
                <div className="w-12 h-12 rounded-full border border-hairline flex items-center justify-center">
                  <PanelRightOpen className="w-5 h-5" />
                </div>
                <p className="text-sm font-mono text-ink/80">Select a file to preview</p>
                <p className="text-xs font-mono text-ink/45 text-center max-w-[260px]">
                  Choose a file from the sidebar to show its contents here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
