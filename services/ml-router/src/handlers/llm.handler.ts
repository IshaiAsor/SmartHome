import { env } from '../config/env.config';
import type { ModelConfig } from '../models';

export interface LlmInput {
  prompt: string;
  image?: string;
  context?: Record<string, unknown>;
}
export interface LlmOutput { text: string }

type MessageContent = string | Array<{ type: string; text?: string; image_url?: { url: string } }>;

export async function runLlm(model: ModelConfig, input: LlmInput): Promise<LlmOutput> {
  const ollamaModel = model.ollamaModel ?? model.name;
  const baseUrl = env.ollamaUrl;

  let content: MessageContent;
  if (input.image) {
    content = [
      { type: 'text', text: input.prompt },
      { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${input.image}` } },
    ];
  } else {
    content = input.prompt;
  }

  const messages = [{ role: 'user', content }];

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: ollamaModel, messages, stream: false }),
  });

  if (!res.ok) throw new Error(`LLM error: ${res.status} ${await res.text()}`);
  const body = await res.json() as { choices: Array<{ message: { content: string } }> };
  const text = body.choices[0]?.message.content ?? '';
  return { text };
}
