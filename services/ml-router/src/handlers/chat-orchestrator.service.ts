import { createLogger } from '@lattice/logger';
import { ILlmProvider, ChatMessage } from './ILlmProvider';
import { initOTel } from '@lattice/otel';

const log = createLogger('ml-router:chat-orchestrator');

export class ChatOrchestratorService {
  // Injected via constructor composition (clean dependency injection)
  constructor(private readonly llmProvider: ILlmProvider) {}

  public async *handleUserConversation(
    userId: string, 
    stream:boolean,
    userHistory: ChatMessage[]
    ): AsyncGenerator<string, void, unknown> {
    
    log.info({userHistory},'Message accepted');
    // 1. Enforce Business Rule: Inject strict system-level guards
    const sanitizedHistory = this.enforceGuardrails(userHistory);

    // 2. Stream directly from the abstracted provider
    const tokenStream = this.llmProvider.generateStream(sanitizedHistory);

    let fullResponseText = '';
    
    for await (const token of tokenStream) {
      fullResponseText += token;
      yield token;
    }
    log.info({userHistory,fullResponseText},'Messages history, model result');  
  }

  private enforceGuardrails(history: ChatMessage[]): ChatMessage[] {
    // Strip malicious client-side injection attempts
    const cleaned = history.filter(msg => msg.role !== 'system');
    
    const systemPrompt: ChatMessage = {
      role: 'system',
      content: 'You are a clean, secure enterprise core engine assistant. Respond using strict Markdown.'
    };

    return [systemPrompt, ...cleaned];
  }
}