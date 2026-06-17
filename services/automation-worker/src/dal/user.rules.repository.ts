import { db, UserRule, UserRuleCondition, UserRuleAction } from '@lattice/prisma-client';

export type UserRuleWithDetails = UserRule & {
  conditions: UserRuleCondition[];
  actions: UserRuleAction[];
};

class UserRulesRepository {
  async getEnabledByUserId(userId: number): Promise<UserRuleWithDetails[]> {
    return db.userRule.findMany({
      where: { user_id: userId, enabled: true },
      include: { conditions: true, actions: true },
    }) as Promise<UserRuleWithDetails[]>;
  }

  async getUserIdsWithScheduledRules(): Promise<number[]> {
    const rules = await db.userRule.findMany({
      where: {
        enabled: true,
        conditions: { some: { condition_type: 'schedule' } },
      },
      select: { user_id: true },
      distinct: ['user_id'],
    });
    return rules.map((r) => r.user_id);
  }

  async updateLastTriggered(id: number): Promise<void> {
    await db.userRule.update({ where: { id }, data: { last_triggered: new Date(), updated_at: new Date() } });
  }
}

export const userRulesRepository = new UserRulesRepository();
