import { useState, useRef, useEffect } from 'react';
import { useProjectsStore } from '../../stores/projects';

interface Props {
  isOpen: boolean;
  projectId: string;
  projectName: string;
  onClose: () => void;
}

export function CreateConversationModal({ isOpen, projectId, projectName, onClose }: Props) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const createConversation = useProjectsStore(state => state.createConversation);

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
    if (!trimmed) { setError('Conversation name is required'); return; }
    setIsSubmitting(true);
    setError('');
    try {
      await createConversation(projectId, trimmed);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to create conversation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-bg-000 border border-border-300/20 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-text-000 mb-1">New Conversation</h2>
        <p className="text-xs text-text-400 font-mono mb-4">in <span className="text-text-200">{projectName}</span></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-text-300 font-mono mb-1">Conversation name</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Initial Research, Q1 Analysis"
              className="w-full bg-bg-100 border border-border-300/20 rounded-lg px-3 py-2 text-sm text-text-000 placeholder-text-400 focus:outline-none focus:border-accent-main-100/60"
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-sm text-text-300 hover:text-text-100 transition-colors">Cancel</button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-1.5 text-sm bg-accent-main-100 text-white rounded-lg hover:bg-accent-main-100/80 disabled:opacity-40 transition-colors"
            >
              {isSubmitting ? 'Creating…' : 'Start Conversation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
