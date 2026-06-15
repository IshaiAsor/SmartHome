import { trace } from '@opentelemetry/api';

export function pinoMixin(): Record<string, string | undefined> {
  const span = trace.getActiveSpan();
  if (!span) return {};
  const ctx = span.spanContext();
  return { traceId: ctx.traceId, spanId: ctx.spanId };
}
