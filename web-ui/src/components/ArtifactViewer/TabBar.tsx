import { X, PanelRightClose, FileText, Code2, Image as ImageIcon, BarChart3, File as FileIcon } from 'lucide-react';
import { useViewerTabsStore } from '../../stores/viewerTabs';
import { pickRenderer } from './viewers/extensions';
import type { ViewerTab } from '../../types';

interface Props {
  convId: string;
  onCollapse: () => void;
}

function iconFor(tab: ViewerTab) {
  const kind = pickRenderer(tab.ext);
  if (kind === 'markdown') return FileText;
  if (kind === 'monaco') return Code2;
  if (kind === 'image') return ImageIcon;
  if (kind === 'csv' || kind === 'excel') return BarChart3;
  return FileIcon;
}

export function TabBar({ convId, onCollapse }: Props) {
  const slice = useViewerTabsStore(s => s.tabsByConv[convId]);
  const setActive = useViewerTabsStore(s => s.setActive);
  const closeTab = useViewerTabsStore(s => s.closeTab);

  const tabs = slice?.tabs ?? [];
  const activeId = slice?.activeId ?? null;

  return (
    <div className="flex items-center border-b border-hairline-soft bg-surface-soft/70">
      <div className="flex-1 flex items-center gap-0.5 overflow-x-auto px-1 py-1">
        {tabs.length === 0 && (
          <span className="text-[13px] font-mono text-ink/45 px-2">No file open</span>
        )}
        {tabs.map(tab => {
          const Icon = iconFor(tab);
          const isActive = tab.id === activeId;
          return (
            <div
              key={tab.id}
              onClick={() => setActive(convId, tab.id)}
              onMouseDown={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  closeTab(convId, tab.id);
                }
              }}
              className={`group inline-flex items-center gap-1.5 pl-2 pr-1 py-0.5 rounded text-[13px] font-mono cursor-pointer transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-ink/10 text-ink border-b border-ink'
                  : 'text-ink/65 hover:bg-surface-soft hover:text-ink'
              }`}
              role="tab"
              aria-selected={isActive}
              title={tab.path}
            >
              <Icon className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[160px]">{tab.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(convId, tab.id); }}
                aria-label={`Close ${tab.name}`}
                className={`p-0.5 rounded hover:bg-ink/15 ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                } transition-opacity`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
      <button
        onClick={onCollapse}
        aria-label="Collapse panel"
        className="p-1.5 text-ink/65 hover:text-ink hover:bg-surface-soft cursor-pointer transition-colors"
      >
        <PanelRightClose className="w-4 h-4" />
      </button>
    </div>
  );
}
