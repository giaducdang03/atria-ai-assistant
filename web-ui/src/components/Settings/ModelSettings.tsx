import { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useToastStore } from '../../stores/toast';

interface Config {
  model: string;
  model_thinking?: string | null;
  model_vlm?: string | null;
  model_critique?: string | null;
  model_compact?: string | null;
  api_base_url?: string | null;
  temperature: number;
}

// ─── Hardcoded model catalogue ───────────────────────────────────────────────
interface ModelOption { id: string; label: string; }

const MODELS_GENERAL: ModelOption[] = [
  { id: 'gpt-4o',              label: 'GPT-4o' },
  { id: 'gpt-4o-mini',         label: 'GPT-4o Mini' },
  { id: 'gpt-4.1',             label: 'GPT-4.1' },
  { id: 'gpt-4.1-mini',        label: 'GPT-4.1 Mini' },
  { id: 'gpt-4.1-nano',        label: 'GPT-4.1 Nano' },
];

const MODELS_REASONING: ModelOption[] = [
  { id: 'o3',                  label: 'o3' },
  { id: 'o4-mini',             label: 'o4-mini' },
  { id: 'o3-mini',             label: 'o3-mini' },
];

const MODELS_VISION: ModelOption[] = [
  { id: 'gpt-4o',              label: 'GPT-4o' },
  { id: 'gpt-4.1',             label: 'GPT-4.1' },
  { id: 'gpt-4.1-mini',        label: 'GPT-4.1 Mini' },
];

const MODELS_COMPACT: ModelOption[] = [
  { id: 'gpt-4o-mini',         label: 'GPT-4o Mini' },
  { id: 'gpt-4.1-mini',        label: 'GPT-4.1 Mini' },
  { id: 'gpt-4.1-nano',        label: 'GPT-4.1 Nano' },
  { id: 'o4-mini',             label: 'o4-mini' },
];

const CUSTOM_VALUE = '__custom__';

// ─── ModelSelect: dropdown + optional free-text fallback ─────────────────────
function ModelSelect({
  label,
  description,
  value,
  onChange,
  options,
  optional,
  notSetLabel,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  options: ModelOption[];
  optional?: boolean;
  notSetLabel?: string;
}) {
  const isKnown = !value || options.some(o => o.id === value);
  const [custom, setCustom] = useState(!isKnown ? value : '');
  const selectValue = isKnown ? (value || '') : CUSTOM_VALUE;

  const handleSelect = (v: string) => {
    if (v === CUSTOM_VALUE) {
      onChange(custom);
    } else {
      setCustom('');
      onChange(v);
    }
  };

  const handleCustom = (v: string) => {
    setCustom(v);
    onChange(v);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-white to-gray-50">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        {optional && (
          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">Optional</span>
        )}
      </div>
      <p className="text-xs text-gray-600 mb-3">{description}</p>
      <select
        value={selectValue}
        onChange={(e) => handleSelect(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ink focus:border-ink bg-white"
      >
        {optional && <option value="">{notSetLabel ?? 'Not set (use fallback)'}</option>}
        {options.map(o => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
        <option value={CUSTOM_VALUE}>Custom model ID…</option>
      </select>
      {(selectValue === CUSTOM_VALUE || (!isKnown && value)) && (
        <input
          type="text"
          value={custom}
          onChange={(e) => handleCustom(e.target.value)}
          placeholder="e.g. gemma-4-e2b-heretic-uncensored-mlx"
          className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ink focus:border-ink bg-white font-mono"
        />
      )}
    </div>
  );
}

export function ModelSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const addToast = useToastStore(state => state.addToast);

  const [model, setModel] = useState('');
  const [modelThinking, setModelThinking] = useState('');
  const [modelVlm, setModelVlm] = useState('');
  const [modelCritique, setModelCritique] = useState('');
  const [modelCompact, setModelCompact] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [temperature, setTemperature] = useState(0.7);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const configData: Config = await apiClient.getConfig();
      setModel(configData.model || '');
      setModelThinking(configData.model_thinking || '');
      setModelVlm(configData.model_vlm || '');
      setModelCritique(configData.model_critique || '');
      setModelCompact(configData.model_compact || '');
      setApiBaseUrl(configData.api_base_url || '');
      setTemperature(configData.temperature ?? 0.7);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiClient.updateConfig({
        model: model || undefined,
        model_thinking: modelThinking || null,
        model_vlm: modelVlm || null,
        model_critique: modelCritique || null,
        model_compact: modelCompact || null,
        api_base_url: apiBaseUrl || null,
        temperature,
      });

      window.dispatchEvent(new CustomEvent('config-updated', {
        detail: { model, temperature },
      }));

      addToast('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      addToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-gray-600">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Endpoint Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-ink flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Five Model System</h4>
            <p className="text-xs text-blue-700 leading-relaxed">
              Configure different models for different tasks: <strong>Normal</strong> for standard coding,
              <strong> Thinking</strong> for complex reasoning, <strong>Critique</strong> for self-critique,
              <strong> Compact</strong> for context compaction, <strong>Vision</strong> for image processing.
              Optional models fall back: Critique → Thinking → Normal, Compact → Normal, Vision → disabled.
              Works with any OpenAI-compatible endpoint (LM Studio, Ollama, vLLM…).
            </p>
          </div>
        </div>
      </div>

      {/* API Base URL */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-white to-gray-50">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-900">API Base URL</span>
          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">Optional</span>
        </div>
        <p className="text-xs text-gray-600 mb-3">Leave blank for OpenAI. Set to your LM Studio / Ollama endpoint.</p>
        <input
          type="text"
          value={apiBaseUrl}
          onChange={(e) => setApiBaseUrl(e.target.value)}
          placeholder="http://127.0.0.1:1234/v1/chat/completions"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ink focus:border-ink bg-white font-mono"
        />
      </div>

      {/* Normal Model */}
      <ModelSelect
        label="Normal Model"
        description="Primary model for standard coding and general tasks"
        value={model}
        onChange={setModel}
        options={MODELS_GENERAL}
      />

      {/* Thinking Model */}
      <ModelSelect
        label="Thinking Model"
        description="Complex reasoning and planning (falls back to Normal if not set)"
        value={modelThinking}
        onChange={setModelThinking}
        options={MODELS_REASONING}
        optional
        notSetLabel="Use Normal Model"
      />

      {/* Critique Model */}
      <ModelSelect
        label="Critique Model"
        description="Self-critique of reasoning outputs (falls back to Thinking → Normal)"
        value={modelCritique}
        onChange={setModelCritique}
        options={[...MODELS_REASONING, ...MODELS_GENERAL]}
        optional
        notSetLabel="Use Thinking Model"
      />

      {/* Compact Model */}
      <ModelSelect
        label="Compact Model"
        description="Context compaction summaries (falls back to Normal)"
        value={modelCompact}
        onChange={setModelCompact}
        options={MODELS_COMPACT}
        optional
        notSetLabel="Use Normal Model"
      />

      {/* Vision Model */}
      <ModelSelect
        label="Vision Model"
        description="Image and screenshot analysis (vision disabled if not set)"
        value={modelVlm}
        onChange={setModelVlm}
        options={MODELS_VISION}
        optional
        notSetLabel="Vision Disabled"
      />

      {/* Temperature */}
      <div className="border-t border-gray-200 pt-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Global Settings</h3>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Temperature: {temperature.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Precise</span>
            <span>Balanced</span>
            <span>Creative</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-6 py-3 bg-ink hover:bg-ink/90 text-inverse-ink rounded-pill disabled:opacity-40 disabled:cursor-not-allowed transition-all font-[480] text-btn"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  );
}
