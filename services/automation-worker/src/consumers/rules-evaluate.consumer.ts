import { Channel } from 'amqplib';
import type { RulesEvaluatePayload } from '@lattice/queue';
import { rulesEngine } from '../services/rules.engine';

export function rulesEvaluateConsumer(ch: Channel) {
  return async (payload: RulesEvaluatePayload): Promise<void> => {
    await rulesEngine.evaluateForUser(ch, Number(payload.userId));
  };
}
