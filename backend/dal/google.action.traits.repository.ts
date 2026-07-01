import db from '../config/db';
import { GoogleDeviceTrait } from '@prisma/client';

export type GoogleTraitTypeEntity = GoogleDeviceTrait;

class GoogleTraitsRepository {
  async getById(traitId: number): Promise<GoogleTraitTypeEntity | null> {
    return db.googleDeviceTrait.findUnique({ where: { id: traitId } });
  }

  async getAll(): Promise<GoogleTraitTypeEntity[]> {
    return db.googleDeviceTrait.findMany();
  }

  async upsertTraitsForCapability(
    capabilityId: number,
    traitIds: number[],
    defaultTraitId?: number,
  ): Promise<void> {
    await db.deviceCapabilityTrait.deleteMany({ where: { capability_id: capabilityId } });
    if (traitIds.length > 0) {
      await db.deviceCapabilityTrait.createMany({
        data: traitIds.map((google_trait_id) => ({
          capability_id: capabilityId,
          google_trait_id,
          is_default: google_trait_id === defaultTraitId,
        })),
        skipDuplicates: true,
      });
    }
  }

  async setDefaultTrait(capabilityId: number, traitId: number): Promise<void> {
    await db.$transaction([
      db.deviceCapabilityTrait.updateMany({
        where: { capability_id: capabilityId },
        data: { is_default: false },
      }),
      db.deviceCapabilityTrait.updateMany({
        where: { capability_id: capabilityId, google_trait_id: traitId },
        data: { is_default: true },
      }),
    ]);
  }
}

export const googleTraitsRepository = new GoogleTraitsRepository();
