// backoffice/src/app/services/device-socket.service.ts
import { inject, Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, fromEvent } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
@Injectable({
  providedIn: 'root'
})
export class DeviceSocketService {
  private authService = inject(AuthService);
  private socket: Socket;

  readonly actionStateUpdate$: Observable<{ actionId: number, state: unknown, commandId?: string }>;
  readonly deviceOnlineStatusChange$: Observable<{ deviceId: number, online: boolean }>;
  readonly actionStatePending$: Observable<{ actionId: number, commandId: string, state: unknown }>;
  readonly actionStateFailed$: Observable<{ actionId: number, commandId: string, lastState?: unknown }>;

  constructor() {
    const socketUrl = environment.socketUrl ||
    (environment.production ? `${window.location.protocol}//socket.${window.location.hostname}` : '');
    this.socket = io(socketUrl, {
      auth: {
        token: this.authService.getToken()
      }
    });

    this.actionStateUpdate$ = fromEvent<{ actionId: number, state: unknown, commandId?: string }>(
      this.socket as any, 'action_state_update'
    );
    this.deviceOnlineStatusChange$ = fromEvent<{ deviceId: number, online: boolean }>(
      this.socket as any, 'device_status_change'
    );
    this.actionStatePending$ = fromEvent<{ actionId: number, commandId: string, state: unknown }>(
      this.socket as any, 'action_state_pending'
    );
    this.actionStateFailed$ = fromEvent<{ actionId: number, commandId: string, lastState?: unknown }>(
      this.socket as any, 'action_state_failed'
    );
  }

  publishActionState(id: number, actionState: string) {
    console.log(`Publishing action state update for action ${id} with state ${actionState}`);
    this.socket.emit('action_state_update', { actionId: id, state: actionState });
  }

  onDeviceOnlineStatusChange(): Observable<{ deviceId: number, online: boolean }> {
    return this.deviceOnlineStatusChange$;
  }

  onActionStateUpdate(): Observable<{ actionId: number, state: unknown, commandId?: string }> {
    return this.actionStateUpdate$;
  }

  // A command was dispatched and is awaiting the device's ack. Confirmed state arrives
  // later via onActionStateUpdate; if the device never acks, onActionStateFailed fires.
  onActionStatePending(): Observable<{ actionId: number, commandId: string, state: unknown }> {
    return this.actionStatePending$;
  }

  // The device rejected the command or never acked within the timeout — no state changed.
  onActionStateFailed(): Observable<{ actionId: number, commandId: string, lastState?: unknown }> {
    return this.actionStateFailed$;
  }

  disconnect() {
    this.socket.disconnect();
  }
}
