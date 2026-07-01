import { db, DeviceCapabilityTrait } from '@lattice/prisma-client';

export type CapabilityTraitEntity = DeviceCapabilityTrait;

class CapabilityTraitRepository {
  async GetByCapabilityId(capabilityId: number): Promise<CapabilityTraitEntity[]> {
    return db.deviceCapabilityTrait.findMany({ where: { capability_id: capabilityId } });
  }
}

export const capabilityTraitRepository = new CapabilityTraitRepository();
