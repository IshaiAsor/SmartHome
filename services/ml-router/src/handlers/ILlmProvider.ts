export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  image?: string;
}

export interface ILlmProvider {
  generateStream(messages: ChatMessage[]): AsyncGenerator<string, void, unknown>;
}