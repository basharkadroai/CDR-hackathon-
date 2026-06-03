'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, KeyRound } from 'lucide-react';
import Logo from './Logo';

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
    name: 'DealVault',
    subtitle: 'Built-in · Llama 3.3 70B',
    logo: 'chain',
    models: ['llama-3.3-70b-versatile'],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    subtitle: 'GPT-5 series',
    logo: 'openai',
    models: ['gpt-5.5', 'gpt-5.2', 'gpt-5.2-chat-latest', 'gpt-5.1', 'gpt-5-mini', 'gpt-5-nano'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic · Claude',
    subtitle: 'Claude 4 series',
    logo: 'anthropic',
    models: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5'],
  },
  {
    id: 'gemini',
    name: 'Google · Gemini',
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
  if (logo === 'chain') return <span className="dv-ai-logo"><Logo size={15} /></span>;
  if (logo === 'openai') {
    return (
      <span className="dv-ai-logo" style={{ color: 'var(--dv-text)' }}>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
          <path d="M22.28 9.82a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9A6 6 0 0 0 4.98 4.18a5.98 5.98 0 0 0-3.998 2.9 6.05 6.05 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zM8.305 12.863l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
        </svg>
      </span>
    );
  }
  if (logo === 'anthropic') {
    return (
      <span className="dv-ai-logo" style={{ color: '#D97757' }}>
        <svg viewBox="0 0 46 32" width="15" height="15" fill="currentColor" aria-hidden="true">
          <path d="M32.73 0h-6.94l12.65 32h6.94L32.73 0zM13.27 0L.62 32h7.08l2.59-6.72h13.24L26.12 32h7.08L20.53 0h-7.26zm-.94 19.34l4.34-11.26 4.34 11.26h-8.68z" />
        </svg>
      </span>
    );
  }
  return (
    <span className="dv-ai-logo">
      <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
        <defs><linearGradient id="dv-gemini" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4285F4" /><stop offset="50%" stopColor="#9B72CB" /><stop offset="100%" stopColor="#D96570" />
        </linearGradient></defs>
        <path d="M12 0c.5 6.26 5.74 11.5 12 12-6.26.5-11.5 5.74-12 12-.5-6.26-5.74-11.5-12-12C6.26 11.5 11.5 6.26 12 0z" fill="url(#dv-gemini)" />
      </svg>
    </span>
  );
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
