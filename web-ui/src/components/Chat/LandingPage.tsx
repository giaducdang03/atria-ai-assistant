import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AnimatedHeadline } from '../ui/AnimatedHeadline';
import { transitions } from '../ui/motion';
import { useChatStore } from '../../stores/chat';
import { useProjectsStore } from '../../stores/projects';
import { SPINNER_FRAMES } from '../../constants/spinner';
import { CreateConversationModal } from '../Layout/CreateConversationModal';
import { CreateProjectModal } from '../Layout/CreateProjectModal';
import type { Project } from '../../types';

export function LandingPage() {
  const [input, setInput] = useState('');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedConvName, setSelectedConvName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showConvPicker, setShowConvPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [brailleOffset, setBrailleOffset] = useState(0);
  const [createConvFor, setCreateConvFor] = useState<Project | null>(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const convPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileAcceptRef = useRef<string>('');

  const isConnected = useChatStore(state => state.isConnected);
  const loadSession = useChatStore(state => state.loadSession);
  const sendMessage = useChatStore(state => state.sendMessage);

  const { projects, conversations, loadProjects } = useProjectsStore();
  const reduce = useReducedMotion();

  useEffect(() => { loadProjects(); }, []);

  // Braille halo animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBrailleOffset(prev => (prev + 1) % SPINNER_FRAMES.length);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Click-outside to dismiss menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setShowPlusMenu(false);
      }
      if (convPickerRef.current && !convPickerRef.current.contains(e.target as Node)) {
        setShowConvPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSelectConversation = async (convId: string, convName: string) => {
    setShowConvPicker(false);
    setSelectedConvId(convId);
    setSelectedConvName(convName);
    if (!input.trim()) {
      // No pending message — navigate immediately
      setIsLoading(true);
      try {
        await loadSession(convId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversation');
        setIsLoading(false);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !isConnected) return;
    if (!selectedConvId) {
      setError('Select a conversation first');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await loadSession(selectedConvId);
      sendMessage(input.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (accept: string) => {
    fileAcceptRef.current = accept;
    setShowPlusMenu(false);
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.accept = accept;
        fileInputRef.current.click();
      }
    }, 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) setAttachedFiles(prev => [...prev, ...Array.from(files)]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const allConversations = projects.flatMap(p =>
    (conversations[p.id] ?? []).map(c => ({ ...c, projectName: p.name, project: p }))
  );
  const hasConversations = allConversations.length > 0;

  return (
    <div className="relative flex flex-col items-center justify-center h-full px-6 bg-canvas overflow-hidden">
      {/* Background watermark — oversized editorial wordmark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className="font-sans select-none animate-breathe"
          style={{
            fontSize: 'clamp(160px, 22vw, 320px)',
            fontWeight: 340,
            letterSpacing: '-0.06em',
            color: 'hsl(var(--surface-soft))',
            lineHeight: 1,
          }}
        >
          Atria
        </span>
        <div className="absolute animate-spin-slow" style={{ width: 360, height: 360 }}>
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i / 24) * 360;
            const char = SPINNER_FRAMES[(i + brailleOffset) % SPINNER_FRAMES.length];
            return (
              <span
                key={i}
                className="absolute text-lg font-mono text-bg-300"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `rotate(${angle}deg) translateX(180px) rotate(-${angle}deg)`,
                }}
              >
                {char}
              </span>
            );
          })}
        </div>
      </div>

      {/* Centered input card */}
      <div className="relative z-10 w-full max-w-2xl animate-fade-in">
        <div className="mb-8 text-center">
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.chrome}
            className="font-mono uppercase tracking-[0.54px] text-[12px] text-ink/60 block"
          >
            New conversation
          </motion.span>
          <AnimatedHeadline
            as="h2"
            text={'What are we building?'}
            className="mt-3 text-[40px] md:text-display-lg font-sans font-[340] tracking-[-0.96px] leading-[1.05] text-ink"
            step={20}
            startDelay={140}
          />
        </div>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitions.editorial, delay: 0.45 }}
          className="rounded-lg border border-hairline-soft bg-canvas shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
        >
          {/* Textarea */}
          <div className="px-5 pt-5 pb-2 rounded-t-2xl">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="How can I help you today?"
              disabled={isLoading || !isConnected}
              className="w-full bg-transparent text-text-000 placeholder-text-400 resize-none border-0 focus:outline-none focus:ring-0 text-base leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
              rows={3}
              style={{ minHeight: '80px' }}
            />

            {/* Attached file chips */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachedFiles.map((file, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-200 text-text-200 text-xs border border-border-300/15"
                  >
                    <svg className="w-3.5 h-3.5 text-text-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {file.name}
                    <button onClick={() => removeFile(i)} className="ml-0.5 text-text-400 hover:text-danger-100">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bottom utility bar */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border-300/10 rounded-b-2xl">
            {/* Left: + button */}
            <div className="relative" ref={plusMenuRef}>
              <button
                onClick={() => setShowPlusMenu(!showPlusMenu)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-bg-200 hover:bg-bg-300 text-text-300 hover:text-text-100 transition-colors"
                title="Attach files"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {showPlusMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-bg-000 border border-border-300/20 rounded-xl shadow-lg overflow-hidden z-50 animate-fade-in">
                  <button
                    onClick={() => handleFileUpload('.png,.jpg,.jpeg,.gif,.webp')}
                    className="w-full px-4 py-2.5 text-left text-sm text-text-100 hover:bg-bg-200 flex items-center gap-2.5"
                  >
                    <svg className="w-4 h-4 text-text-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upload image
                  </button>
                  <button
                    onClick={() => handleFileUpload('.pdf,.docx')}
                    className="w-full px-4 py-2.5 text-left text-sm text-text-100 hover:bg-bg-200 flex items-center gap-2.5"
                  >
                    <svg className="w-4 h-4 text-text-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Upload document
                  </button>
                </div>
              )}
            </div>

            {/* Right: conversation picker + send */}
            <div className="flex items-center gap-2">
              <div className="relative" ref={convPickerRef}>
                <button
                  onClick={() => setShowConvPicker(!showConvPicker)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-300 hover:text-text-100 bg-bg-200 hover:bg-bg-300 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
                  </svg>
                  {selectedConvName || 'Select conversation...'}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showConvPicker && (
                  <div className="absolute bottom-full right-0 mb-2 w-72 bg-bg-000 border border-border-300/20 rounded-xl shadow-lg overflow-hidden z-50 animate-fade-in">
                    <div className="max-h-64 overflow-y-auto">
                      {!hasConversations && (
                        <p className="text-xs text-text-400 px-4 py-3 text-center">No conversations yet</p>
                      )}
                      {projects.map(project => {
                        const convs = conversations[project.id] ?? [];
                        if (convs.length === 0) return null;
                        return (
                          <div key={project.id}>
                            <div className="px-3 py-1.5 text-xs font-semibold text-text-400 font-mono bg-bg-100 sticky top-0">
                              {project.name}
                            </div>
                            {convs.map(conv => (
                              <button
                                key={conv.id}
                                onClick={() => handleSelectConversation(conv.id, conv.name)}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-bg-200 flex items-center gap-2 ${
                                  conv.id === selectedConvId ? 'bg-bg-200' : ''
                                }`}
                              >
                                <svg className="w-3.5 h-3.5 text-text-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
                                </svg>
                                <span className="text-text-100 truncate">{conv.name}</span>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t border-border-300/10">
                      {projects.length > 0 ? (
                        <button
                          onClick={() => {
                            setShowConvPicker(false);
                            setCreateConvFor(projects[0]);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-accent-main-100 hover:bg-bg-200 flex items-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          New conversation…
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setShowConvPicker(false);
                            setCreateProjectOpen(true);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-accent-main-100 hover:bg-bg-200 flex items-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          New project…
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || !isConnected}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent-main-100 hover:bg-accent-main-200 text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-bg-300 disabled:text-text-500 transition-colors"
                title="Send (Enter)"
              >
                {isLoading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {error && (
          <p className="mt-3 text-sm text-danger-100 text-center animate-fade-in">{error}</p>
        )}

        <p className="mt-4 text-xs text-text-400 text-center">
          <kbd className="px-1.5 py-0.5 bg-bg-200 border border-border-300/20 rounded text-xs">Enter</kbd> to send
          {' '}&middot;{' '}
          <kbd className="px-1.5 py-0.5 bg-bg-200 border border-border-300/20 rounded text-xs">Shift + Enter</kbd> for new line
        </p>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

      {/* Modals */}
      {createConvFor && (
        <CreateConversationModal
          isOpen={true}
          projectId={createConvFor.id}
          projectName={createConvFor.name}
          onClose={() => setCreateConvFor(null)}
        />
      )}
      <CreateProjectModal
        isOpen={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
      />
    </div>
  );
}
