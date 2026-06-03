'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, KeyRound, Link as LinkIcon, Sparkles } from 'lucide-react';

export type AiProviderId = 'default' | 'openai' | 'anthropic' | 'gemini';

export interface AiProviderSelection {
  provider: AiProviderId;
  model: string;
  apiKey: string;
}

interface ProviderOption {
  id: AiProviderId;
  name: string;
  subtitle: string;
  logo: 'chain' | 'openai' | 'anthropic' | 'gemini';
  models: string[];
}

const STORAGE_KEY = 'dealvault-ai-provider';

const PROVIDERS: ProviderOption[] = [
  {
    id: 'default',
    name: 'ChainMind default',
    subtitle: 'llama-3.3-70b-versatile',
    logo: 'chain',
    models: ['llama-3.3-70b-versatile'],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    subtitle: 'GPT-5 series',
    logo: 'openai',
    models: ['gpt-5.2', 'gpt-5.2-chat-latest', 'gpt-5.1', 'gpt-5-mini', 'gpt-5-nano'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic - Claude',
    subtitle: 'Claude 4 series',
    logo: 'anthropic',
    models: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5'],
  },
  {
    id: 'gemini',
    name: 'Google - Gemini',
    subtitle: 'Gemini 2.5',
    logo: 'gemini',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'],
  },
];

function defaultSelection(): AiProviderSelection {
  return {
    provider: 'default',
    model: PROVIDERS[0].models[0],
    apiKey: '',
  };
}

function readSelection(): AiProviderSelection {
  if (typeof window === 'undefined') return defaultSelection();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSelection();
    const parsed = JSON.parse(raw) as Partial<AiProviderSelection>;
    const provider = PROVIDERS.some((item) => item.id === parsed.provider) ? parsed.provider as AiProviderId : 'default';
    const option = PROVIDERS.find((item) => item.id === provider) ?? PROVIDERS[0];
    const model = parsed.model && option.models.includes(parsed.model) ? parsed.model : option.models[0];
    return { provider, model, apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '' };
  } catch {
    return defaultSelection();
  }
}

export function getStoredAiProviderSelection(): AiProviderSelection {
  return readSelection();
}

function saveSelection(selection: AiProviderSelection) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
  window.dispatchEvent(new CustomEvent('dealvault:ai-provider-changed', { detail: selection }));
}

export function useAiProviderSelection(): AiProviderSelection {
  const [selection, setSelection] = useState<AiProviderSelection>(() => readSelection());

  useEffect(() => {
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<AiProviderSelection>).detail;
      setSelection(detail ?? readSelection());
    };
    window.addEventListener('dealvault:ai-provider-changed', onChange);
    return () => window.removeEventListener('dealvault:ai-provider-changed', onChange);
  }, []);

  return selection;
}

function ProviderLogo({ logo }: { logo: ProviderOption['logo'] }) {
  if (logo === 'chain') return <LinkIcon size={16} className="dv-ai-logo-chain" />;
  if (logo === 'openai') return <span className="dv-ai-logo-openai">◎</span>;
  if (logo === 'anthropic') return <span className="dv-ai-logo-anthropic">AI</span>;
  return <Sparkles size={17} className="dv-ai-logo-gemini" />;
}

export default function AiProviderPicker() {
  const [selection, setSelection] = useState<AiProviderSelection>(() => readSelection());
  const [open, setOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AiProviderId | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const activeProvider = useMemo(
    () => PROVIDERS.find((provider) => provider.id === selection.provider) ?? PROVIDERS[0],
    [selection.provider],
  );
  const editing = editingProvider ? PROVIDERS.find((provider) => provider.id === editingProvider) : null;

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
        setEditingProvider(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const chooseDefault = () => {
    const next = defaultSelection();
    setSelection(next);
    saveSelection(next);
    setOpen(false);
    setEditingProvider(null);
  };

  const openByok = (provider: ProviderOption) => {
    setEditingProvider(provider.id);
    setSelection((current) => ({
      provider: provider.id,
      model: provider.models.includes(current.model) ? current.model : provider.models[0],
      apiKey: current.provider === provider.id ? current.apiKey : '',
    }));
  };

  const useByok = () => {
    if (!editing) return;
    const next = {
      provider: editing.id,
      model: selection.model || editing.models[0],
      apiKey: selection.apiKey.trim(),
    };
    setSelection(next);
    saveSelection(next);
    setOpen(false);
    setEditingProvider(null);
  };

  return (
    <div className="dv-ai-provider-wrap" ref={wrapRef}>
      <button
        type="button"
        className="dv-ai-provider-trigger"
        onClick={() => { setOpen((value) => !value); setEditingProvider(null); }}
        title="Choose AI provider"
      >
        <ProviderLogo logo={activeProvider.logo} />
        <span>{selection.provider === 'default' ? 'Default' : activeProvider.name.split(' ')[0]}</span>
        <ChevronDown size={13} />
      </button>

      {open && (
        <div className="dv-ai-provider-menu">
          {!editing ? (
            <>
              {PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  className="dv-ai-provider-option"
                  onClick={() => provider.id === 'default' ? chooseDefault() : openByok(provider)}
                >
                  <ProviderLogo logo={provider.logo} />
                  <span className="dv-ai-provider-copy">
                    <b>{provider.name}</b>
                    <small>{provider.id === 'default' ? provider.subtitle : provider.models[0]}</small>
                  </span>
                  {selection.provider === provider.id && <Check size={16} className="dv-ai-provider-check" />}
                </button>
              ))}
            </>
          ) : (
            <div className="dv-ai-byok-panel">
              <div className="dv-ai-byok-head">
                <ProviderLogo logo={editing.logo} />
                <b>{editing.name}</b>
              </div>
              <label className="dv-ai-byok-field">
                <span>Model</span>
                <select
                  value={selection.model}
                  onChange={(event) => setSelection((current) => ({ ...current, model: event.target.value }))}
                >
                  {editing.models.map((model) => <option key={model} value={model}>{model}</option>)}
                </select>
              </label>
              <label className="dv-ai-byok-field">
                <span>API key</span>
                <input
                  value={selection.apiKey}
                  type="password"
                  spellCheck={false}
                  placeholder="API key"
                  onChange={(event) => setSelection((current) => ({ ...current, apiKey: event.target.value }))}
                />
              </label>
              <p className="dv-ai-byok-note">
                <KeyRound size={13} /> Stored only in your browser and sent per request.
              </p>
              <div className="dv-ai-byok-actions">
                <button type="button" className="dv-ai-byok-use" onClick={useByok} disabled={!selection.apiKey.trim()}>Use</button>
                <button type="button" className="dv-ai-byok-back" onClick={() => setEditingProvider(null)}>Back</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
