import { useState, useEffect } from 'react';

interface Persona {
  name: string;
  description: string;
  is_built_in: boolean;
  created_at: string;
  agent_tone?: string;
  agent_style?: string;
  agent_behavior?: string;
  section_overrides: Record<string, string>;
  subagent_overrides: Record<string, string>;
}

interface PersonaPreviewProps {
  persona: Persona;
  isPromptPreview?: boolean;
}

export function PersonaPreview({ persona, isPromptPreview = false }: PersonaPreviewProps) {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [loading, setLoading] = useState(isPromptPreview);

  useEffect(() => {
    if (!isPromptPreview) return;

    const loadPreview = async () => {
      try {
        const response = await fetch(`/api/personas/${persona.name}/preview`);
        if (response.ok) {
          const data = await response.json();
          setPrompt(data.preview);
        }
      } catch (err) {
        console.error('Failed to load preview:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [persona.name, isPromptPreview]);

  if (isPromptPreview) {
    return (
      <div className="p-4 overflow-y-auto h-full">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading preview...
          </div>
        ) : prompt ? (
          <div className="prose prose-sm max-w-none">
            <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto whitespace-pre-wrap break-words">
              {prompt}
            </pre>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">Failed to load preview</div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Name</h3>
          <p className="text-gray-700">{persona.name}</p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{persona.description}</p>
        </div>

        {persona.is_built_in && (
          <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
            This is a built-in persona and cannot be edited.
          </div>
        )}

        {/* Agent Customization */}
        {(persona.agent_tone || persona.agent_style || persona.agent_behavior) && (
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-4">Agent Customization</h3>

            {persona.agent_tone && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Tone</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{persona.agent_tone}</p>
              </div>
            )}

            {persona.agent_style && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Style</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{persona.agent_style}</p>
              </div>
            )}

            {persona.agent_behavior && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Behavior</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{persona.agent_behavior}</p>
              </div>
            )}
          </div>
        )}

        {/* Section Overrides */}
        {Object.keys(persona.section_overrides).length > 0 && (
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-4">Section Overrides</h3>
            <div className="space-y-3">
              {Object.entries(persona.section_overrides).map(([section, content]) => (
                <div key={section} className="bg-gray-50 p-3 rounded">
                  <h4 className="text-xs font-medium text-gray-700 mb-2 uppercase">
                    {section}
                  </h4>
                  <pre className="text-xs text-gray-600 overflow-auto whitespace-pre-wrap break-words">
                    {content}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subagent Overrides */}
        {Object.keys(persona.subagent_overrides).length > 0 && (
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-4">Subagent Overrides</h3>
            <div className="space-y-3">
              {Object.entries(persona.subagent_overrides).map(([subagent, content]) => (
                <div key={subagent} className="bg-gray-50 p-3 rounded">
                  <h4 className="text-xs font-medium text-gray-700 mb-2 uppercase">
                    {subagent}
                  </h4>
                  <pre className="text-xs text-gray-600 overflow-auto whitespace-pre-wrap break-words">
                    {content}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-900 mb-2">Metadata</h3>
          <p className="text-xs text-gray-500">
            Created: {new Date(persona.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
