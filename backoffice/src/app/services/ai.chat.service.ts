import { inject, Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type AiChatMode = 'free'|'rules';

@Injectable({ providedIn: 'root' })
export class ChatSocketService {
  private authService = inject(AuthService);
  private socket: Socket;
  
  readonly messages = signal<ChatMessage[]>([]);
  readonly isTyping = signal<boolean>(false);

  constructor() {
    const socketUrl =
      environment.socketUrl ||
      (environment.production
        ? `${window.location.protocol}//socket.${window.location.hostname}`
        : '');
    this.socket = io(socketUrl, {
      auth: {
        token: this.authService.getToken(),
      },
    });
    this.initializeListeners();
  }

  private initializeListeners() {
    // Listen for incremental real-time text chunks
    this.socket.on('chat:token', (token: string) => {
      this.messages.update((messages) => {
        const updated = [...messages];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex]?.role === 'assistant') {
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: updated[lastIndex].content + token,
          };
        }
        return updated;
      });
    });

    // Listen for completion signal
    this.socket.on('chat:done', () => {
      this.isTyping.set(false);
    });
  }

  public sendMessage(text: string, chatMode:AiChatMode ) {
    if (!text.trim()) return;

    // Push local UI updates immediately
    this.messages.update((prev) => [
      ...prev,
      { role: 'user', content: text,chatMode },
      { role: 'assistant', content: '' }, // Stream target placeholder
    ]);

    this.isTyping.set(true);

    // Emit event up to the BFF Gateway
    this.socket.emit('chat:request', {
      chatMode,
      messages: this.messages().slice(0, -1), // Exclude placeholder from history
    });
  }
}
