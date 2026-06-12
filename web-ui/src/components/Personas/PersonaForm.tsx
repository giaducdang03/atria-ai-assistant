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

interface PersonaFormProps {
  persona: Persona | null;
  onSave: (persona: Persona) => void;
  onCancel: () => void;
}

const SECTION_OPTIONS = [
  'main-mode-awareness',
  'main-security-policy',
  'main-tone-and-style',
  'main-interaction-pattern',
  'main-code-quality',
  'main-action-safety',
  'main-read-before-edit',
  'main-error-recovery',
];

const SUBAGENT_OPTIONS = [
  'subagent-ask-user',
  'subagent-code-explorer',
  'subagent-planner',
  'subagent-pr-reviewer',
  'subagent-web-generator',
];

export function PersonaForm({ persona, onSave, onCancel }: PersonaFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agentTone, setAgentTone] = useState('');
  const [agentStyle, setAgentStyle] = useState('');
  const [agentBehavior, setAgentBehavior] = useState('');
  const [sectionOverrides, setSectionOverrides] = useState<Record<string, string>>({});
  const [selectedSection, setSelectedSection] = useState(SECTION_OPTIONS[0]);
  const [subagentOverrides, setSubagentOverrides] = useState<Record<string, string>>({});
  const [selectedSubagent, setSelectedSubagent] = useState(SUBAGENT_OPTIONS[0]);

  useEffect(() => {
    if (persona) {
      setName(persona.name);
      setDescription(persona.description);
      setAgentTone(persona.agent_tone || '');
      setAgentStyle(persona.agent_style || '');
      setAgentBehavior(persona.agent_behavior || '');
      setSectionOverrides(persona.section_overrides || {});
      setSubagentOverrides(persona.subagent_overrides || {});
    } else {
      setName('');
      setDescription('');
      setAgentTone('');
      setAgentStyle('');
      setAgentBehavior('');
      setSectionOverrides({});
      setSubagentOverrides({});
    }
  }, [persona]);

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a persona name');
      return;
    }

    const savedPersona: Persona = {
      name: name.trim(),
      description: description.trim(),
      is_built_in: false,
      created_at: persona?.created_at || new Date().toISOString(),
      agent_tone: agentTone || undefined,
      agent_style: agentStyle || undefined,
      agent_behavior: agentBehavior || undefined,
      section_overrides: sectionOverrides,
      subagent_overrides: subagentOverrides,
    };

    onSave(savedPersona);
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="space-y-6">
        {/* Basic Info */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Persona Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Creative Coder"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            placeholder="Describe this persona..."
          />
        </div>

        {/* Agent Customizations */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-900 mb-4">Agent Customization</h3>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Tone
            </label>
            <textarea
              value={agentTone}
              onChange={(e) => setAgentTone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-xs"
              rows={2}
              placeholder="e.g., Be concise and technical"
            />
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Style
            </label>
            <textarea
              value={agentStyle}
              onChange={(e) => setAgentStyle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-xs"
              rows={2}
              placeholder="e.g., Use bullet points and code blocks"
            />
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Behavior
            </label>
            <textarea
              value={agentBehavior}
              onChange={(e) => setAgentBehavior(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-xs"
              rows={2}
              placeholder="e.g., Ask before making changes, suggest alternatives"
            />
          </div>
        </div>

        {/* Section Overrides */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-900 mb-4">System Prompt Sections</h3>
          <div className="flex gap-2 mb-3">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {SECTION_OPTIONS.map((section) => (
                <option key={section} value={section}>
                  {section.replace(/-/g, ' ')}
                </option>
              ))}
            </select>
            {sectionOverrides[selectedSection] && (
              <button
                onClick={() => {
                  const newOverrides = { ...sectionOverrides };
                  delete newOverrides[selectedSection];
                  setSectionOverrides(newOverrides);
                }}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
              >
                Clear
              </button>
            )}
          </div>
          <textarea
            value={sectionOverrides[selectedSection] || ''}
            onChange={(e) => {
              setSectionOverrides({
                ...sectionOverrides,
                [selectedSection]: e.target.value,
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-xs"
            rows={4}
            placeholder="Override this section's content (leave empty to use default)"
          />
        </div>

        {/* Subagent Overrides */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-900 mb-4">Subagent Prompts</h3>
          <div className="flex gap-2 mb-3">
            <select
              value={selectedSubagent}
              onChange={(e) => setSelectedSubagent(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {SUBAGENT_OPTIONS.map((subagent) => (
                <option key={subagent} value={subagent}>
                  {subagent.replace(/-/g, ' ')}
                </option>
              ))}
            </select>
            {subagentOverrides[selectedSubagent] && (
              <button
                onClick={() => {
                  const newOverrides = { ...subagentOverrides };
                  delete newOverrides[selectedSubagent];
                  setSubagentOverrides(newOverrides);
                }}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
              >
                Clear
              </button>
            )}
          </div>
          <textarea
            value={subagentOverrides[selectedSubagent] || ''}
            onChange={(e) => {
              setSubagentOverrides({
                ...subagentOverrides,
                [selectedSubagent]: e.target.value,
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-xs"
            rows={4}
            placeholder="Override this subagent's system prompt"
          />
        </div>

        {/* Save/Cancel buttons */}
        <div className="border-t pt-4 flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Save Persona
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
