export type AiProviderId = 'default' | 'openai' | 'anthropic' | 'gemini';

export interface AiProviderConfig {
  provider?: AiProviderId;
  model?: string;
  apiKey?: string;
}

export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

type ToolDefinition = {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters: Record<string, unknown>;
  };
};

export interface AiToolResult {
  content: string;
  toolCall?: {
    name: string;
    arguments: string;
  };
}

const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';

export function parseAiProviderConfig(value: unknown): AiProviderConfig {
  if (!value || typeof value !== 'object') return { provider: 'default' };
  const raw = value as Record<string, unknown>;
  const provider = typeof raw.provider === 'string' ? raw.provider : 'default';
  return {
    provider: provider === 'openai' || provider === 'anthropic' || provider === 'gemini' ? provider : 'default',
    model: typeof raw.model === 'string' ? raw.model.trim() : '',
    apiKey: typeof raw.apiKey === 'string' ? raw.apiKey.trim() : '',
  };
}

export function providerUnavailable(config: AiProviderConfig): string | null {
  if (!config.provider || config.provider === 'default') return null;
  if (!config.apiKey) return 'Add your API key in the provider menu, then try again.';
  if (!config.model) return 'Pick a model in the provider menu, then try again.';
  return null;
}

export async function runTextModel({
  config,
  system,
  messages,
  temperature,
  groqApiKey,
}: {
  config: AiProviderConfig;
  system: string;
  messages: AiChatMessage[];
  temperature: number;
  groqApiKey?: string;
}): Promise<string> {
  const result = await runModelWithTools({ config, system, messages, temperature, groqApiKey });
  return result.content;
}

export async function runModelWithTools({
  config,
  system,
  messages,
  temperature,
  tools,
  groqApiKey,
}: {
  config: AiProviderConfig;
  system: string;
  messages: AiChatMessage[];
  temperature: number;
  tools?: ToolDefinition[];
  groqApiKey?: string;
}): Promise<AiToolResult> {
  if (config.provider === 'openai') return runOpenAI({ config, system, messages, temperature, tools });
  if (config.provider === 'anthropic') return runAnthropic({ config, system, messages, temperature, tools });
  if (config.provider === 'gemini') return runGemini({ config, system, messages, temperature, tools });
  return runGroq({ system, messages, temperature, tools, apiKey: groqApiKey });
}

async function runGroq({
  system,
  messages,
  temperature,
  tools,
  apiKey,
}: {
  system: string;
  messages: AiChatMessage[];
  temperature: number;
  tools?: ToolDefinition[];
  apiKey?: string;
}): Promise<AiToolResult> {
  if (!apiKey) throw new Error('The default assistant is not configured yet.');
  const body: Record<string, unknown> = {
    model: DEFAULT_GROQ_MODEL,
    temperature,
    messages: [{ role: 'system', content: system }, ...messages],
  };
  if (tools?.length) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.text()).slice(0, 500) || 'Model request failed.');
  const data = await res.json();
  const message = data.choices?.[0]?.message ?? {};
  const toolCall = message.tool_calls?.[0];
  return {
    content: message.content || '',
    toolCall: toolCall?.function?.name
      ? { name: toolCall.function.name, arguments: toolCall.function.arguments || '{}' }
      : undefined,
  };
}

async function runOpenAI({
  config,
  system,
  messages,
  temperature,
  tools,
}: {
  config: AiProviderConfig;
  system: string;
  messages: AiChatMessage[];
  temperature: number;
  tools?: ToolDefinition[];
}): Promise<AiToolResult> {
  const body: Record<string, unknown> = {
    model: config.model,
    temperature,
    messages: [{ role: 'system', content: system }, ...messages],
  };
  if (tools?.length) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.text()).slice(0, 500) || 'OpenAI request failed.');
  const data = await res.json();
  const message = data.choices?.[0]?.message ?? {};
  const toolCall = message.tool_calls?.[0];
  return {
    content: message.content || '',
    toolCall: toolCall?.function?.name
      ? { name: toolCall.function.name, arguments: toolCall.function.arguments || '{}' }
      : undefined,
  };
}

async function runAnthropic({
  config,
  system,
  messages,
  temperature,
  tools,
}: {
  config: AiProviderConfig;
  system: string;
  messages: AiChatMessage[];
  temperature: number;
  tools?: ToolDefinition[];
}): Promise<AiToolResult> {
  const body: Record<string, unknown> = {
    model: config.model,
    max_tokens: 4096,
    temperature,
    system,
    messages: messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
  };
  if (tools?.length) {
    body.tools = tools.map((tool) => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters,
    }));
    body.tool_choice = { type: 'auto' };
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.text()).slice(0, 500) || 'Anthropic request failed.');
  const data = await res.json();
  const blocks: Array<{ type?: string; text?: string; name?: string; input?: unknown }> = Array.isArray(data.content) ? data.content : [];
  const text = blocks.filter((b) => b?.type === 'text').map((b) => b.text).join('\n').trim();
  const toolUse = blocks.find((b) => b?.type === 'tool_use');
  return {
    content: text,
    toolCall: toolUse?.name ? { name: toolUse.name, arguments: JSON.stringify(toolUse.input ?? {}) } : undefined,
  };
}

async function runGemini({
  config,
  system,
  messages,
  temperature,
  tools,
}: {
  config: AiProviderConfig;
  system: string;
  messages: AiChatMessage[];
  temperature: number;
  tools?: ToolDefinition[];
}): Promise<AiToolResult> {
  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: system }] },
    generationConfig: { temperature },
    contents: messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
  };
  if (tools?.length) {
    body.tools = [{
      functionDeclarations: tools.map((tool) => ({
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters,
      })),
    }];
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model || '')}:generateContent?key=${encodeURIComponent(config.apiKey || '')}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.text()).slice(0, 500) || 'Gemini request failed.');
  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter((p: { text?: string }) => p.text).map((p: { text: string }) => p.text).join('\n').trim();
  const functionCall = parts.find((p: { functionCall?: { name?: string; args?: unknown } }) => p.functionCall)?.functionCall;
  return {
    content: text,
    toolCall: functionCall?.name
      ? { name: functionCall.name, arguments: JSON.stringify(functionCall.args ?? {}) }
      : undefined,
  };
}
