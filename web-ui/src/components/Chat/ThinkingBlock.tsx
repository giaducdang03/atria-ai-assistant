import { useState, useRef, useEffect } from 'react';

interface ThinkingBlockProps {
  content: string;
  level?: string;
  isActive?: boolean;
}

const LEVEL_COLORS: Record<string, string> = {
  Low:    'bg-block-mint  text-ink',
  Medium: 'bg-block-lilac text-ink',
  High:   'bg-block-coral text-ink',
};

export function ThinkingBlock({ content, level, isActive }: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  const isCritique = content.startsWith('[Critique]');
  const accentColor = isCritique ? 'border-l-block-coral' : 'border-l-block-lilac';
  const levelBadge = level && LEVEL_COLORS[level] ? level : null;

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [content]);

  return (
    <div className="animate-slide-up">
      <div className={`border-l-2 ${accentColor} pl-3 overflow-hidden`}>
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Collapse thinking' : 'Expand thinking'}
          className={`w-full py-1 flex items-center gap-2 text-left cursor-pointer ${isActive ? 'thinking-shimmer' : ''}`}
        >
          {/* Brain icon */}
          <svg
            className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${isCritique ? 'text-block-coral' : 'text-ink/50'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714a2.25 2.25 0 0 0 .659 1.591L19 14.5m-4.75-11.396c.251.023.501.05.75.082M12 3c2.5 0 5 .5 7 1.5M12 3c-2.5 0-5 .5-7 1.5m14 0v3m-14-3v3"
            />
          </svg>

          <span className="font-mono text-[11px] uppercase tracking-[0.54px] text-ink/70 font-[500]">
            {isCritique ? 'Critique' : 'Thinking'}
          </span>

          {/* Level badge */}
          {levelBadge && (
            <span className={`font-mono text-[10px] uppercase tracking-[0.4px] px-2 py-[2px] rounded-full ${LEVEL_COLORS[levelBadge]}`}>
              {levelBadge}
            </span>
          )}

          {/* Chevron */}
          <svg
            className={`w-3.5 h-3.5 text-ink/50 transition-transform duration-200 flex-shrink-0 ml-auto ${
              isExpanded ? 'rotate-90' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Content — always rendered, clipped when collapsed */}
        <div className="relative">
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              maxHeight: isExpanded ? `${contentHeight + 12}px` : '44px',
            }}
          >
            <div ref={contentRef} className="pb-2">
              <pre className="text-[13px] text-ink/70 whitespace-pre-wrap font-mono leading-[1.55] m-0 p-0 bg-transparent border-0">
                {content}
              </pre>
            </div>
          </div>
          {/* Gradient fade when collapsed */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-canvas to-transparent pointer-events-none transition-opacity duration-300 ${
              isExpanded ? 'opacity-0' : 'opacity-100'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
