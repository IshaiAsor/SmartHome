// In-process timers for in-flight commands. When a command is dispatched we arm a timer;
// the ack consumer clears it on arrival. If it fires first, the command is considered
// failed (the device never confirmed). The Valkey pending record (see cache/pending.ts)
// is the source of truth — the timer only schedules the check.
//
// Caveat: timers live in process memory, so a restart drops in-flight timers. The Valkey
// key still expires via TTL, but no `failed` emit fires for commands that were in flight
// across the restart; the UI clears on the next state refresh. Acceptable for now.
const timers = new Map<string, NodeJS.Timeout>();

export function arm(commandId: string, ms: number, onTimeout: () => void): void {
  clear(commandId);
  const handle = setTimeout(() => {
    timers.delete(commandId);
    onTimeout();
  }, ms);
  // Don't keep the event loop alive solely for a pending command timer.
  handle.unref?.();
  timers.set(commandId, handle);
}

export function clear(commandId: string): void {
  const handle = timers.get(commandId);
  if (handle) {
    clearTimeout(handle);
    timers.delete(commandId);
  }
}
