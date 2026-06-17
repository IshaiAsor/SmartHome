import { valkey, keys } from './valkey';

// Context for an in-flight command awaiting the device's ack. Stored in Valkey keyed by
// commandId so either the ack consumer or the timeout can resolve it — whichever calls
// takePending first wins (atomic GETDEL), guaranteeing the UI is settled exactly once.
export interface PendingCommand {
  userId:     string;
  actionId:   number;
  deviceId:   string;
  actionName: string;
  value:      unknown;
}

// Persist the pending command with a TTL slightly longer than the ack timeout, so a
// crashed/restarted process never leaves a dangling key.
export async function setPending(
  commandId: string,
  pending: PendingCommand,
  ttlSeconds: number,
): Promise<void> {
  await valkey.set(keys.pendingCommand(commandId), JSON.stringify(pending), 'EX', ttlSeconds);
}

// Atomically read-and-delete the pending record. Returns null if it was already taken
// (resolved by the other path) or never existed. GETDEL is the single arbiter between
// the ack consumer and the timeout firing.
export async function takePending(commandId: string): Promise<PendingCommand | null> {
  const raw = await valkey.getdel(keys.pendingCommand(commandId));
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as PendingCommand;
  } catch {
    return null;
  }
}
