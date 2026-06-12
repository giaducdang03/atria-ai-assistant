import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { useChatStore } from '../../stores/chat';
import { apiClient } from '../../api/client';
import { FileMentionDropdown } from './FileMentionDropdown';
import { FileChangesButton } from './FileChangesButton';
import { PersonaSelector } from './PersonaSelector';
import { StatusBar } from './StatusBar';

interface FileItem {
  path: string;
  name: string;
  is_file: boolean;
}

export function InputBox() {
  const [input, setInput] = useState('');
  const [showFileMention, setShowFileMention] = useState(false);
  const [filesList, setFilesList] = useState<FileItem[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [mentionPosition, setMentionPosition] = useState({ bottom: 0, left: 0 });
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sendMessage = useChatStore(state => state.sendMessage);
  const isLoading = useChatStore(state => {
    const sid = state.currentSessionId;
    return sid ? state.sessionStates[sid]?.isLoading ?? false : false;
  });
  const isConnected = useChatStore(state => state.isConnected);
  const currentSessionId = useChatStore(state => state.currentSessionId);
  const hasActiveSession = !!currentSessionId;

  // Lock send while a deep_research job is awaiting review, queued, or running.
  const isDeepResearchActive = useChatStore(state => {
    const sid = state.currentSessionId;
    if (!sid) return false;
    const msgs = state.sessionStates[sid]?.messages ?? [];
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      if (m.role !== 'deep_research') continue;
      const s = m.dr_status;
      return s === 'reviewing' || s === 'queued' || s === 'running';
    }
    return false;
  });
  const sendLocked = isDeepResearchActive;

  // Load files when @ is detected
  useEffect(() => {
    if (showFileMention) {
      apiClient.listFiles(mentionQuery).then(response => {
        setFilesList(response.files);
        setSelectedFileIndex(0);
      }).catch(error => {
        console.error('Failed to load files:', error);
        setFilesList([]);
      });
    }
  }, [mentionQuery, showFileMention]);

  const handleSend = () => {
    if (!input.trim() || !isConnected || !hasActiveSession || sendLocked) return;

    sendMessage(input.trim());
    setInput('');
    setShowFileMention(false);
  };

  const handleStop = async () => {
    try {
      await apiClient.interruptTask();
    } catch (error) {
      console.error('Failed to interrupt task:', error);
    }
  };

  const handleFileSelect = (file: FileItem) => {
    if (!textareaRef.current) return;

    // Replace @query with @file.path
    const before = input.substring(0, mentionStartPos);
    const after = input.substring(textareaRef.current.selectionStart);
    const newInput = before + '@' + file.path + ' ' + after;

    setInput(newInput);
    setShowFileMention(false);

    // Set cursor position after the inserted file path
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = mentionStartPos + file.path.length + 2; // +2 for @ and space
        textareaRef.current.setSelectionRange(newPos, newPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newInput = e.target.value;
    const cursorPos = e.target.selectionStart;

    setInput(newInput);

    // Check if @ was just typed or is in the current word
    const textBeforeCursor = newInput.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      // Check if there's a space between @ and cursor (which would end the mention)
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        // We're in a mention
        setMentionStartPos(lastAtIndex);
        setMentionQuery(textAfterAt);
        setShowFileMention(true);

        // Anchor dropdown's bottom edge just above the textarea so its height
        // (which varies with result count) doesn't leave a gap.
        if (textareaRef.current) {
          const rect = textareaRef.current.getBoundingClientRect();
          setMentionPosition({
            bottom: window.innerHeight - rect.top + 8,
            left: rect.left + 20
          });
        }
      } else {
        setShowFileMention(false);
      }
    } else {
      setShowFileMention(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle file mention dropdown navigation
    if (showFileMention && filesList.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedFileIndex((prev) => (prev + 1) % filesList.length);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedFileIndex((prev) => (prev - 1 + filesList.length) % filesList.length);
        return;
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleFileSelect(filesList[selectedFileIndex]);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowFileMention(false);
        return;
      }
    }

    // Normal keyboard handling
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape' && isLoading) {
      e.preventDefault();
      handleStop();
    }
  };

  return (
    <div className="bg-bg-000 px-4 py-3">
      <div className="w-full relative">
        <div className="rounded-lg border-0.5 border-hairline-soft bg-canvas focus-within:border-ink focus-within:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all">
          <div className="flex gap-2 px-2 py-1.5 items-center">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                !hasActiveSession
                  ? "Select a session to start chatting..."
                  : !isConnected
                  ? "Disconnected..."
                  : sendLocked
                  ? "Deep research in progress — sending paused until it finishes…"
                  : isLoading
                  ? "Type to queue a message..."
                  : "Type your message... (use @ to mention files)"
              }
              disabled={!isConnected || !hasActiveSession}
              className="flex-1 bg-transparent text-ink placeholder:text-ink/40 text-body-sm rounded-md px-3 py-2 resize-none border-0 focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed leading-[1.45]"
              rows={1}
              style={{ minHeight: 38, maxHeight: 200 }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 200) + 'px';
              }}
            />
            <div className="flex gap-1.5 self-end">
              {isLoading && (
                <button
                  onClick={handleStop}
                  className="px-3 py-2 rounded-lg transition-colors font-medium bg-danger-100 hover:bg-danger-000 text-white hover-scale"
                  title="Stop (Esc)"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <rect x="6" y="6" width="12" height="12" rx="1" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleSend}
                disabled={!input.trim() || !isConnected || !hasActiveSession || sendLocked}
                className="px-4 py-2 rounded-lg transition-colors font-medium bg-accent-main-100 hover:bg-accent-main-200 text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-bg-300 disabled:text-text-500 hover-scale"
                title="Send (Enter)"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-3">
          {/* Keyboard hints */}
          <div className="text-xs text-text-500 px-1">
            Press <kbd className="px-1.5 py-0.5 bg-bg-200 border border-border-300/20 rounded text-xs">@</kbd> to mention files · <kbd className="px-1.5 py-0.5 bg-bg-200 border border-border-300/20 rounded text-xs">Enter</kbd> to send · <kbd className="px-1.5 py-0.5 bg-bg-200 border border-border-300/20 rounded text-xs">Shift + Enter</kbd> for new line · <kbd className="px-1.5 py-0.5 bg-bg-200 border border-border-300/20 rounded text-xs">Esc</kbd> to stop
          </div>

          {/* Controls: Status + Persona + File Changes */}
          {hasActiveSession && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBar />
                <PersonaSelector />
              </div>
              <FileChangesButton />
            </div>
          )}
        </div>

        {showFileMention && (
          <FileMentionDropdown
            files={filesList}
            selectedIndex={selectedFileIndex}
            onSelect={handleFileSelect}
            onClose={() => setShowFileMention(false)}
            position={mentionPosition}
          />
        )}
      </div>
    </div>
  );
}
