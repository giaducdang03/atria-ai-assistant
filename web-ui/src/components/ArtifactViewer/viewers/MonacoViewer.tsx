import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { apiClient } from '../../../api/client';
import { monacoLanguageFor } from './extensions';

interface Props {
  convId: number;
  path: string;
  languageOverride?: string;
}

export function MonacoViewer({ convId, path, languageOverride }: Props) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setText(null);
    setError(null);
    apiClient.readFsText(convId, path)
      .then(t => { if (!cancelled) setText(t); })
      .catch(e => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  }, [convId, path]);

  if (error) {
    return (
      <div className="p-4 text-xs font-mono text-block-coral">
        Failed to load file: {error}
      </div>
    );
  }
  if (text === null) {
    return <div className="p-4 text-xs font-mono text-ink/45">Loading…</div>;
  }

  const dot = path.lastIndexOf('.');
  const ext = dot >= 0 ? path.slice(dot) : '';
  const language = languageOverride ?? monacoLanguageFor(ext);

  return (
    <Editor
      value={text}
      language={language}
      theme="vs"
      options={{
        readOnly: true,
        automaticLayout: true,
        minimap: { enabled: false },
        wordWrap: 'off',
        scrollBeyondLastLine: false,
        fontSize: 13,
      }}
    />
  );
}
