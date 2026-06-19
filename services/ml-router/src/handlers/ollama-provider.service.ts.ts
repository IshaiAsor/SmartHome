import { env } from '../config/env.config';
import { ILlmProvider, ChatMessage } from './ILlmProvider';
import { Ollama } from 'ollama';

export class OllamaProviderService implements ILlmProvider {
  private readonly modelName = 'qwen2.5vl:7b';
  private readonly ollamaClient: Ollama;

  constructor(){
    this.ollamaClient = new Ollama({
      host: env.ollamaUrl
    });
  }
  public async *generateStream(messages: ChatMessage[]): AsyncGenerator<string, void, unknown> {
    try {
      const responseStream = await this.ollamaClient.chat({
        
        model: this.modelName,
        messages: messages, // Map if types differ slightly, but ollama matches role/content
        stream: true,
        options: {
          num_ctx: 4096 // Keep hardware/model settings isolated here
        }
      });

      for await (const chunk of responseStream) {
        yield chunk.message.content;
      }
    } catch (error) {
      console.error('[OllamaProvider] Low-level model streaming error:', error);
      throw new Error('AI Model generation failed at the infrastructure layer.');
    }
  }
}