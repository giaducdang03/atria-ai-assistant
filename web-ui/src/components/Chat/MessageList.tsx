import { memo, useEffect, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { useChatStore } from '../../stores/chat';
import { ToolCallMessage } from './ToolCallMessage';
import { ThinkingBlock } from './ThinkingBlock';
import { SearchResultBlock } from './SearchResultBlock';
import { DeepResearchBlock } from './DeepResearchBlock';
import { DeepAnalyzeBlock } from './DeepAnalyzeBlock';
import { ImageMessage } from './ImageMessage';
import { DataMessage } from './DataMessage/DataMessage';
import { SPINNER_FRAMES, THINKING_VERBS, SPINNER_COLORS } from '../../constants/spinner';

// Stable module-level components map — passing a new object per render
// makes ReactMarkdown discard its internal memoization on every parent tick.
const MARKDOWN_COMPONENTS: Components = {
  pre({ children }) {
    return (
      <pre className="rounded-md p-4 overflow-x-auto my-4 bg-inverse-canvas text-inverse-ink">
        {children}
      </pre>
    );
  },
  code({ className, children, ...props }) {
    const language = /language-(\w+)/.exec(className || '')?.[1];
    if (language) {
      return <code className="text-inverse-ink text-[14px] font-mono leading-relaxed" data-language={language} {...props}>{children}</code>;
    }
    return (
      <code className="text-[14px] px-1.5 py-0.5 rounded-sm font-mono bg-canvas/60 text-ink border border-hairline-soft" {...props}>
        {children}
      </code>
    );
  },
  p({ children }) {
    return <p className="mb-3 last:mb-0 text-ink text-body leading-relaxed">{children}</p>;
  },
  ul({ children }) {
    return <ul className="list-disc pl-6 space-y-1.5 mb-3 text-ink text-body">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="list-decimal pl-6 space-y-1.5 mb-3 text-ink text-body">{children}</ol>;
  },
  li({ children }) {
    return <li className="text-ink text-body">{children}</li>;
  },
  strong({ children }) {
    return <strong className="font-[540] text-ink">{children}</strong>;
  },
  a({ children, href }) {
    return <a href={href} className="link-underline text-ink underline underline-offset-4 hover:decoration-2" target="_blank" rel="noopener noreferrer">{children}</a>;
  },
  h1({ children }) { return <h1 className="text-headline tracking-[-0.26px] font-[540] mt-4 mb-3 text-ink">{children}</h1>; },
  h2({ children }) { return <h2 className="text-headline tracking-[-0.26px] font-[540] mt-4 mb-3 text-ink">{children}</h2>; },
  h3({ children }) { return <h3 className="text-[20px] leading-snug tracking-[-0.14px] font-[540] mt-3 mb-2 text-ink">{children}</h3>; },
};

const AssistantMarkdown = memo(function AssistantMarkdown({ content }: { content: string }) {
  return (
    <div className="color-block bg-block-cream text-ink rounded-lg px-6 py-7 md:px-10 md:py-9">
      <span className="font-mono uppercase tracking-[0.54px] text-[12px] text-ink/60 block mb-4">
        Atria
      </span>
      <div className="prose max-w-none code-hover">
        <ReactMarkdown components={MARKDOWN_COMPONENTS}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
});

const UserTurn = memo(function UserTurn({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="color-block color-block-navy bg-block-navy rounded-lg px-6 py-5 md:px-7 md:py-6 max-w-[85%] md:max-w-[75%] shadow-md">
        <span className="font-mono uppercase tracking-[0.54px] text-[12px] text-inverse-ink/70 block mb-2">
          You
        </span>
        <div className="text-body text-inverse-ink whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  );
});

function LoadingSpinner({ label }: { label: string }) {
  const [spinnerIndex, setSpinnerIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSpinnerIndex(prev => (prev + 1) % SPINNER_FRAMES.length);
      setColorIndex(prev => (prev + 1) % SPINNER_COLORS.length);
    }, 160);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-block-cream rounded-lg px-6 py-4">
      <div className="flex items-center gap-3">
        <span className={`text-base font-medium ${SPINNER_COLORS[colorIndex]}`}>
          {SPINNER_FRAMES[spinnerIndex]}
        </span>
        <span className="text-sm text-text-300 font-medium">
          {label}
        </span>
      </div>
    </div>
  );
}

function ThinkingSpinner() {
  const [verbIndex, setVerbIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setVerbIndex(prev => (prev + 1) % THINKING_VERBS.length);
    }, 2500);
    return () => clearInterval(id);
  }, []);
  return <LoadingSpinner label={`${THINKING_VERBS[verbIndex]}...`} />;
}

