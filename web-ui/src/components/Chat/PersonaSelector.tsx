import { useChatStore } from '../../stores/chat';

interface PersonaSelectorProps {
  onOpenSettings?: () => void;
}

export function PersonaSelector({ onOpenSettings }: PersonaSelectorProps) {
  const selectedPersona = useChatStore(state => {
    const sid = state.currentSessionId;
    return sid ? state.sessionStates[sid]?.selectedPersona : null;
  });
  const setSelectedPersona = useChatStore(state => state.setSelectedPersona);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPersona(null);
  };

  return (
    <div className="flex items-center gap-2">
      {selectedPersona && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-ink/5 border border-ink/20 rounded-full text-xs">
          <svg className="w-3.5 h-3.5 text-ink/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2 1m0 0l-2-1m2 1v2.5" />
          </svg>
          <span className="text-ink/80 font-medium">{selectedPersona}</span>
          <button
            onClick={handleClear}
            className="ml-1 text-ink/40 hover:text-ink/70 transition-colors"
            title="Clear persona"
          >
            ✕
          </button>
        </div>
      )}
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className="text-xs text-ink/50 hover:text-ink/70 underline transition-colors"
          title="Open Personas settings"
        >
          {selectedPersona ? 'Change' : 'Select'} persona
        </button>
      )}
    </div>
  );
}
