import { useEffect } from 'react';
import { Search, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useFileExplorerStore } from '../../stores/fileExplorer';
import { FileTreeNode } from './FileTreeNode';

interface Props { convId: string }

export function FileTree({ convId }: Props) {
  const tree = useFileExplorerStore(s => s.treesByConv[convId]);
  const loadDir = useFileExplorerStore(s => s.loadDir);
  const setShowHidden = useFileExplorerStore(s => s.setShowHidden);
  const setSearch = useFileExplorerStore(s => s.setSearch);
  const refresh = useFileExplorerStore(s => s.refresh);

  useEffect(() => {
    if (!tree?.rootLoaded) void loadDir(convId, '');
  }, [convId, tree?.rootLoaded, loadDir]);

  const showHidden = tree?.showHidden ?? false;
  const search = tree?.search ?? '';
  const rootEntries = tree?.rootEntries ?? [];
  const rootLoading = tree?.loadingPaths.has('') ?? false;
  const searchTerm = search.trim().toLowerCase();
  const searchActive = searchTerm.length > 0;

  return (
    <div className="flex flex-col h-full border-r border-hairline-soft bg-surface-soft/50">
      <div className="flex items-center gap-1 p-1.5 border-b border-hairline-soft">
        <div className="flex items-center gap-1 flex-1 bg-surface-soft rounded px-1.5">
          <Search className="w-3 h-3 text-ink/45" />
          <input
            value={search}
            onChange={(e) => setSearch(convId, e.target.value)}
            placeholder="Search"
            className="flex-1 bg-transparent text-[13px] font-mono text-ink placeholder:text-ink/45 py-0.5 outline-none"
          />
        </div>
        <button
          onClick={() => refresh(convId)}
          aria-label="Refresh tree"
          className="p-1 rounded text-ink/65 hover:text-ink hover:bg-surface-soft cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${rootLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-auto py-1">
        {rootLoading && rootEntries.length === 0 && (
          <p className="px-3 py-1 text-[13px] font-mono text-ink/45">Loading…</p>
        )}
        {!rootLoading && rootEntries.length === 0 && (
          <p className="px-3 py-1 text-[13px] font-mono text-ink/45">No files</p>
        )}
        {rootEntries.map(entry => (
          <FileTreeNode
            key={entry.name}
            convId={convId}
            parentPath=""
            entry={entry}
            depth={0}
            searchActive={searchActive}
            searchTerm={searchTerm}
          />
        ))}
      </div>

      <button
        onClick={() => void setShowHidden(convId, !showHidden)}
        className="flex items-center gap-1.5 px-2 py-1 border-t border-hairline-soft text-[13px] font-mono text-ink/45 hover:text-ink hover:bg-surface-soft cursor-pointer transition-colors"
      >
        {showHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        Show dotfiles
      </button>
    </div>
  );
}
