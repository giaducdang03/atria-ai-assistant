import { User, X } from 'lucide-react';
import { useChatStore } from '../../stores/chat';

export function PersonaSelector() {
  const selectedPersona = useChatStore(state => {
    const sid = state.currentSessionId;
    return sid ? state.sessionStates[sid]?.selectedPersona : null;
  });
  const setSelectedPersona = useChatStore(state => state.setSelectedPersona);
  const openSettingsModal = useChatStore(state => state.openSettingsModal);

  const handleClick = () => {
    openSettingsModal();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPersona(null);
  };

  const pillBase = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium cursor-pointer transition-colors select-none hover:scale-105';
  const pillStyle = 'bg-bg-400/40 text-text-200 border-gray-300 hover:bg-bg-400/60';

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        className={`${pillBase} ${pillStyle}`}
        title={selectedPersona ? `Current persona: ${selectedPersona}` : 'Select a persona'}
      >
        <User className="w-3 h-3" strokeWidth={2} />
        {selectedPersona ? (
          <div className="flex items-center gap-1">
            <span>{selectedPersona}</span>
            <button
              onClick={handleClear}
              className="ml-1 text-text-200/60 hover:text-text-200 transition-colors"
              title="Clear persona"
            >
              <X className="w-3 h-3" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <span>Persona</span>
        )}
      </button>
    </div>
  );
}
