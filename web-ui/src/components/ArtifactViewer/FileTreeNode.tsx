import { ChevronRight, ChevronDown, Folder, FolderOpen, File as FileIcon } from 'lucide-react';
import { useFileExplorerStore } from '../../stores/fileExplorer';
import { useViewerTabsStore } from '../../stores/viewerTabs';
import type { FsEntry } from '../../types';

interface Props {
  convId: string;
  parentPath: string;
  entry: FsEntry;
  depth: number;
  searchActive: boolean;
  searchTerm: string;
}

export function FileTreeNode({ convId, parentPath, entry, depth, searchActive, searchTerm }: Props) {
  const fullPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;

  const isExpanded = useFileExplorerStore(s => s.treesByConv[convId]?.expanded.has(fullPath) ?? false);
  const children = useFileExplorerStore(s => s.treesByConv[convId]?.childrenByPath[fullPath]);
  const loading = useFileExplorerStore(
    s => s.treesByConv[convId]?.loadingPaths.has(fullPath) ?? false,
  );
  const activeTabId = useViewerTabsStore(s => s.tabsByConv[convId]?.activeId ?? null);
  const toggleExpand = useFileExplorerStore(s => s.toggleExpand);
  const openTab = useViewerTabsStore(s => s.openTab);

  if (searchActive && entry.kind === 'file' && !entry.name.toLowerCase().includes(searchTerm)) {
    return null;
  }

  const handleClick = () => {
    if (entry.kind === 'dir') {
      void toggleExpand(convId, fullPath);
    } else {
      openTab(convId, fullPath);
    }
  };

  const isActive = activeTabId === fullPath;
  const Chevron = isExpanded ? ChevronDown : ChevronRight;
  const FolderGlyph = isExpanded ? FolderOpen : Folder;

  return (
    <>
      <div
        onClick={handleClick}
        style={{ paddingLeft: 4 + depth * 12 }}
        className={`group flex items-center gap-1 px-2 py-0.5 cursor-pointer transition-colors text-[13px] font-mono ${
          isActive ? 'bg-ink/8 text-ink' : 'text-ink/80 hover:bg-surface-soft'
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
      >
        {entry.kind === 'dir' ? (
          <Chevron className="w-3 h-3 flex-shrink-0 text-ink/45" />
        ) : (
          <span className="w-3 h-3 flex-shrink-0" />
        )}
        {entry.kind === 'dir' ? (
          <FolderGlyph className="w-3.5 h-3.5 flex-shrink-0 text-ink" />
        ) : (
          <FileIcon className="w-3.5 h-3.5 flex-shrink-0 text-ink/65" />
        )}
        <span className="truncate">{entry.name}</span>
        {loading && <span className="ml-auto text-[13px] text-ink/45">…</span>}
      </div>
      {entry.kind === 'dir' && isExpanded && children?.map(child => (
        <FileTreeNode
          key={`${fullPath}/${child.name}`}
          convId={convId}
          parentPath={fullPath}
          entry={child}
          depth={depth + 1}
          searchActive={searchActive}
          searchTerm={searchTerm}
        />
      ))}
    </>
  );
}
