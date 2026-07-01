import db from '../config/db';
import { DeviceCapabilityTrait } from '@prisma/client';

export type ActionTypeTraitEntity = DeviceCapabilityTrait;

class ActionTypeTraitRepository {
  async GetByActionId(capabilityId: number): Promise<ActionTypeTraitEntity[]> {
    return db.deviceCapabilityTrait.findMany({ where: { capability_id: capabilityId } });
  }
}

export const actionTypeTraitRepository = new ActionTypeTraitRepository();