function WelcomeScreen() {
  return (
    <div className="relative flex items-center justify-center h-full px-6 bg-canvas overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className="font-sans select-none"
          style={{
            fontSize: 'clamp(140px, 20vw, 280px)',
            fontWeight: 340,
            letterSpacing: '-0.06em',
            color: 'hsl(var(--surface-soft))',
            lineHeight: 1,
          }}
        >
          Atria
        </span>
      </div>
      <div className="relative z-10 max-w-xl w-full">
        <div className="color-block bg-block-cream rounded-lg px-8 py-10 md:px-12 md:py-xxl text-center">
          <span className="font-mono uppercase tracking-[0.54px] text-[12px] text-ink/60 block mb-4">
            Welcome
          </span>
          <h2 className="text-[40px] md:text-display-lg font-sans font-[340] leading-[1.05] tracking-[-0.96px] text-ink">
            Let&rsquo;s get to work.
          </h2>
          <p className="mt-5 text-body-sm text-ink/80">
            Start a conversation with your AI coding assistant.
          </p>
        </div>
      </div>
    </div>
  );
}

export function MessageList() {
  const messages = useChatStore(state => {
    const sid = state.currentSessionId;
    return sid ? state.sessionStates[sid]?.messages ?? [] : [];
  });
  const isLoading = useChatStore(state => {
    const sid = state.currentSessionId;
    return sid ? state.sessionStates[sid]?.isLoading ?? false : false;
  });
  const progressMessage = useChatStore(state => {
    const sid = state.currentSessionId;
    return sid ? state.sessionStates[sid]?.progressMessage ?? null : null;
  });
  const thinkingLevel = useChatStore(state => state.thinkingLevel);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const isNearBottomRef = useRef(true);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom < 50;

    isNearBottomRef.current = nearBottom;

    if (nearBottom) {
      setUserHasScrolled(false);
    } else {
      setUserHasScrolled(true);
    }
  }, []);

  // Auto-scroll on new messages. 'auto' (instant) — smooth scroll fires
  // every token chunk during streaming and visibly stutters.
  useEffect(() => {
    if (!userHasScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, userHasScrolled, progressMessage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!scrollContainerRef.current) return;
      const scrollDistance = 300;
      if (e.key === 'PageUp') {
        e.preventDefault();
        scrollContainerRef.current.scrollBy({ top: -scrollDistance, behavior: 'auto' });
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        scrollContainerRef.current.scrollBy({ top: scrollDistance, behavior: 'auto' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (messages.length === 0) {
    return <WelcomeScreen />;
  }

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-canvas" onScroll={handleScroll}>
      <div className="max-w-4.5xl mx-auto py-8 md:py-10 px-4 md:px-8 space-y-5 md:space-y-6">
        {messages.map((message, index) => {
          const depthStyle = message.depth ? { marginLeft: `${message.depth * 1.5}rem` } : undefined;

          if (message.role === 'tool_call') {
            const hasResult = message.tool_result != null && Object.keys(message.tool_result).length > 0;
            return (
              <div key={index} style={depthStyle}>
                <ToolCallMessage message={message} hasResult={hasResult} />
              </div>
            );
          }

          if (message.role === 'thinking') {
            if (thinkingLevel === 'Off') return null;
            const isLastThinking = (isLoading || !!message.streaming) && index === messages.length - 1;
            return <ThinkingBlock key={index} content={message.content} level={message.metadata?.level} isActive={isLastThinking} />;
          }

          if (message.role === 'search_result') {
            return (
              <div key={index}>
                <SearchResultBlock message={message} />
              </div>
            );
          }

          if (message.role === 'data_message') {
            return (
              <div key={index}>
                <DataMessage message={message} />
              </div>
            );
          }

          if (message.role === 'image_message') {
            return (
              <div key={index}>
                <ImageMessage message={message} />
              </div>
            );
          }

          if (message.role === 'deep_research') {
            return (
              <div key={index}>
                <DeepResearchBlock message={message} />
              </div>
            );
          }

          if (message.role === 'deep_analyze') {
            return (
              <div key={index}>
                <DeepAnalyzeBlock message={message} />
              </div>
            );
          }

          const isUser = message.role === 'user';
          return (
            <div key={index}>
              {isUser
                ? <UserTurn content={message.content} />
                : <AssistantMarkdown content={message.content} />
              }
            </div>
          );
        })}

        {progressMessage && <LoadingSpinner label={progressMessage} />}
        {isLoading && !progressMessage && <ThinkingSpinner />}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
