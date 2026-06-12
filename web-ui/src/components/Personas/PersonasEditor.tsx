import { useState, useEffect } from 'react';
import { PersonaForm } from './PersonaForm';
import { PersonaList } from './PersonaList';
import { PersonaPreview } from './PersonaPreview';

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

export function PersonasEditor() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/personas');
      if (!response.ok) throw new Error('Failed to load personas');
      const data = await response.json();
      setPersonas(data);
      if (data.length > 0 && !selectedPersona) {
        setSelectedPersona(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePersona = async (persona: Persona) => {
    try {
      const isNew = !personas.find(p => p.name === persona.name);
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/personas' : `/api/personas/${selectedPersona?.name}`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(persona),
      });

      if (!response.ok) throw new Error('Failed to save persona');
      const savedPersona = await response.json();

      if (isNew) {
        setPersonas([...personas, savedPersona]);
      } else {
        setPersonas(personas.map(p => p.name === persona.name ? savedPersona : p));
      }

      setSelectedPersona(savedPersona);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDeletePersona = async (name: string) => {
    if (!confirm(`Delete persona "${name}"?`)) return;

    try {
      const response = await fetch(`/api/personas/${name}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');

      setPersonas(personas.filter(p => p.name !== name));
      if (selectedPersona?.name === name) {
        setSelectedPersona(personas[0] || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleDuplicatePersona = async (name: string) => {
    const baseName = prompt('New persona name:', `${name} (copy)`);
    if (!baseName) return;

    try {
      const response = await fetch(`/api/personas/${name}/duplicate?new_name=${encodeURIComponent(baseName)}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to duplicate');
      const newPersona = await response.json();
      setPersonas([...personas, newPersona]);
      setSelectedPersona(newPersona);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Agent Personas</h1>
        <p className="text-sm text-gray-600 mt-1">
          Customize agent behavior, tone, and system prompt sections
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex gap-4 p-6">
        {/* Left panel: Personas list */}
        <div className="w-80 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Personas</h2>
            <button
              onClick={() => {
                setSelectedPersona(null);
                setIsEditing(true);
              }}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              New
            </button>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Loading...
            </div>
          ) : (
            <PersonaList
              personas={personas}
              selectedPersona={selectedPersona}
              onSelect={setSelectedPersona}
              onDelete={handleDeletePersona}
              onDuplicate={handleDuplicatePersona}
            />
          )}
        </div>

        {/* Right panel: Editor and Preview */}
        {selectedPersona && (
          <div className="flex-1 flex gap-4 overflow-hidden">
            {/* Editor */}
            <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  {isEditing ? 'Edit' : 'View'} Persona
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-auto">
                {isEditing ? (
                  <PersonaForm
                    persona={selectedPersona}
                    onSave={handleSavePersona}
                    onCancel={() => setIsEditing(false)}
                  />
                ) : (
                  <PersonaPreview persona={selectedPersona} />
                )}
              </div>
            </div>

            {/* Preview toggle */}
            {!isEditing && (
              <div className="w-96 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-900">Prompt Preview</h2>
                </div>
                <PersonaPreview persona={selectedPersona} isPromptPreview />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
