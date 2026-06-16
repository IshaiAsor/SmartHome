import type { Channel } from 'amqplib';
import { connect } from '@lattice/queue';
import { env } from './config/env.config';

// Single shared RabbitMQ channel, established at startup. device-gateway only
// publishes (camera frames → q.telemetry.arrived); it consumes nothing.
let channel: Channel | null = null;

export async function initQueue(): Promise<Channel> {
  channel = await connect(env.rabbitmqUrl);
  return channel;
}

export function getChannel(): Channel {
  if (!channel) throw new Error('queue not initialised — call initQueue() at startup');
  return channel;
}
