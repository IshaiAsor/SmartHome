import db from '../config/db';
import type { EmergencyRule, EmergencyEvent } from '@prisma/client';

export type EmergencyRuleFull = EmergencyRule & {
  sensor_action: { action_name: string };
};

export type CreateEmergencyRuleInput = {
  user_id: number;
  name: string;
  user_device_action_id: number;
  operator: string;
  threshold_value: string;
  target_action_id?: number;
  target_state?: string;
};

class EmergencyRepository {
  async getByUserId(userId: number): Promise<EmergencyRuleFull[]> {
    return db.emergencyRule.findMany({
      where: { user_id: userId },
      include: { sensor_action: { select: { action_name: true } } },
      orderBy: { created_at: 'asc' },
    }) as Promise<EmergencyRuleFull[]>;
  }

  async getEnabledByActionId(actionId: number): Promise<EmergencyRule[]> {
    return db.emergencyRule.findMany({
      where: { user_device_action_id: actionId, enabled: true },
    });
  }

  async create(data: CreateEmergencyRuleInput): Promise<EmergencyRule> {
    return db.emergencyRule.create({ data });
  }

  async toggle(id: number, userId: number, enabled: boolean): Promise<void> {
    await db.emergencyRule.updateMany({ where: { id, user_id: userId }, data: { enabled } });
  }

  async delete(id: number, userId: number): Promise<void> {
    await db.emergencyRule.deleteMany({ where: { id, user_id: userId } });
  }

  async logEvent(ruleId: number, triggeredValue: string): Promise<EmergencyEvent> {
    return db.emergencyEvent.create({ data: { emergency_rule_id: ruleId, triggered_value: triggeredValue } });
  }

  async getRecentEvents(userId: number, limit = 50): Promise<EmergencyEvent[]> {
    return db.emergencyEvent.findMany({
      where: { rule: { user_id: userId } },
      include: { rule: { select: { name: true } } },
      orderBy: { fired_at: 'desc' },
      take: limit,
    }) as Promise<EmergencyEvent[]>;
  }
}

export const emergencyRepository = new EmergencyRepository();
