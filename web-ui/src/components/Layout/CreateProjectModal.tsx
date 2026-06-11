import { useState, useRef, useEffect } from 'react';
import { useProjectsStore } from '../../stores/projects';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const createProject = useProjectsStore(state => state.createProject);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Project name is required'); return; }
    setIsSubmitting(true);
    setError('');
    try {
      await createProject(trimmed);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewSlug = name.trim().toLowerCase().replace(/\s+/g, '-') || '<name>';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-bg-000 border border-border-300/20 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-text-000 mb-4">New Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-text-300 font-mono mb-1">Project name</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. FPT Research, My App"
              className="w-full bg-bg-100 border border-border-300/20 rounded-lg px-3 py-2 text-sm text-text-000 placeholder-text-400 focus:outline-none focus:border-accent-main-100/60"
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>
          <p className="text-xs text-text-400">
            Folder: <code className="font-mono text-text-300">~/.atria/workspaces/…/{previewSlug}/</code>
          </p>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-sm text-text-300 hover:text-text-100 transition-colors">Cancel</button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-1.5 text-sm bg-accent-main-100 text-white rounded-lg hover:bg-accent-main-100/80 disabled:opacity-40 transition-colors"
            >
              {isSubmitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
