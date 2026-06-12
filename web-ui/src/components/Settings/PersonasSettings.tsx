import { useState, useEffect } from 'react';
import { PersonaForm } from '../Personas/PersonaForm';

interface Persona {
  name: string;
  system_prompt: string;
  is_built_in: boolean;
  created_at: string;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-ink/50">
          <div className="w-4 h-4 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
          <span className="text-sm">Loading personas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        {/* Personas List */}
        <div className="w-56">
          <div className="border border-hairline rounded-lg overflow-hidden flex flex-col bg-canvas">
            <div className="bg-surface-soft px-4 py-3 border-b border-hairline flex items-center justify-between">
              <h3 className="font-medium text-ink text-sm">Personas</h3>
              <button
                onClick={() => {
                  setSelectedPersona(null);
                  setIsEditing(true);
                }}
                className="px-3 py-1.5 bg-ink text-inverse-ink text-xs rounded-full hover:bg-ink/90 font-medium transition-colors"
              >
                New
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-96">
              {personas.length === 0 ? (
                <div className="p-4 text-center text-ink/50 text-xs">
                  No personas yet
                </div>
              ) : (
                <div className="divide-y divide-hairline">
                  {personas.map(p => (
                    <button
                      key={p.name}
                      onClick={() => {
                        setSelectedPersona(p);
                        setIsEditing(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                        selectedPersona?.name === p.name
                          ? 'bg-ink/5 text-ink font-medium'
                          : 'text-ink hover:bg-surface-soft'
                      }`}
                    >
                      <div className="truncate">{p.name}</div>
                      <div className="text-xs text-ink/50 truncate">{p.system_prompt.substring(0, 40)}...</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editor */}
        {(selectedPersona || isEditing) && (
          <div className="flex-1">
            <div className="border border-hairline rounded-lg overflow-hidden flex flex-col bg-canvas">
              <div className="bg-surface-soft px-4 py-3 border-b border-hairline flex items-center justify-between">
                <h3 className="font-medium text-ink text-sm">
                  {isEditing ? 'Edit' : 'View'} Persona
                </h3>
                {!isEditing && selectedPersona && (
                  <button
                    onClick={() => handleDeletePersona(selectedPersona.name)}
                    className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-full hover:bg-red-100 font-medium transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto max-h-96">
                {isEditing ? (
                  <PersonaForm
                    persona={selectedPersona}
                    onSave={handleSavePersona}
                    onCancel={() => setIsEditing(false)}
                  />
                ) : selectedPersona ? (
                  <div className="p-6 space-y-4">
                    <div>
                      <h4 className="text-xs font-medium text-ink/50 uppercase mb-1">Name</h4>
                      <p className="text-sm text-ink">{selectedPersona.name}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-ink/50 uppercase mb-2">System Prompt</h4>
                      <pre className="text-xs bg-surface-soft p-3 rounded-lg overflow-auto max-h-64 text-ink whitespace-pre-wrap">
                        {selectedPersona.system_prompt}
                      </pre>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full px-4 py-2 bg-ink text-inverse-ink rounded-full hover:bg-ink/90 font-medium text-sm transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
