import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';

export { trace, context, SpanStatusCode } from '@opentelemetry/api';
export { pinoMixin } from './mixin';

let _sdk: NodeSDK | undefined;

export function initOTel(serviceName: string): void {
  const endpoint = process.env['OTEL_EXPORTER_OTLP_ENDPOINT'];
  if (!endpoint) return;

  _sdk = new NodeSDK({
    serviceName,
    traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
  });

  _sdk.start();

  process.on('SIGTERM', async () => {
    await _sdk?.shutdown().catch(() => {});
  });
}
