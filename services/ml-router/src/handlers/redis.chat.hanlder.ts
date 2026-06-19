import Redis from 'ioredis';
import { OllamaProviderService } from './ollama-provider.service.ts'; 
import { env } from './../config/env.config';
import { ChatOrchestratorService } from './chat-orchestrator.service';
import { initOTel } from '@lattice/otel';
import { createLogger } from '@lattice/logger';

const { metricsHandler } = initOTel('ml-router');
const log = createLogger('socket-server');

const redisUrl = env.valkeyConfig.url;
const jobSubscriber = new Redis(redisUrl,{
  username: env.valkeyConfig.username,
  password: env.valkeyConfig.password,
});
const resultPublisher = new Redis(redisUrl,{
  username: env.valkeyConfig.username,
  password: env.valkeyConfig.password,
});

const aiProvider = new OllamaProviderService(); 
const aiOrchestrator = new ChatOrchestratorService(aiProvider);

export async function initWorker() {
  await jobSubscriber.subscribe('chat:jobs');
  log.info('🤖 Dedicated AI Worker listening to Redis via ioredis...');

  jobSubscriber.on('message', async (channel, message) => {
    if (channel !== 'chat:jobs') return;

    const { requestId, messages,streamResult } = JSON.parse(message);
    const destinationChannel = `chat:response:${requestId}`;

    try {
      // Business Logic Interception / Guardrails go here
      const tokenStream = aiOrchestrator.handleUserConversation('system',streamResult,messages);

      for await (const token of tokenStream) {
        // Safely push raw chunks back out to the network
        await resultPublisher.publish(destinationChannel, token);
      }
      // Finalize stream
      await resultPublisher.publish(destinationChannel, '[DONE]');
    } catch (error) {
      log.error({error},`Execution error on request ${requestId}:`);
      await resultPublisher.publish(destinationChannel, 'An error occurred during text generation.');
      await resultPublisher.publish(destinationChannel, '[DONE]');
    }
  });
}

initWorker();