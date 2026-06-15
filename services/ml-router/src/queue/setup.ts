import type { Channel } from 'amqplib';
import { assertMlQueue, type PipelineStagePayload } from '@lattice/queue';
import { loadRegistry, type ModelConfig } from '../models';
import { runVlm } from '../handlers/vlm.handler';
import { runLlm } from '../handlers/llm.handler';
import { advancePipeline } from './advance-pipeline';
import type { Logger } from 'pino';

function makeConsumer(model: ModelConfig, ch: Channel, log: Logger) {
  return async (payload: PipelineStagePayload): Promise<void> => {
    const label = `${model.kind}/${model.name}/${model.version}`;
    log.info({ pipelineRunId: payload.pipelineRunId, stageId: payload.stageId }, `[${label}] stage received`);

    try {
      let output: Record<string, unknown>;
      if (model.kind === 'vlm') {
        const image = payload.context['image'] as string;
        if (!image) throw new Error('context.image missing for vlm stage');
        const result = await runVlm(model, { image });
        output = result as unknown as Record<string, unknown>;
      } else {
        const prompt = payload.context['prompt'] as string;
        if (!prompt) throw new Error('context.prompt missing for llm stage');
        const result = await runLlm(model, {
          prompt,
          image:   payload.context['image'] as string | undefined,
          context: payload.context['sensor_data'] as Record<string, unknown> | undefined,
        });
        output = result as unknown as Record<string, unknown>;
      }
      await advancePipeline(ch, payload, output);
      log.info({ pipelineRunId: payload.pipelineRunId }, `[${label}] stage completed`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ pipelineRunId: payload.pipelineRunId, err: message }, `[${label}] stage failed`);
      await advancePipeline(ch, payload, null, message);
    }
  };
}

export async function setupModelQueues(ch: Channel, log: Logger): Promise<void> {
  const registry = loadRegistry();
  for (const model of registry.values()) {
    const prefetch = model.kind === 'llm' ? 1 : 4;
    const queue = await assertMlQueue(ch, model.kind, model.name, model.version, prefetch);
    const consumer = makeConsumer(model, ch, log);

    await ch.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString()) as PipelineStagePayload;
        await consumer(payload);
        ch.ack(msg);
      } catch {
        ch.nack(msg, false, false);
      }
    });

    log.info({ queue, model: `${model.kind}/${model.name}/${model.version}` }, 'model queue ready');
  }
}
