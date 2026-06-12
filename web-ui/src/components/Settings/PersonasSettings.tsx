import { useState, useEffect } from 'react';
import { PersonaForm } from '../Personas/PersonaForm';
import { PersonaList } from '../Personas/PersonaList';

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

export function PersonasSettings() {
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
      const response = await fetch(
        `/api/personas/${name}/duplicate?new_name=${encodeURIComponent(baseName)}`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Failed to duplicate');
      const newPersona = await response.json();
      setPersonas([...personas, newPersona]);
      setSelectedPersona(newPersona);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading personas...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        {/* Personas List */}
        <div className="w-72">
          <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-white">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">Personas</h3>
              <button
                onClick={() => {
                  setSelectedPersona(null);
                  setIsEditing(true);
                }}
                className="px-2.5 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 font-medium"
              >
                New
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-96">
              <PersonaList
                personas={personas}
                selectedPersona={selectedPersona}
                onSelect={setSelectedPersona}
                onDelete={handleDeletePersona}
                onDuplicate={handleDuplicatePersona}
              />
            </div>
          </div>
        </div>

        {/* Editor */}
        {selectedPersona && (
          <div className="flex-1">
            <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-white">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {isEditing ? 'Edit' : 'View'} Persona
                </h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-2.5 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto max-h-96">
                {isEditing ? (
                  <PersonaForm
                    persona={selectedPersona}
                    onSave={handleSavePersona}
                    onCancel={() => setIsEditing(false)}
                    compact
                  />
                ) : (
                  <PersonaPreview persona={selectedPersona} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface PersonaPreviewProps {
  persona: Persona;
}

function PersonaPreview({ persona }: PersonaPreviewProps) {
  return (
    <div className="p-4 space-y-3 text-sm">
      <div>
        <h4 className="font-medium text-gray-900">Name</h4>
        <p className="text-gray-600 mt-0.5">{persona.name}</p>
      </div>

      <div>
        <h4 className="font-medium text-gray-900">Description</h4>
        <p className="text-gray-600 mt-0.5 text-xs whitespace-pre-wrap">
          {persona.description}
        </p>
      </div>

      {persona.agent_tone && (
        <div>
          <h4 className="font-medium text-gray-900">Tone</h4>
          <p className="text-gray-600 mt-0.5 text-xs">{persona.agent_tone}</p>
        </div>
      )}

      {persona.agent_style && (
        <div>
          <h4 className="font-medium text-gray-900">Style</h4>
          <p className="text-gray-600 mt-0.5 text-xs">{persona.agent_style}</p>
        </div>
      )}

      {persona.agent_behavior && (
        <div>
          <h4 className="font-medium text-gray-900">Behavior</h4>
          <p className="text-gray-600 mt-0.5 text-xs">{persona.agent_behavior}</p>
        </div>
      )}

      {Object.keys(persona.section_overrides).length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900">
            Section Overrides ({Object.keys(persona.section_overrides).length})
          </h4>
          <p className="text-gray-500 text-xs mt-0.5">
            {Object.keys(persona.section_overrides).join(', ')}
          </p>
        </div>
      )}

      {Object.keys(persona.subagent_overrides).length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900">
            Subagent Overrides ({Object.keys(persona.subagent_overrides).length})
          </h4>
          <p className="text-gray-500 text-xs mt-0.5">
            {Object.keys(persona.subagent_overrides).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
