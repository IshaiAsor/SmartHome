import db from '../config/db';
import { ActionTypeTrait } from '@prisma/client';

export type ActionTypeTraitEntity = ActionTypeTrait;

class ActionTypeTraitRepository {
  async GetByActionId(actionId: number): Promise<ActionTypeTraitEntity[]> {
    return db.actionTypeTrait.findMany({ where: { device_action_type_id: actionId } });
  }
}

export const actionTypeTraitRepository = new ActionTypeTraitRepository();
