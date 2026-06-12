import { useState, useEffect } from 'react';

interface Persona {
  name: string;
  system_prompt: string;
  is_built_in: boolean;
  created_at: string;
}

interface PersonaFormProps {
  persona: Persona | null;
  onSave: (persona: Persona) => void;
  onCancel: () => void;
}

export function PersonaForm({ persona, onSave, onCancel }: PersonaFormProps) {
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  useEffect(() => {
    if (persona) {
      setName(persona.name);
      setSystemPrompt(persona.system_prompt || '');
    } else {
      setName('');
      setSystemPrompt('');
    }
  }, [persona]);

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a persona name');
      return;
    }
    if (!systemPrompt.trim()) {
      alert('Please enter a system prompt');
      return;
    }

    const savedPersona: Persona = {
      name: name.trim(),
      system_prompt: systemPrompt.trim(),
      is_built_in: false,
      created_at: persona?.created_at || new Date().toISOString(),
    };

    onSave(savedPersona);
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="space-y-4">
        {/* Persona Name */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Persona Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Code Expert, Creative Writer"
            className="w-full px-3 py-2 border border-hairline rounded-lg focus:outline-none focus:ring-2 focus:ring-ink/20 bg-canvas text-ink"
          />
        </div>

        {/* System Prompt */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            System Prompt
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Enter custom system prompt for this persona..."
            className="w-full px-3 py-2 border border-hairline rounded-lg focus:outline-none focus:ring-2 focus:ring-ink/20 bg-canvas text-ink resize-none font-mono text-xs"
            rows={12}
          />
        </div>

        {/* Save/Cancel buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-ink text-inverse-ink rounded-full hover:bg-ink/90 font-medium transition-colors"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-hairline text-ink rounded-full hover:bg-surface-soft font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
