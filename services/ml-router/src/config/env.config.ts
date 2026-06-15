const port = parseInt(process.env['PORT'] ?? '3002', 10);
const rabbitmqUrl = process.env['RABBITMQ_URL'] ?? 'amqp://localhost';
const ollamaUrl = (process.env['OLLAMA_URL'] ?? 'http://localhost:11434').replace(/\/$/, '');
const onnxModelsDir = process.env['ONNX_MODELS_DIR'] ?? './models';
const logLevel = process.env['LOG_LEVEL'] ?? 'info';
const otelEndpoint = process.env['OTEL_EXPORTER_OTLP_ENDPOINT'];

export const env = { port, rabbitmqUrl, ollamaUrl, onnxModelsDir, logLevel, otelEndpoint };
