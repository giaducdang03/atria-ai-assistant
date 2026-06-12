import { useState } from 'react';

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

interface PersonaListProps {
  personas: Persona[];
  selectedPersona: Persona | null;
  onSelect: (persona: Persona) => void;
  onDelete: (name: string) => void;
  onDuplicate: (name: string) => void;
}

export function PersonaList({
  personas,
  selectedPersona,
  onSelect,
  onDelete,
  onDuplicate,
}: PersonaListProps) {
  const [hoveredPersona, setHoveredPersona] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
      {personas.length === 0 ? (
        <div className="p-4 text-center text-gray-500 text-sm">
          No personas yet. Create one to get started.
        </div>
      ) : (
        personas.map((persona) => (
          <div
            key={persona.name}
            className={`p-4 cursor-pointer hover:bg-gray-100 transition ${
              selectedPersona?.name === persona.name ? 'bg-blue-50 border-l-2 border-blue-600' : ''
            }`}
            onMouseEnter={() => setHoveredPersona(persona.name)}
            onMouseLeave={() => setHoveredPersona(null)}
            onClick={() => onSelect(persona)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{persona.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {persona.description}
                </p>
                {persona.is_built_in && (
                  <span className="inline-block mt-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    Built-in
                  </span>
                )}
              </div>

              {hoveredPersona === persona.name && !persona.is_built_in && (
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(persona.name);
                    }}
                    className="p-1 hover:bg-gray-200 rounded text-gray-600 text-xs"
                    title="Duplicate"
                  >
                    📋
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(persona.name);
                    }}
                    className="p-1 hover:bg-red-100 rounded text-red-600 text-xs"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
