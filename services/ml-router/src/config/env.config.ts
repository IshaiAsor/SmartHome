const port = parseInt(process.env['PORT'] ?? '3002', 10);
const rabbitmqUrl = process.env['RABBITMQ_URL'] ?? 'amqp://localhost';
const ollamaUrl = (process.env['OLLAMA_URL'] ?? 'http://localhost:11434').replace(/\/$/, '');
const onnxModelsDir = process.env['ONNX_MODELS_DIR'] ?? './models';
const logLevel = process.env['LOG_LEVEL'] ?? 'info';
const otelEndpoint = process.env['OTEL_EXPORTER_OTLP_ENDPOINT'];
const valkeyUrl = process.env['VALKEY_URL'] ?? process.env['REDIS_URL'] ?? 'redis://localhost:6379';
const valkeyUsername = process.env['VALKEY_USER'] ?? process.env['REDIS_USER'];
const valkeyPassword = process.env['VALKEY_PASSWORD'] ?? process.env['REDIS_PASSWORD'];
const valkeyConfig = {
  url:      process.env['VALKEY_URL'] ?? process.env['REDIS_URL'] ?? 'redis://localhost:6379',
  username: process.env['VALKEY_USER'] ?? process.env['REDIS_USER'],
  password: process.env['VALKEY_PASSWORD'] ?? process.env['REDIS_PASSWORD'],
};
export const env = { port, rabbitmqUrl, ollamaUrl, onnxModelsDir, logLevel, otelEndpoint, valkeyConfig };
