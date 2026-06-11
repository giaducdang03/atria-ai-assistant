import { useChatStore } from '../../stores/chat';

export function Header() {
  const isConnected = useChatStore(state => state.isConnected);

  return (
    <header className="bg-canvas border-b border-hairline-soft px-6 py-4">
      <div className="flex items-center justify-between max-w-4.5xl mx-auto">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[18px] font-[540] tracking-[-0.2px] text-ink">Atria</h1>
          <span className="eyebrow-mono text-ink/50">Web Interface</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-semantic-success' : 'bg-hairline-soft'
            }`}
            aria-hidden
          />
          <span className="text-[12px] tracking-[0.2px] text-ink/60">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </header>
  );
}
