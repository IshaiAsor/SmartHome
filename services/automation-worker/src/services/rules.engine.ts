import { Channel } from 'amqplib';
import { publish, RK } from '@lattice/queue';
import type { ActionDispatchPayload } from '@lattice/queue';
import { createLogger } from '@lattice/logger';
import { userRulesRepository, UserRuleWithDetails } from '../dal/user.rules.repository';
import { userDevicesRepository } from '../dal/user.devices.repository';
import { userDevicesActionsRepository } from '../dal/user.devices.actions.repository';

const log = createLogger('automation-worker');

type ScheduleParams   = { time?: string; days?: number[] };
type StateParams      = { user_device_action_id?: number; operator?: string; value?: string };
type DeviceStatusParams = { user_device_id?: number; status?: string };

class RulesEngine {

  async evaluateForUser(ch: Channel, userId: number): Promise<void> {
    try {
      const rules = await userRulesRepository.getEnabledByUserId(userId);
      for (const rule of rules) {
        if (!this.isCooldownExpired(rule)) continue;
        const triggered = await this.evaluateRule(rule);
        if (triggered) {
          await this.executeRule(ch, userId, rule);
          await userRulesRepository.updateLastTriggered(rule.id);
        }
      }
    } catch (err) {
      log.error({ err, userId }, 'error evaluating rules for user');
    }
  }

  async evaluateScheduledRules(ch: Channel): Promise<void> {
    try {
      const userIds = await userRulesRepository.getUserIdsWithScheduledRules();
      for (const userId of userIds) {
        await this.evaluateForUser(ch, userId);
      }
    } catch (err) {
      log.error({ err }, 'error evaluating scheduled rules');
    }
  }

  private isCooldownExpired(rule: UserRuleWithDetails): boolean {
    if (!rule.last_triggered) return true;
    const elapsed = (Date.now() - rule.last_triggered.getTime()) / 1000;
    return elapsed >= rule.cooldown_seconds;
  }

  private async evaluateRule(rule: UserRuleWithDetails): Promise<boolean> {
    const results = await Promise.all(rule.conditions.map((c: { condition_type: string; parameters: unknown }) => this.evaluateCondition(c)));
    return rule.condition_operator === 'AND' ? results.every(Boolean) : results.some(Boolean);
  }

  private async evaluateCondition(condition: { condition_type: string; parameters: unknown }): Promise<boolean> {
    const params = condition.parameters as StateParams & ScheduleParams;

    if (condition.condition_type === 'schedule') {
      return this.matchesScheduleNow(params);
    }

    if (condition.condition_type === 'device_state' || condition.condition_type === 'device_status') {
      const p = params as unknown as DeviceStatusParams;
      const deviceId = p.user_device_id;
      const expected = p.status ?? (params as any).value;
      if (!deviceId || !expected) return false;
      try {
        const device = await userDevicesRepository.getById(deviceId);
        return expected === 'online' ? !!device.online : !device.online;
      } catch {
        return false;
      }
    }

    if (condition.condition_type === 'vlm_result' || condition.condition_type === 'vlm_decision') {
      log.warn({ condition_type: condition.condition_type }, 'vlm conditions not yet supported — F8 pending');
      return false;
    }

    if (!params.user_device_action_id || !params.operator || params.value === undefined) return false;

    const action = await userDevicesActionsRepository.getById(params.user_device_action_id);
    if (!action) return false;

    const currentState = action.current_state ?? '';

    if (condition.condition_type === 'threshold') {
      const current = parseFloat(currentState);
      const target  = parseFloat(params.value);
      if (isNaN(current) || isNaN(target)) return false;
      return this.compare(current, params.operator, target);
    }

    return false;
  }

  private matchesScheduleNow(params: ScheduleParams): boolean {
    if (!params.time) return false;
    const now = new Date();
    const hh  = now.getHours().toString().padStart(2, '0');
    const mm  = now.getMinutes().toString().padStart(2, '0');
    if (`${hh}:${mm}` !== params.time) return false;
    if (!params.days || params.days.length === 0) return true;
    return params.days.includes(now.getDay());
  }

  private compare(a: number, op: string, b: number): boolean {
    switch (op) {
      case '>':  return a > b;
      case '<':  return a < b;
      case '>=': return a >= b;
      case '<=': return a <= b;
      case '=':  return a === b;
      case '!=': return a !== b;
      default:   return false;
    }
  }

  private async executeRule(ch: Channel, userId: number, rule: UserRuleWithDetails): Promise<void> {
    for (const ruleAction of rule.actions) {
      const dispatch = async () => {
        try {
          const uda = await userDevicesActionsRepository.getByIdFull(ruleAction.user_device_action_id);
          if (!uda) {
            log.warn({ actionId: ruleAction.user_device_action_id }, 'rule action target not found');
            return;
          }
          const payload: ActionDispatchPayload = {
            userId:          String(userId),
            deviceId:        String(uda.user_device_id),
            actionName:      uda.mqtt_action_name,
            command:         { value: ruleAction.target_state, duration: '*' },
            firmwareVersion: uda.user_device.device.version ?? undefined,
          };
          await publish(ch, RK.ACTION_DISPATCH, payload);
          log.info({ rule: rule.name, actionId: ruleAction.user_device_action_id, target: ruleAction.target_state }, 'rule fired');
        } catch (err) {
          log.error({ err, rule: rule.name, actionId: ruleAction.user_device_action_id }, 'error executing rule action');
        }
      };

      if (ruleAction.delay_seconds > 0) {
        setTimeout(dispatch, ruleAction.delay_seconds * 1000);
      } else {
        await dispatch();
      }
    }
  }
}

export const rulesEngine = new RulesEngine();
